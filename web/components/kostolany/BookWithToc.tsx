'use client'

import { useState, useEffect } from 'react'
import MarkdownView from './MarkdownView'

interface Heading { text: string; id: string }

function extractH2s(content: string): Heading[] {
  let count = 0
  return content
    .split('\n')
    .filter(l => l.startsWith('## ') && !l.startsWith('### '))
    .map(l => ({ text: l.slice(3), id: `h2-${count++}` }))
}

function TocList({
  headings,
  activeId,
  onClickItem,
}: {
  headings: Heading[]
  activeId: string
  onClickItem?: () => void
}) {
  return (
    <nav className="space-y-0.5">
      {headings.map(({ text, id }) => (
        <a
          key={id}
          href={`#${id}`}
          onClick={onClickItem}
          className={`block text-xs py-1 px-2 rounded-md transition-colors leading-snug break-keep ${
            activeId === id
              ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-semibold'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          {text}
        </a>
      ))}
    </nav>
  )
}

export default function BookWithToc({ content }: { content: string }) {
  const headings = extractH2s(content)
  const [activeId, setActiveId] = useState<string>('')
  const [tocOpen, setTocOpen] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        // 화면 위쪽에서 가장 가까운 heading을 active로
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) setActiveId(visible[0].target.id)
      },
      { rootMargin: '-80px 0px -60% 0px', threshold: 0 }
    )
    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [headings])

  // 모바일 TOC 열릴 때 외부 클릭 닫기
  useEffect(() => {
    if (!tocOpen) return
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('[data-toc-panel]') && !target.closest('[data-toc-btn]')) {
        setTocOpen(false)
      }
    }
    document.addEventListener('click', handler)
    return () => document.removeEventListener('click', handler)
  }, [tocOpen])

  return (
    <div className="relative flex gap-6 xl:gap-10">
      {/* 데스크탑 sticky 사이드바 */}
      <aside className="hidden lg:block w-56 xl:w-64 shrink-0">
        <div className="sticky top-6 max-h-[calc(100vh-5rem)] flex flex-col">
          <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2 px-2">목차</p>
          <div className="overflow-y-auto pr-1 flex-1 scrollbar-thin">
            <TocList headings={headings} activeId={activeId} />
          </div>
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <div className="flex-1 min-w-0">
        <MarkdownView content={content} />
      </div>

      {/* 모바일 플로팅 버튼 */}
      <div className="lg:hidden fixed bottom-6 right-4 z-40">
        <button
          data-toc-btn
          onClick={() => setTocOpen(v => !v)}
          className="w-12 h-12 rounded-full bg-indigo-600 text-white shadow-lg flex items-center justify-center text-xl transition-transform active:scale-95"
          aria-label="목차"
        >
          {tocOpen ? '✕' : '☰'}
        </button>

        {tocOpen && (
          <div
            data-toc-panel
            className="absolute bottom-14 right-0 w-72 max-h-[70vh] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden"
          >
            <div className="px-4 pt-4 pb-2 border-b border-gray-100 dark:border-gray-800">
              <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">목차</p>
            </div>
            <div className="overflow-y-auto p-3">
              <TocList
                headings={headings}
                activeId={activeId}
                onClickItem={() => setTocOpen(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
