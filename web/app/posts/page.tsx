import Link from 'next/link'
import { posts } from '@/lib/posts'

export default function PostsPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            justkeepbuying<span className="text-blue-400">tqqq</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-gray-400">
            <Link href="/simulator" className="hover:text-white transition-colors">시뮬레이터</Link>
            <Link href="/posts" className="text-white">글</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-2">분석 글</h1>
        <p className="text-gray-400 mb-12">
          백테스트 과정에서 내린 설계 결정들과 발견들을 기록합니다.
        </p>

        <div className="space-y-4">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="block bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl p-6 transition-colors group"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold group-hover:text-blue-400 transition-colors mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-400 text-sm leading-relaxed mb-3">
                    {post.summary}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-gray-800 text-gray-300 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-xs text-gray-500 whitespace-nowrap">{post.date}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
