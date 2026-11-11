'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

// 종목 화면 목차 — 화면의 제목(h1~h4)을 자동으로 모아 목록으로 보여 주고, 누르면 그 자리로 이동한다.
// 넓은 화면(1280px 이상): 오른쪽에 고정된 목차 / 휴대폰: 오른쪽 아래 '목차' 버튼 → 아래에서 올라오는 목록.
// 접힌 칸(<details>) 안의 제목은 보이지 않으니 빼고, 칸을 펼치면 다시 모은다.

type Item = { id: string; text: string; level: 0 | 1 }

const clean = (t: string) => t.replace(/\s+/g, ' ').replace(/(접기|펼치기)\s*[▲▼]?$/, '').replace(/\(눌러서 펼치기\)/, '').trim()
const visible = (el: HTMLElement) => el.getClientRects().length > 0 && !el.closest('details:not([open]) > :not(summary)')

export default function PageToc({ rootId, resetKey }: { rootId: string; resetKey: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [active, setActive] = useState('')
  const [open, setOpen] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)
  const sheetRef = useRef<HTMLDivElement | null>(null)

  const offset = () => ((document.querySelector('header') as HTMLElement | null)?.offsetHeight ?? 0) + 12

  const scan = useCallback(() => {
    const root = document.getElementById(rootId)
    if (!root) return
    const hs = [...root.querySelectorAll<HTMLElement>('h1, h2, h3, h4')].filter(h => !h.closest('[data-toc-skip]') && visible(h))
    const next: Item[] = []
    hs.forEach((h, i) => {
      const text = clean(h.textContent ?? '')
      if (!text) return
      if (!h.id) h.id = `toc-${i}-${text.slice(0, 12).replace(/[^\p{L}\p{N}]+/gu, '-')}`
      next.push({ id: h.id, text: text.length > 42 ? text.slice(0, 41) + '…' : text, level: h.tagName === 'H4' ? 1 : 0 })
    })
    setItems(prev => (prev.length === next.length && prev.every((p, k) => p.id === next[k].id && p.text === next[k].text) ? prev : next))
  }, [rootId])

  // 처음·종목이 바뀔 때·내용이 늦게 들어올 때(리포트 데이터) 다시 모은다. 시계가 0.1초마다 바뀌니 1초에 한 번만.
  useEffect(() => {
    setItems([]); setActive('')
    const root = document.getElementById(rootId)
    let last = 0, timer: ReturnType<typeof setTimeout> | null = null
    const run = () => { last = Date.now(); timer = null; scan() }
    const schedule = () => { if (timer) return; timer = setTimeout(run, Math.max(0, 1000 - (Date.now() - last))) }
    run()
    const mo = root ? new MutationObserver(schedule) : null
    mo?.observe(root!, { childList: true, subtree: true, attributes: true, attributeFilter: ['open'] })
    const onToggle = () => schedule()
    document.addEventListener('toggle', onToggle, true)
    return () => { mo?.disconnect(); if (timer) clearTimeout(timer); document.removeEventListener('toggle', onToggle, true) }
  }, [rootId, resetKey, scan])

  // 지금 읽는 곳 표시
  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const y = offset() + 8
        let cur = items[0]?.id ?? ''
        for (const it of items) {
          const el = document.getElementById(it.id)
          if (el && el.getBoundingClientRect().top <= y) cur = it.id
          else if (el) break
        }
        setActive(cur)
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); cancelAnimationFrame(raf) }
  }, [items])

  // 목록 안에서 지금 위치가 보이게 — 단, 사용자가 목록을 직접 움직였으면 4초 동안은 그대로 두고,
  // 지금 위치가 목록 화면 밖으로 나갔을 때만 필요한 만큼만 움직인다(페이지 스크롤에 목록이 끌려가지 않게)
  // 한 번이라도 목록을 직접 움직이면 그 뒤로는 목록이 저절로 움직이지 않는다('지금 위치로' 버튼으로만)
  const [pinned, setPinned] = useState(false)
  const markTouched = () => setPinned(true)
  const follow = useCallback(() => {
    for (const box of [listRef.current, open ? sheetRef.current : null]) {
      const el = box?.querySelector<HTMLElement>(`[data-id="${active}"]`)
      if (!box || !el) continue
      const b = box.getBoundingClientRect(), r = el.getBoundingClientRect()
      if (r.top < b.top) box.scrollTop -= b.top - r.top + 24
      else if (r.bottom > b.bottom) box.scrollTop += r.bottom - b.bottom + 24
    }
  }, [active, open])
  useEffect(() => { if (!pinned) follow() }, [pinned, follow])

  const go = (id: string) => {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - offset(), behavior: 'smooth' })
    setOpen(false)
  }

  if (items.length < 3) return null
  // 지금 위치가 속한 큰 제목(바로 앞의 level 0)
  const ai = items.findIndex(i => i.id === active)
  let parent = -1
  for (let k = ai; k >= 0; k--) if (items[k].level === 0) { parent = k; break }
  const shown = items.filter((it, k) => {
    if (it.level === 0) return true
    let pk = -1
    for (let j = k; j >= 0; j--) if (items[j].level === 0) { pk = j; break }
    return pk === parent
  })
  const list = (
    shown.map(it => (
      <button key={it.id} type="button" data-id={it.id} onClick={() => go(it.id)}
        className={`block w-full text-left rounded px-1.5 py-0.5 leading-snug ${it.level ? 'pl-4 text-[10px]' : 'text-[11px] font-medium'} ${active === it.id
          ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
          : it.level ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
        {it.text}
      </button>
    ))
  )
  const activeText = items.find(i => i.id === active)?.text

  return (
    <>
      {/* 넓은 화면: 오른쪽 고정 목차 (본문 폭 56rem 바깥 여백에 맞춤) */}
      <nav data-toc-skip aria-label="목차" className="hidden xl:block fixed top-24 right-4 z-30" style={{ width: 'min(210px, calc((100vw - 56rem) / 2 - 24px))' }}>
        <p className="text-[10px] font-semibold text-gray-400 px-1.5 mb-1">목차</p>
        <div ref={listRef} onWheel={markTouched} onTouchMove={markTouched} onMouseDown={markTouched} className="max-h-[calc(100vh-8rem)] overflow-y-auto overscroll-contain pr-1 space-y-0.5">{list}</div>
        <div className="mt-2 px-2 flex gap-3 text-[11px] text-gray-400">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="hover:underline">↑ 맨 위로</button>
          {pinned && <button type="button" onClick={() => { setPinned(false); follow() }} className="hover:underline text-blue-500">지금 위치로</button>}
        </div>
      </nav>

      {/* 휴대폰·좁은 화면: 오른쪽 아래 버튼 + 아래에서 올라오는 목록 */}
      <button type="button" data-toc-skip onClick={() => setOpen(true)} aria-label="목차 열기"
        className="xl:hidden fixed bottom-5 right-4 z-40 rounded-full bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 shadow-lg px-3 py-1.5 text-xs font-semibold max-w-[60vw] truncate">
        ☰ 목차{activeText ? <span className="font-normal opacity-70"> · {activeText.length > 14 ? activeText.slice(0, 13) + '…' : activeText}</span> : null}
      </button>
      {open && (
        <div data-toc-skip className="xl:hidden fixed inset-0 z-50" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute bottom-0 inset-x-0 max-h-[75vh] rounded-t-2xl bg-white dark:bg-gray-900 shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-sm font-semibold text-gray-900 dark:text-white">목차 <span className="text-xs font-normal text-gray-400">누르면 그 자리로 이동</span></p>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false) }} className="text-xs text-gray-500">↑ 맨 위로</button>
                <button type="button" onClick={() => setOpen(false)} className="text-lg leading-none text-gray-500" aria-label="닫기">×</button>
              </div>
            </div>
            <div ref={sheetRef} onWheel={markTouched} onTouchMove={markTouched} className="overflow-y-auto overscroll-contain px-2 py-2 space-y-0.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">{list}</div>
          </div>
        </div>
      )}
    </>
  )
}
