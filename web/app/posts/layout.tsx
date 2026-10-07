import { pageMetadata } from '@/lib/site'

const base = pageMetadata('/posts', '방법론 & 분석', 'TQQQ 적립식·인출식 방법론과 1971년 이후 모든 시작 시점 백테스트 분석 글 모음.')

// 이 폴더 아래 포스트 제목에도 사이트 이름이 붙도록 template을 다시 정한다
export const metadata = { ...base, title: { default: '방법론 & 분석', template: '%s | justkeepbuyingtqqq' } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}
