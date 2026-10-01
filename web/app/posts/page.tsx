import Link from 'next/link'
import { posts } from '@/lib/posts'
import Header from '@/components/Header'

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <Header activePage="posts" />

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">분석 글</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-12">
          백테스트 과정에서 내린 설계 결정들과 발견들을 기록합니다.
        </p>

        <div className="space-y-4">
          {posts.map((post) => (
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
      </main>
    </div>
  )
}
