import Link from 'next/link'
import { posts } from '@/lib/posts'
import Header from '@/components/Header'

export default function PostsPage() {
  const pinned = posts.filter(p => p.pinned)
  const rest = posts.filter(p => !p.pinned)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">필독 방법론</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-10">
          백테스트 기반 설계 결정들. 방법론 두 편은 반드시 먼저 읽으세요.
        </p>

        {/* 고정 방법론 */}
        <div className="mb-4">
          <span className="text-xs font-bold tracking-widest text-blue-500 dark:text-blue-400 uppercase">필독</span>
        </div>
        <div className="space-y-3 mb-12">
          {pinned.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="block bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 hover:border-blue-400 dark:hover:border-blue-400/60 rounded-2xl p-6 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full">필독</span>
                    <h2 className="text-lg font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors text-blue-900 dark:text-blue-100">
                      {post.title}
                    </h2>
                  </div>
                  <p className="text-blue-700 dark:text-blue-300 text-sm leading-relaxed mb-3">
                    {post.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-blue-400 dark:text-blue-500 whitespace-nowrap">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* 분석 글 */}
        <div className="border-t border-gray-200 dark:border-gray-800 pt-10">
          <div className="mb-4">
            <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">분석</span>
          </div>
          <div className="space-y-4">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="block bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-600 rounded-2xl p-6 transition-colors group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-2">
                      {post.title}
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-3">
                      {post.summary}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">{post.date}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
