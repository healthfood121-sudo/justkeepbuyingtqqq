import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 로그인 페이지는 통과
  if (pathname === '/private/login') {
    return NextResponse.next()
  }

  const cookie = request.cookies.get('private_auth')
  const password = process.env.PRIVATE_PASSWORD

  if (!password || !cookie || cookie.value !== password) {
    const loginUrl = new URL('/private/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/private/:path*',
}
