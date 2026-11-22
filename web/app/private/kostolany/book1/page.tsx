import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import MarkdownView from '@/components/kostolany/MarkdownView'
import { content } from '../books/book1'

export default async function Book1Page() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-6 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/private/kostolany" className="hover:text-gray-900 dark:hover:text-white transition-colors">← 코스톨라니 달걀 모형</Link>
          <span>·</span>
          <span className="text-gray-400">원문 정리본</span>
          <span className="ml-auto flex gap-3">
            <Link href="/private/kostolany/book2" className="hover:text-gray-900 dark:hover:text-white transition-colors">2권 →</Link>
            <Link href="/private/kostolany/book3" className="hover:text-gray-900 dark:hover:text-white transition-colors">3권 →</Link>
          </span>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-6 flex gap-2 items-center text-sm text-amber-800 dark:text-amber-300">
          <span>📖</span>
          <span>YouTube 자막을 맞춤법·띄어쓰기 교정 후 소제목·굵게·인용 형식으로 정리한 원문입니다.</span>
        </div>
        <MarkdownView content={content} />
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-between text-sm text-gray-500 dark:text-gray-400">
          <Link href="/private/kostolany" className="hover:text-gray-900 dark:hover:text-white transition-colors">← 달걀 모형 요약</Link>
          <Link href="/private/kostolany/book2" className="hover:text-gray-900 dark:hover:text-white transition-colors">2권 원문 →</Link>
        </div>
      </div>
    </div>
  )
}
