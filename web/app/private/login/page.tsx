import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const metadata = { robots: 'noindex' }

async function login(formData: FormData) {
  'use server'
  const password = formData.get('password') as string
  const redirectTo = (formData.get('redirect') as string) || '/private'

  if (password === process.env.PRIVATE_PASSWORD) {
    const cookieStore = await cookies()
    cookieStore.set('private_auth', process.env.PRIVATE_PASSWORD!, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30일
      path: '/',
      sameSite: 'lax',
    })
    redirect(redirectTo)
  } else {
    redirect(`/private/login?error=1&redirect=${encodeURIComponent(redirectTo)}`)
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; error?: string }>
}) {
  const { redirect: redirectTo = '/private', error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div className="w-full max-w-xs px-6">
        <h1 className="text-center text-lg font-semibold text-gray-900 dark:text-white mb-2">멤버십 전용</h1>
        <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-4">
          비밀번호는 유튜브 멤버십 게시글에 있어요.
        </p>
        <a
          href="https://www.youtube.com/channel/UCnP5dDlqZJGOt84f7qwYnyg/join"
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full mb-6 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 text-center text-sm font-medium text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
        >
          멤버십 안내 →
        </a>
        <form action={login} className="flex flex-col gap-3">
          <input type="hidden" name="redirect" value={redirectTo} />
          <input
            type="password"
            name="password"
            placeholder="비밀번호"
            autoFocus
            autoComplete="current-password"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center">
              비밀번호가 맞지 않아요. 멤버십 게시글의 최신 비밀번호를 확인해 주세요.
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            입장
          </button>
        </form>
        <a href="/" className="block mt-6 text-center text-xs text-gray-400 dark:text-gray-500 hover:underline">← 공개 사이트로</a>
      </div>
    </div>
  )
}
