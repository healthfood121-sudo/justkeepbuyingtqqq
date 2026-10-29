import Link from 'next/link'

type ActiveTab = 'stocks' | 'ideas' | 'kostolany' | 'howard-marks'

export default function PrivateTabs({ active }: { active: ActiveTab }) {
  const tab = (on: boolean) =>
    `px-3 py-1.5 text-sm rounded-md transition-colors ${on
      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 font-semibold'
      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`
  return (
    <nav className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
      <Link
        href="/"
        className="text-sm font-bold text-gray-900 dark:text-white hover:opacity-75 transition-opacity whitespace-nowrap mr-2"
      >
        홈
      </Link>
      <div className="flex gap-1 flex-wrap">
        <Link href="/private" className={tab(active === 'stocks')}>위대한 기업</Link>
        <Link href="/private/ideas" className={tab(active === 'ideas')}>종목 아이디어</Link>
        <Link href="/private/kostolany" className={tab(active === 'kostolany')}>코스톨라니 달걀</Link>
        <Link href="/private/howard-marks" className={tab(active === 'howard-marks')}>하워드 막스</Link>
      </div>
    </nav>
  )
}
