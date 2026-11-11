'use client'

import { useEffect, useRef, useState } from 'react'
import 'leaflet/dist/leaflet.css'

// 에르메스 매장 지도 — 회사 연간·반기 실적 발표에 나온 "새로 연 매장"과 "리뉴얼·확장·이전 재개장"을 연도별로 모았다.
// 전체 매장(약 294곳)의 위치 목록은 회사가 숫자로 공개하지 않아, 여기에는 2016년 이후 발표에 이름이 나온 매장만 있다.
type Kind = 'new' | 'reno' | 'plan' | 'close'
type Store = { y: number; city: string; country: string; place?: string; lat: number; lng: number; k: Kind }

const S: Store[] = [
  // 2016 — 새 매장 4곳(회사 발표)
  { y: 2016, city: '리우데자네이루', country: '브라질', lat: -22.97, lng: -43.18, k: 'new' },
  { y: 2016, city: '홍콩', country: '홍콩', place: '홍콩 국제공항', lat: 22.31, lng: 113.92, k: 'new' },
  { y: 2016, city: '마카오', country: '마카오', lat: 22.19, lng: 113.54, k: 'new' },
  { y: 2016, city: '충칭', country: '중국', lat: 29.56, lng: 106.55, k: 'new' },
  // 2017 — 새 매장은 상파울루, 나머지는 약 20곳 리뉴얼(도시 이름 미공개), 프랑스 중소도시 작은 매장·공항 매장 정리
  { y: 2017, city: '샬럿', country: '미국', place: '2006년 연 매장 폐점', lat: 35.23, lng: -80.84, k: 'close' },
  { y: 2017, city: '상파울루', country: '브라질', place: '이과테미', lat: -23.58, lng: -46.69, k: 'new' },
  // 2018
  { y: 2018, city: '홍콩', country: '홍콩', place: '랜드마크 프린스', lat: 22.28, lng: 114.16, k: 'new' },
  { y: 2018, city: '팰로앨토', country: '미국', lat: 37.44, lng: -122.16, k: 'new' },
  { y: 2018, city: '창사', country: '중국', lat: 28.23, lng: 112.94, k: 'new' },
  { y: 2018, city: '이스탄불', country: '튀르키예', place: '에마르', lat: 41.0, lng: 29.07, k: 'new' },
  { y: 2018, city: '칸쿤', country: '멕시코', lat: 21.16, lng: -86.85, k: 'new' },
  { y: 2018, city: '멕시코시티', country: '멕시코', place: '아르츠 페드레갈', lat: 19.31, lng: -99.22, k: 'new' },
  { y: 2018, city: '시안', country: '중국', lat: 34.34, lng: 108.94, k: 'new' },
  { y: 2018, city: '멜버른', country: '호주', place: '채드스톤', lat: -37.89, lng: 145.08, k: 'new' },
  { y: 2018, city: '방콕', country: '태국', place: '아이콘시암', lat: 13.73, lng: 100.51, k: 'new' },
  // 2019
  { y: 2019, city: '바르샤바', country: '폴란드', place: '폴란드 첫 매장(새 나라)', lat: 52.23, lng: 21.01, k: 'new' },
  { y: 2019, city: '뉴욕', country: '미국', place: '미트패킹(미국 36번째)', lat: 40.74, lng: -74.01, k: 'new' },
  { y: 2019, city: '푸껫', country: '태국', lat: 7.89, lng: 98.39, k: 'new' },
  { y: 2019, city: '호놀룰루', country: '미국', place: '와이키키', lat: 21.28, lng: -157.83, k: 'reno' },
  { y: 2019, city: '칭다오', country: '중국', lat: 36.07, lng: 120.38, k: 'reno' },
  { y: 2019, city: '서울', country: '한국', place: '현대', lat: 37.53, lng: 127.04, k: 'reno' },
  { y: 2019, city: '샌프란시스코', country: '미국', lat: 37.79, lng: -122.41, k: 'reno' },
  // 2020
  { y: 2020, city: '오사카', country: '일본', place: '신사이바시(오사카 4번째)', lat: 34.67, lng: 135.5, k: 'new' },
  { y: 2020, city: '마드리드', country: '스페인', place: '갈레리아 카날레하스', lat: 40.42, lng: -3.7, k: 'new' },
  { y: 2020, city: '시드니', country: '호주', place: '플래그십', lat: -33.87, lng: 151.21, k: 'new' },
  { y: 2020, city: '모스크바', country: '러시아', place: '브레메나 고다(모스크바 3번째)', lat: 55.71, lng: 37.48, k: 'new' },
  { y: 2020, city: '대구', country: '한국', place: '현대', lat: 35.87, lng: 128.6, k: 'reno' },
  { y: 2020, city: '홍콩', country: '홍콩', place: '하버시티', lat: 22.3, lng: 114.17, k: 'reno' },
  { y: 2020, city: '다롄', country: '중국', lat: 38.91, lng: 121.61, k: 'reno' },
  { y: 2020, city: '센다이', country: '일본', lat: 38.26, lng: 140.88, k: 'reno' },
  { y: 2020, city: '스톡홀름', country: '스웨덴', lat: 59.33, lng: 18.07, k: 'reno' },
  { y: 2020, city: '덴버', country: '미국', place: '이전', lat: 39.74, lng: -104.99, k: 'reno' },
  // 2021
  { y: 2021, city: '트로이(디트로이트)', country: '미국', lat: 42.56, lng: -83.16, k: 'new' },
  { y: 2021, city: '애번투라(마이애미)', country: '미국', lat: 25.96, lng: -80.14, k: 'new' },
  { y: 2021, city: '마카오', country: '마카오', lat: 22.15, lng: 113.56, k: 'new' },
  { y: 2021, city: '선전', country: '중국', lat: 22.54, lng: 114.06, k: 'new' },
  { y: 2021, city: '상하이', country: '중국', place: '플라자 66', lat: 31.23, lng: 121.45, k: 'reno' },
  { y: 2021, city: '쑤저우', country: '중국', lat: 31.3, lng: 120.58, k: 'reno' },
  { y: 2021, city: '닝보', country: '중국', lat: 29.87, lng: 121.54, k: 'reno' },
  { y: 2021, city: '베이징', country: '중국', place: '차이나월드', lat: 39.91, lng: 116.46, k: 'reno' },
  { y: 2021, city: '리옹', country: '프랑스', lat: 45.76, lng: 4.84, k: 'reno' },
  { y: 2021, city: '파리', country: '프랑스', place: '세브르 거리', lat: 48.85, lng: 2.32, k: 'reno' },
  { y: 2021, city: '취리히', country: '스위스', lat: 47.37, lng: 8.54, k: 'reno' },
  { y: 2021, city: '밀라노', country: '이탈리아', lat: 45.46, lng: 9.19, k: 'reno' },
  { y: 2021, city: '이스탄불', country: '튀르키예', lat: 41.04, lng: 28.99, k: 'reno' },
  { y: 2021, city: '룩셈부르크', country: '룩셈부르크', place: '이전', lat: 49.61, lng: 6.13, k: 'reno' },
  // 2022
  { y: 2022, city: '모스크바', country: '러시아', place: '매장 3곳 영업 중단(전쟁), 상트페테르부르크 계획 무기한 보류', lat: 55.75, lng: 37.62, k: 'close' },
  { y: 2022, city: '상하이', country: '중국', place: '첸탄(상하이 4번째)', lat: 31.15, lng: 121.51, k: 'new' },
  { y: 2022, city: '판교', country: '한국', lat: 37.39, lng: 127.11, k: 'new' },
  { y: 2022, city: '오스틴', country: '미국', lat: 30.27, lng: -97.74, k: 'new' },
  { y: 2022, city: '정저우', country: '중국', place: '허난성 첫 매장', lat: 34.75, lng: 113.62, k: 'new' },
  { y: 2022, city: '도하', country: '카타르', lat: 25.29, lng: 51.53, k: 'new' },
  { y: 2022, city: '뉴욕', country: '미국', place: '매디슨가 706(새 플래그십)', lat: 40.77, lng: -73.97, k: 'reno' },
  { y: 2022, city: '바르셀로나', country: '스페인', place: '그라시아 거리', lat: 41.39, lng: 2.16, k: 'reno' },
  { y: 2022, city: '홍콩', country: '홍콩', place: '퍼시픽 플레이스', lat: 22.28, lng: 114.17, k: 'reno' },
  { y: 2022, city: '코스타메사', country: '미국', place: '사우스 코스트 플라자', lat: 33.69, lng: -117.89, k: 'reno' },
  { y: 2022, city: '우한', country: '중국', lat: 30.59, lng: 114.31, k: 'reno' },
  { y: 2022, city: '마닐라', country: '필리핀', lat: 14.55, lng: 121.02, k: 'reno' },
  { y: 2022, city: '호찌민', country: '베트남', lat: 10.78, lng: 106.7, k: 'reno' },
  { y: 2022, city: '과달라하라', country: '멕시코', lat: 20.67, lng: -103.35, k: 'reno' },
  { y: 2022, city: '나고야', country: '일본', place: '다카시마야(이전)', lat: 35.17, lng: 136.91, k: 'reno' },
  { y: 2022, city: '스트라스부르', country: '프랑스', place: '이전', lat: 48.58, lng: 7.75, k: 'reno' },
  // 2023
  { y: 2023, city: '마르세유', country: '프랑스', place: '폭동 때 약탈, 2025년 10월에도 재개장 미정(보도)', lat: 43.29, lng: 5.38, k: 'close' },
  { y: 2023, city: '맨해셋(뉴욕 근교)', country: '미국', place: '가맹 매장 폐점 → 2026년 10월 본사 직영으로 재개장', lat: 40.8, lng: -73.7, k: 'close' },
  { y: 2023, city: '네이플스', country: '미국', lat: 26.14, lng: -81.79, k: 'new' },
  { y: 2023, city: '애스펀', country: '미국', lat: 39.19, lng: -106.82, k: 'new' },
  { y: 2023, city: '로스앤젤레스', country: '미국', place: '토팽가', lat: 34.19, lng: -118.6, k: 'new' },
  { y: 2023, city: '톈진', country: '중국', lat: 39.12, lng: 117.2, k: 'new' },
  { y: 2023, city: '청두', country: '중국', place: '중국 본토 33번째', lat: 30.66, lng: 104.07, k: 'new' },
  { y: 2023, city: '시카고', country: '미국', lat: 41.9, lng: -87.62, k: 'reno' },
  { y: 2023, city: '라스베이거스', country: '미국', place: '벨라지오', lat: 36.11, lng: -115.18, k: 'reno' },
  { y: 2023, city: '빈', country: '오스트리아', lat: 48.21, lng: 16.37, k: 'reno' },
  { y: 2023, city: '보르도', country: '프랑스', lat: 44.84, lng: -0.58, k: 'reno' },
  { y: 2023, city: '크랑몽타나', country: '스위스', lat: 46.31, lng: 7.48, k: 'reno' },
  { y: 2023, city: '베이징', country: '중국', place: '페닌슐라', lat: 39.91, lng: 116.41, k: 'reno' },
  { y: 2023, city: '서울', country: '한국', place: '신라호텔', lat: 37.56, lng: 127.0, k: 'reno' },
  { y: 2023, city: '삿포로', country: '일본', lat: 43.06, lng: 141.35, k: 'reno' },
  // 2024
  { y: 2024, city: '도쿄', country: '일본', place: '아자부다이 힐스', lat: 35.66, lng: 139.74, k: 'new' },
  { y: 2024, city: '도쿄', country: '일본', place: '긴자', lat: 35.67, lng: 139.77, k: 'new' },
  { y: 2024, city: '프린스턴', country: '미국', lat: 40.35, lng: -74.66, k: 'new' },
  { y: 2024, city: '릴', country: '프랑스', lat: 50.63, lng: 3.06, k: 'new' },
  { y: 2024, city: '뭄바이', country: '인도', place: '지오 월드 플라자(인도 3번째)', lat: 19.06, lng: 72.86, k: 'new' },
  { y: 2024, city: '선전', country: '중국', lat: 22.53, lng: 113.95, k: 'new' },
  { y: 2024, city: '애틀랜타', country: '미국', lat: 33.85, lng: -84.36, k: 'reno' },
  { y: 2024, city: '낭트', country: '프랑스', lat: 47.22, lng: -1.55, k: 'reno' },
  { y: 2024, city: '홍콩', country: '홍콩', place: '리 가든', lat: 22.28, lng: 114.18, k: 'reno' },
  { y: 2024, city: '베이징', country: '중국', place: 'SKP', lat: 39.91, lng: 116.48, k: 'reno' },
  // 2025
  { y: 2025, city: '스코츠데일', country: '미국', lat: 33.49, lng: -111.93, k: 'new' },
  { y: 2025, city: '내슈빌', country: '미국', lat: 36.16, lng: -86.78, k: 'new' },
  { y: 2025, city: '피렌체', country: '이탈리아', place: '1578년 궁전으로 이전', lat: 43.77, lng: 11.25, k: 'reno' },
  { y: 2025, city: '방콕', country: '태국', place: '센트럴 엠버시', lat: 13.74, lng: 100.55, k: 'reno' },
  { y: 2025, city: '방콕', country: '태국', place: '아이콘시암', lat: 13.725, lng: 100.505, k: 'reno' },
  { y: 2025, city: '타이중', country: '대만', lat: 24.15, lng: 120.67, k: 'reno' },
  { y: 2025, city: '마카오', country: '마카오', place: '포시즌스', lat: 22.14, lng: 113.57, k: 'reno' },
  { y: 2025, city: '서울', country: '한국', place: '갤러리아', lat: 37.53, lng: 127.04, k: 'reno' },
  { y: 2025, city: '서울', country: '한국', place: '신세계', lat: 37.56, lng: 126.98, k: 'reno' },
  { y: 2025, city: '창사', country: '중국', place: 'IFS', lat: 28.2, lng: 112.98, k: 'reno' },
  { y: 2025, city: '멕시코시티', country: '멕시코', place: '몰리에르', lat: 19.43, lng: -99.2, k: 'reno' },
  { y: 2025, city: '크노케', country: '벨기에', lat: 51.35, lng: 3.29, k: 'reno' },
  // 2026 — 회사가 밝힌 계획
  { y: 2026, city: '런던', country: '영국', lat: 51.51, lng: -0.14, k: 'plan' },
  { y: 2026, city: '베를린', country: '독일', lat: 52.52, lng: 13.4, k: 'plan' },
  { y: 2026, city: '제네바', country: '스위스', lat: 46.2, lng: 6.14, k: 'plan' },
  { y: 2026, city: '베이징', country: '중국', place: '싼리툰', lat: 39.94, lng: 116.45, k: 'plan' },
  { y: 2026, city: '오사카', country: '일본', lat: 34.7, lng: 135.5, k: 'plan' },
  { y: 2026, city: '샌디에이고', country: '미국', lat: 32.72, lng: -117.16, k: 'plan' },
]

// 연말 전용 매장 수(회사 발표 = 공시, 외부 = 통계 사이트) · 매출(억 유로, 사이트 리포트 표)
const COUNT: { y: number; n: number | null; src: string; rev: number }[] = [
  { y: 2015, n: 307, src: '공시(직영 210곳)', rev: 484 },
  { y: 2016, n: 307, src: '외부', rev: 520 },
  { y: 2017, n: 304, src: '공시', rev: 555 },
  { y: 2018, n: 310, src: '공시(직영 219곳)', rev: 597 },
  { y: 2019, n: 311, src: '공시', rev: 688 },
  { y: 2020, n: 306, src: '공시(가맹 85곳)', rev: 639 },
  { y: 2021, n: 303, src: '공시(직영 221곳)', rev: 898 },
  { y: 2022, n: 300, src: '공시', rev: 1160 },
  { y: 2023, n: 294, src: '회사 발표', rev: 1343 },
  { y: 2024, n: 293, src: '공시(45개국)', rev: 1517 },
  { y: 2025, n: 294, src: '회사 발표(45개국)', rev: 1600 },
]

const COL: Record<Kind | 'old', string> = { new: '#dc2626', reno: '#2563eb', plan: '#f59e0b', close: '#111827', old: '#9ca3af' }
const KIND_LABEL: Record<Kind, string> = { new: '새 매장', reno: '리뉴얼·확장·이전', plan: '계획', close: '폐점·철수' }

// 2016~2025 새 매장을 지역으로 묶기
const REGION: Record<string, string> = { 미국: '미국', 멕시코: '중남미', 브라질: '중남미', 중국: '중국 본토', 홍콩: '홍콩·마카오', 마카오: '홍콩·마카오', 일본: '일본', 한국: '한국', 태국: '동남아·인도', 인도: '동남아·인도', 호주: '호주', 튀르키예: '중동', 카타르: '중동', 러시아: '러시아', 폴란드: '유럽', 스페인: '유럽', 프랑스: '유럽' }
const YEARS = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026]

export default function HermesStoreMap() {
  const box = useRef<HTMLDivElement | null>(null)
  const map = useRef<any>(null)
  const layer = useRef<any>(null)
  const L = useRef<any>(null)
  const [ready, setReady] = useState(false)
  const [y, setY] = useState(2025)

  useEffect(() => {
    let alive = true
    import('leaflet').then(mod => {
      if (!alive || !box.current || map.current) return
      const lf = (mod as any).default ?? mod
      L.current = lf
      const dark = document.documentElement.classList.contains('dark')
      const m = lf.map(box.current, { worldCopyJump: true, scrollWheelZoom: false, zoomSnap: 0.25 }).fitBounds(lf.latLngBounds(S.map(s => [s.lat, s.lng] as [number, number])), { padding: [12, 12] })
      // 바탕 지도: 키가 필요 없는 OpenStreetMap 기본 타일(CARTO는 2025년부터 API 키 필요). 다크 모드는 색을 뒤집어 어둡게
      lf.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 12,
        className: dark ? 'osm-dark' : '',
      }).addTo(m)
      map.current = m
      layer.current = lf.layerGroup().addTo(m)
      setReady(true)
    })
    return () => { alive = false; if (map.current) { map.current.remove(); map.current = null } }
  }, [])

  useEffect(() => {
    if (!ready || !L.current) return
    const lf = L.current
    layer.current.clearLayers()
    const shown = S.filter(s => s.y <= y && (s.k !== 'plan' || s.y === y))
    // 그해 것은 위에 그리도록 오래된 것부터
    shown.sort((a, b) => (a.y === y ? 1 : 0) - (b.y === y ? 1 : 0))
    for (const s of shown) {
      const cur = s.y === y
      const color = cur ? COL[s.k] : s.k === 'new' || s.k === 'close' ? (s.k === 'close' ? COL.close : COL.old) : null
      if (!color) continue // 지난 해의 리뉴얼은 표시하지 않는다(매장 자체는 원래 있던 곳)
      lf.circleMarker([s.lat, s.lng], {
        radius: cur ? 7 : 4, color, fillColor: s.k === 'close' ? '#ffffff' : color, fillOpacity: s.k === 'close' ? 0.9 : cur ? 0.85 : 0.5, weight: s.k === 'close' ? 3 : cur ? 2 : 1,
        dashArray: s.k === 'plan' ? '3 3' : undefined,
      }).bindTooltip(`${s.y}년 · ${s.city}${s.place ? ` (${s.place})` : ''}, ${s.country} — ${KIND_LABEL[s.k]}`)
        .addTo(layer.current)
    }
  }, [ready, y])

  const thisYear = S.filter(s => s.y === y)
  const fmt = (k: Kind) => thisYear.filter(s => s.k === k).map(s => `${s.city}${s.place ? `(${s.place})` : ''}`).join(', ')
  const newCountries = (() => {
    const before = new Set(S.filter(s => s.y < y && s.k === 'new').map(s => s.country))
    return [...new Set(thisYear.filter(s => s.k === 'new').map(s => s.country))].filter(c => !before.has(c))
  })()
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'

  return (
    <section className="rounded-xl border-2 border-orange-200 dark:border-orange-900/60 p-3 sm:p-4 space-y-3">
      <EnterExit />
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">에르메스 매장 지도 — 연도별 새 매장·리뉴얼 (2016~2026)</h3>
        <p className={small}>연도를 누르면 그해 <b style={{ color: COL.new }}>새로 연 매장</b>(빨강)과 <b style={{ color: COL.reno }}>리뉴얼·확장·이전한 매장</b>(파랑)이 크게, 그 전 해들에 새로 연 매장이 <b style={{ color: COL.old }}>회색</b>으로 나온다. 2026년은 회사가 밝힌 <b style={{ color: COL.plan }}>계획</b>(주황 점선). <b>속이 흰 검은 동그라미</b>는 문을 닫거나 철수한 곳(그 뒤 해에도 남겨 둔다). 점에 손가락을 대면(마우스를 올리면) 이름이 뜬다.</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {YEARS.map(v => (
          <button key={v} type="button" onClick={() => setY(v)}
            className={`px-2.5 py-1 rounded-full text-xs tabular-nums ${y === v ? 'bg-orange-600 text-white font-semibold' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'}`}>
            {v}{v === 2026 ? '(계획)' : ''}
          </button>
        ))}
      </div>
      <input type="range" min={2016} max={2026} value={y} onChange={e => setY(Number(e.target.value))} className="w-full accent-orange-600" aria-label="연도" />

      <style>{'.osm-dark{filter:invert(1) hue-rotate(180deg) brightness(.85) contrast(.9)}'}</style>
      <div ref={box} className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800" style={{ height: 360 }} />

      <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-2.5 space-y-1 text-xs text-gray-700 dark:text-gray-200">
        <p className="font-semibold">{y}년{y === 2026 ? ' 계획' : ''} {COUNT.find(c => c.y === y)?.n ? `· 연말 매장 ${COUNT.find(c => c.y === y)!.n}곳` : ''}</p>
        {fmt('new') && <p><b style={{ color: COL.new }}>새 매장 {thisYear.filter(s => s.k === 'new').length}곳:</b> {fmt('new')}{newCountries.length > 0 && y !== 2016 ? ` — 이 지도에서 처음 나온 나라: ${newCountries.join(', ')}` : ''}</p>}
        {fmt('reno') && <p><b style={{ color: COL.reno }}>리뉴얼·확장·이전:</b> {fmt('reno')}</p>}
        {fmt('close') && <p><b>폐점·철수:</b> {fmt('close')}</p>}
        {fmt('plan') && <p><b style={{ color: COL.plan }}>계획:</b> {fmt('plan')}</p>}
        {y === 2017 && <p className="text-gray-500">2017년엔 새 매장이 상파울루 1곳뿐이고, 약 20곳을 리뉴얼(도시 이름은 공개 안 됨)했다. 프랑스 중소도시의 작은 매장과 공항 매장을 정리했다.</p>}
        {y === 2018 && <p className="text-gray-500">그 밖에 약 20곳 리뉴얼(도시 이름 미공개).</p>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-gray-200 dark:border-gray-800 text-gray-400">
            <th className="py-1 px-2 text-left font-medium">연도</th><th className="py-1 px-2 text-right font-medium">연말 매장</th><th className="py-1 px-2 text-right font-medium">매출(억 유로)</th><th className="py-1 px-2 text-right font-medium">매장 1곳당 매출(대략)</th><th className="py-1 px-2 text-left font-medium">출처</th>
          </tr></thead>
          <tbody>
            {COUNT.map(c => (
              <tr key={c.y} className={`border-b border-gray-100 dark:border-gray-900 ${c.y === y ? 'bg-orange-50 dark:bg-orange-950/20' : ''}`}>
                <td className="py-1 px-2 tabular-nums">{c.y}</td>
                <td className="py-1 px-2 text-right tabular-nums">{c.n ?? '—'}곳</td>
                <td className="py-1 px-2 text-right tabular-nums">{c.rev.toLocaleString()}</td>
                <td className="py-1 px-2 text-right tabular-nums font-semibold">{c.n ? `약 ${(c.rev / c.n).toFixed(1)}억 유로` : '—'}</td>
                <td className="py-1 px-2 text-gray-400">{c.src}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className={small}><b>읽는 법:</b> 10년 동안 매장 수는 307곳 → 294곳으로 오히려 줄었는데, 매장 1곳당 매출은 약 1.6억 → 5.4억 유로로 <b>3배 넘게</b> 늘었다. 에르메스는 매장을 늘려서 크지 않는다 — <b>같은 도시의 매장을 넓히거나 더 좋은 자리로 옮기고(파랑), 값을 올리고, 새 도시는 조금씩(빨강, 해마다 2~9곳)</b> 연다. 희소성 전략이 지도에 그대로 보인다. 새 매장은 미국(소도시 부촌)·중국 2~3선 도시·일본에 몰려 있다.</p>
      <p className="text-[11px] text-gray-400">· 매장별 매출은 회사가 공개하지 않는다(지역별 매출만 공개). &lsquo;매장 1곳당 매출&rsquo;은 전체 매출 ÷ 연말 매장 수라 도매·온라인·향수 판매도 섞인 대략값이다.<br />· 지도는 2016년 이후 회사 실적 발표·연차 보고서에 이름이 나온 매장만 담았다 — 전체 약 294곳의 위치가 아니다. 위치는 도시 단위 대략 좌표. 문을 닫은 매장(주로 프랑스 중소도시·공항)은 이름이 공개되지 않아 빠져 있다.<br />· 2016년 매장 수는 외부 통계 사이트 숫자. 2023년 294곳은 2023년 실적 발표 기준.</p>
    </section>
  )
}

function EnterExit() {
  const news = S.filter(s => s.k === 'new' && s.y <= 2025)
  const byRegion: Record<string, string[]> = {}
  for (const s of news) (byRegion[REGION[s.country] ?? '기타'] ??= []).push(s.city)
  const rows = Object.entries(byRegion).sort((a, b) => b[1].length - a[1].length)
  const max = rows[0]?.[1].length ?? 1
  const small = 'text-xs leading-relaxed text-gray-600 dark:text-gray-300'
  return (
    <div className="rounded-lg bg-orange-50/60 dark:bg-orange-950/20 p-2.5 space-y-2">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">어디로 들어가고, 어디서 나오나 (2016~2025)</p>
      <div className="space-y-1">
        <p className="text-[11px] text-gray-500">새 매장 {news.length}곳(발표에 이름이 나온 것)을 지역별로</p>
        {rows.map(([r, cities]) => (
          <div key={r} className="flex items-center gap-2 text-xs">
            <span className="w-20 shrink-0 text-gray-700 dark:text-gray-200">{r}</span>
            <span className="h-2.5 rounded-full" style={{ width: `${(cities.length / max) * 45}%`, background: COL.new }} />
            <span className="tabular-nums text-gray-700 dark:text-gray-200">{cities.length}</span>
            <span className="text-[11px] text-gray-400 truncate">{[...new Set(cities)].join('·')}</span>
          </div>
        ))}
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-2">
          <p className="text-xs font-semibold" style={{ color: COL.new }}>들어가는 곳</p>
          <ul className={`${small} list-disc pl-4`}>
            <li><b>미국의 부자 소도시</b> — 팰로앨토·트로이·애번투라·오스틴·네이플스·애스펀·프린스턴·스코츠데일·내슈빌. 대도시가 아니라 &lsquo;부자가 사는 곳&rsquo;에 직접 간다. 2023~2025년 새 매장 13곳 중 6곳, 2025년엔 2곳 모두 미국.</li>
            <li><b>중국 내륙 2~3선 도시</b> — 충칭·창사·시안·정저우·톈진·청두. 2018~2023년에 집중, 2024년 이후엔 새 도시보다 기존 매장 확장(베이징·창사)으로 바뀜. 중국 경기 둔화와 맞물린 속도 조절.</li>
            <li><b>일본 도쿄</b> — 2024년 한 해에 2곳(아자부다이 힐스·긴자). 엔화 약세로 관광객 수요가 몰린 곳.</li>
            <li><b>새 나라는 드물다</b> — 회사가 새 나라라고 밝힌 건 폴란드(2019) 정도. 카타르 도하(2022)처럼 중동도 조금씩. 인도는 3번째 매장(2024)으로 아주 천천히.</li>
          </ul>
        </div>
        <div className="rounded-lg bg-white/70 dark:bg-gray-900/40 p-2">
          <p className="text-xs font-semibold text-gray-900 dark:text-white">나오는 곳</p>
          <ul className={`${small} list-disc pl-4`}>
            <li><b>러시아</b> — 2020년 모스크바 3번째 매장을 열었다가, 2022년 3월 전쟁으로 3곳 모두 영업 중단. 상트페테르부르크 계획도 무기한 보류. 시장 하나를 통째로 잃은 유일한 사례.</li>
            <li><b>프랑스 중소도시·공항의 작은 매장</b> — 회사가 &ldquo;여는 것보다 닫는 게 더 많다&rdquo;고 말할 정도로 정리. 근처 대도시 큰 매장으로 손님을 모은다. 마르세유는 2023년 폭동 약탈 후 재개장 미정(보도).</li>
            <li><b>미국 일부 도시</b> — 샬럿(2017 폐점). 맨해셋처럼 가맹 매장을 닫고 본사 직영으로 다시 여는 경우도 있다.</li>
            <li><b>가맹(남이 운영하는) 매장</b> — 직영은 210곳(2015) → 221곳(2021)으로 늘고, 그 외 매장은 약 97곳 → 82곳으로 줄었다(공시 숫자로 계산). 전체 매장 수가 준 건 대부분 이 정리 때문.</li>
          </ul>
        </div>
      </div>
      <p className={small}><b>한 줄로:</b> 에르메스는 나라를 넓히기보다 <b>이미 있는 부자 시장(미국·중국·일본) 안에서 더 깊이</b> 들어가고, <b>작은 매장·가맹 매장·위험한 나라(러시아)</b>에서는 빠진다. 2024년 이후 중국 새 도시가 멈추고 미국 소도시가 늘어난 게 최근의 방향 전환이다.</p>
    </div>
  )
}
