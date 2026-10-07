import { pageMetadata } from '@/lib/site'

export const metadata = pageMetadata('/live', '실제 운용 성적표', '사이트가 공개한 25% 룰 신호를 그대로 따랐다면 실제 TQQQ 가격으로 얼마가 됐는지 매일 쌓는 기록.')

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
