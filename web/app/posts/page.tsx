'use client'

import { useState } from 'react'
import Link from 'next/link'
import { posts, type Category } from '@/lib/posts'
import Header from '@/components/Header'

type Filter = '전체' | Category

const CATEGORY_STYLE = {
  '적립식': {
    badge:      'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    pinnedBg:   'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400/60',
    pinnedText: 'text-blue-900 dark:text-blue-100',
    pinnedSub:  'text-blue-700 dark:text-blue-300',
    pinnedTag:  'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300',
    pinnedDate: 'text-blue-400 dark:text-blue-500',
    restBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
    restLeft:   'border-l-blue-300 dark:border-l-blue-700',
    filterActive: 'bg-blue-500 text-white border-blue-500',
  },
  '인출식': {
    badge:      'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    pinnedBg:   'bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 hover:border-purple-400 dark:hover:border-purple-400/60',
    pinnedText: 'text-purple-900 dark:text-purple-100',
    pinnedSub:  'text-purple-700 dark:text-purple-300',
    pinnedTag:  'bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300',
    pinnedDate: 'text-purple-400 dark:text-purple-500',
    restBorder: 'hover:border-purple-300 dark:hover:border-purple-700',
    restLeft:   'border-l-purple-300 dark:border-l-purple-700',
    filterActive: 'bg-purple-500 text-white border-purple-500',
  },
}

export default function PostsPage() {
  const [filter, setFilter] = useState<Filter>('전체')

  const filtered  = posts.filter(p => filter === '전체' || p.category === filter)
  const pinned    = filtered.filter(p => p.pinned)
  const rest      = filtered.filter(p => !p.pinned)

  const filters: Filter[] = ['전체', '적립식', '인출식']

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">방법론 & 분석</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          백테스트 기반 설계 결정들. 방법론 두 편은 반드시 먼저 읽으세요.
          {' '}<Link href="/changelog" className="text-sm underline text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">권장 전략 변경 이력</Link>
          {' · '}<Link href="/start" className="text-sm underline text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">용어 풀이</Link>
        </p>

        {/* 필터 버튼 */}
        <div className="flex gap-2 mb-10">
          {filters.map(f => {
            const isActive = filter === f
            const activeStyle =
              f === '전체'    ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white' :
              f === '적립식'  ? CATEGORY_STYLE['적립식'].filterActive :
                               CATEGORY_STYLE['인출식'].filterActive
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-sm px-4 py-1.5 rounded-full border transition-colors font-medium ${
                  isActive
                    ? activeStyle
                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {f}
                {f !== '전체' && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {posts.filter(p => p.category === f).length}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* 필독 방법론 */}
        {pinned.length > 0 && (
          <>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">필독</span>
            </div>
            <div className="space-y-3 mb-12">
              {pinned.map((post) => {
                const s = CATEGORY_STYLE[post.category]
                return (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className={`block border rounded-2xl p-6 transition-colors group ${s.pinnedBg}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-bold bg-gray-800 dark:bg-white text-white dark:text-gray-900 px-2 py-0.5 rounded-full">필독</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
                            {post.category}
                          </span>
                          <h2 className={`text-lg font-bold transition-colors ${s.pinnedText} group-hover:opacity-80`}>
                            {post.title}
                          </h2>
                        </div>
                        <p className={`text-sm leading-relaxed mb-3 ${s.pinnedSub}`}>
                          {post.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className={`text-xs px-2 py-0.5 rounded-full ${s.pinnedTag}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className={`text-xs whitespace-nowrap ${s.pinnedDate}`}>{post.date}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </>
        )}

        {/* 분석 글 */}
        {rest.length > 0 && (
          <div className={pinned.length > 0 ? 'border-t border-gray-200 dark:border-gray-800 pt-10' : ''}>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">분석</span>
            </div>
            <div className="space-y-3">
              {rest.map((post) => {
                const s = CATEGORY_STYLE[post.category]
                return (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className={`block bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 border-l-4 ${s.restLeft} ${s.restBorder} rounded-2xl p-6 transition-colors group`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.badge}`}>
                            {post.category}
                          </span>
                          <h2 className="text-base font-bold group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                            {post.title}
                          </h2>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-3">
                          {post.summary}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {post.tags.map((tag) => (
                            <span key={tag} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{post.date}</span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {/* 필터 결과 없음 */}
        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400 dark:text-gray-600">
            해당 카테고리의 글이 없습니다.
          </div>
        )}
      </main>
    </div>
  )
}
