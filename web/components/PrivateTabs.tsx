import Link from 'next/link'

// /private 상단 탭: 위대한 기업(종목별 분석) | 종목 아이디어(전 종목 선별)
export default function PrivateTabs({ active }: { active: 'stocks' | 'ideas' }) {
  const tab = (on: boolean) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors ${on
      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`
  return (
    <nav className="flex gap-1 border-b border-gray-200 dark:border-gray-800 pb-3">
      <Link href="/private" className={tab(active === 'stocks')}>위대한 기업</Link>
      <Link href="/private/ideas" className={tab(active === 'ideas')}>종목 아이디어</Link>
    </nav>
  )
}
