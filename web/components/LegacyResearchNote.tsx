import Link from 'next/link'

// 초기 연구 글 공통 안내: 이 글의 수치 기준과 데이터 페이지 기본값의 차이
export default function LegacyResearchNote() {
  return (
    <div className="border rounded-xl px-5 py-4 mb-8 text-sm leading-relaxed bg-gray-50 border-gray-200 text-gray-600 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300">
      <strong className="text-gray-800 dark:text-gray-100">초기 연구 기록입니다.</strong>{' '}
      이 글의 수치는 운용보수만 반영(스왑금리·현금 전환 매도세 미반영)하고, 신호가 뜬 날 종가에 매매하며, 20년에서 자르고,
      월 1,500만원 인출 상한을 둔 당시 계산입니다. 데이터 페이지는 스왑금리 반영이 기본이라 숫자가 다르게 보이며,
      [운용보수만]을 누르면 이 글의 수치와 같아집니다. 현재 기준의 비교와 권장 전략은{' '}
      <Link href="/posts/withdrawal-full-period" className="underline">모든 인출 전략 전체 기간 비교</Link>와{' '}
      <Link href="/posts/withdrawal-guide" className="underline">인출식 방법론</Link>에 있습니다.
    </div>
  )
}
