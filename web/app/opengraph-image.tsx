import { ImageResponse } from 'next/og'

// 카톡·SNS 공유 미리보기 이미지 (모든 페이지 공통). 한글 글꼴을 넣지 않아 영문만 쓴다 — 제목·요약은 각 페이지 메타데이터로 나간다.
export const alt = 'JUST KEEP BUYING TQQQ'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(90deg, #111827 0%, #172554 50%, #111827 100%)',
          color: 'white', fontWeight: 700,
        }}
      >
        <div style={{ display: 'flex', fontSize: 84, letterSpacing: 2 }}>
          JUST KEEP BUYING&nbsp;<span style={{ color: '#60a5fa' }}>TQQQ</span>
        </div>
        <div style={{ display: 'flex', marginTop: 36, fontSize: 34, color: '#9ca3af', fontWeight: 400 }}>
          Buy every day · Withdraw with the 25% rule
        </div>
        <div style={{ display: 'flex', marginTop: 14, fontSize: 28, color: '#6b7280', fontWeight: 400 }}>
          Backtested on every start date since 1971
        </div>
      </div>
    ),
    size,
  )
}
