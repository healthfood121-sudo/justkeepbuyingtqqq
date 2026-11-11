import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import data from '../notes.json'

// 종목 화면용: 그 회사가 나온 주주총회 노트만 (로그인한 경우에만)
export async function GET(req: Request) {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) return NextResponse.json({ entries: [] }, { status: 401 })
  const k = new URL(req.url).searchParams.get('k') ?? ''
  const entries = (data as { entries: { stocks: string[] }[] }).entries.filter(e => e.stocks.includes(k))
  return NextResponse.json({ entries }, { headers: { 'Cache-Control': 'private, no-store' } })
}
