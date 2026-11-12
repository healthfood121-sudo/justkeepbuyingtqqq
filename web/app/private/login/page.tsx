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
    <div className="relative min-h-[calc(100vh-64px)] flex items-center justify-center overflow-hidden bg-gradient-to-b from-stone-50 to-amber-50/60 dark:from-gray-950 dark:to-gray-950 px-5 py-12">
      {/* 뒤쪽 은은한 금빛 */}
      <div aria-hidden className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-amber-300/20 dark:bg-amber-500/10 blur-3xl" />

      <div className="relative w-full max-w-sm">
        {/* 멤버십 카드 */}
        <div className="relative rounded-2xl p-[1px] bg-gradient-to-br from-amber-200 via-amber-500/60 to-amber-200/30 shadow-2xl shadow-amber-900/20">
          <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#111c33] to-[#1e293b] px-7 pt-7 pb-8">
            <div aria-hidden className="absolute -right-16 -top-16 w-48 h-48 rounded-full bg-amber-400/10 blur-2xl" />
            <div aria-hidden className="absolute inset-0 bg-[linear-gradient(115deg,transparent_40%,rgba(255,255,255,0.06)_50%,transparent_60%)]" />

            <div className="relative flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-300/10 px-2.5 py-1 text-[10px] font-semibold tracking-[0.2em] text-amber-200">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                MEMBERS ONLY
              </span>
              <span className="text-[10px] font-bold tracking-[0.25em] text-white/30">JKB</span>
            </div>

            <h1 className="relative mt-6 text-2xl font-bold tracking-tight text-white">멤버십 전용</h1>
            <p className="relative mt-2 text-sm leading-relaxed text-slate-300">
              비밀번호는 유튜브 멤버십 게시글에 있어요.
            </p>

            <a
              href="https://www.youtube.com/channel/UCnP5dDlqZJGOt84f7qwYnyg/join"
              target="_blank"
              rel="noopener noreferrer"
              className="relative mt-6 block w-full rounded-xl bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-amber-500/20 hover:brightness-105 transition"
            >
              멤버십 안내 →
            </a>

            <div className="relative my-6 flex items-center gap-3 text-[11px] text-slate-400">
              <span className="h-px flex-1 bg-white/10" />이미 멤버라면<span className="h-px flex-1 bg-white/10" />
            </div>

            <form action={login} className="relative flex flex-col gap-3">
              <input type="hidden" name="redirect" value={redirectTo} />
              <input
                type="password"
                name="password"
                placeholder="비밀번호"
                autoFocus
                autoComplete="current-password"
                className="w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-300/60"
              />
              {error && (
                <p className="text-xs text-rose-300 text-center">
                  비밀번호가 맞지 않아요. 멤버십 게시글의 최신 비밀번호를 확인해 주세요.
                </p>
              )}
              <button
                type="submit"
                className="w-full rounded-xl bg-white py-3 text-sm font-semibold text-slate-900 hover:bg-slate-100 transition-colors"
              >
                입장
              </button>
            </form>
          </div>
        </div>

        <a href="/" className="mt-7 block text-center text-xs text-stone-500 dark:text-gray-500 hover:underline">← 공개 사이트로</a>
      </div>
    </div>
  )
}
