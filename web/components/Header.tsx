'use client'

import Link from 'next/link'
import { useTheme } from './ThemeProvider'

interface HeaderProps {
  maxWidth?: string
  activePage?: 'simulator' | 'posts' | 'qqq-holdings'
}

export default function Header({ maxWidth = 'max-w-6xl', activePage }: HeaderProps) {
  const { theme, toggle } = useTheme()

  return (
    <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap items-center justify-between gap-y-2`}>
        <Link
          href="/"
          className="text-sm font-bold tracking-wide text-gray-900 dark:text-white hover:opacity-75 transition-opacity whitespace-nowrap"
        >
          JUST KEEP BUYING <span className="text-blue-500 dark:text-blue-400">TQQQ</span>
        </Link>
        <div className="contents sm:flex sm:items-center sm:gap-3">
          {/* 휴대폰: 로고·테마 버튼 아래 한 줄로 메뉴 (줄바꿈 없이) */}
          <nav className="order-3 w-full sm:order-none sm:w-auto flex items-center gap-5 sm:gap-4 text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap overflow-x-auto">
            <Link
              href="/simulator/custom"
              className={`transition-colors hover:text-gray-900 dark:hover:text-white ${
                activePage === 'simulator' ? 'text-gray-900 dark:text-white font-semibold' : ''
              }`}
            >
              시뮬레이터
            </Link>
            <Link
              href="/posts"
              className={`transition-colors hover:text-gray-900 dark:hover:text-white ${
                activePage === 'posts' ? 'text-gray-900 dark:text-white font-semibold' : ''
              }`}
            >
              필독 방법론
            </Link>
            <Link
              href="/nasdaq100-holdings"
              className={`transition-colors hover:text-gray-900 dark:hover:text-white ${
                activePage === 'qqq-holdings' ? 'text-gray-900 dark:text-white font-semibold' : ''
              }`}
            >
              나스닥100 구성종목
            </Link>
          </nav>
          <button
            onClick={toggle}
            className="order-2 sm:order-none p-2 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
