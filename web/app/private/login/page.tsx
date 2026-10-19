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
        <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mb-6 tracking-widest uppercase">
          Private
        </p>
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
              비밀번호가 틀렸습니다.
            </p>
          )}
          <button
            type="submit"
            className="w-full py-2.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-medium hover:opacity-80 transition-opacity"
          >
            입장
          </button>
        </form>
      </div>
    </div>
  )
}
