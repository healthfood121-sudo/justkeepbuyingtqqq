import type { Metadata } from 'next'
import { posts } from './posts'

// 사이트 주소 (Vercel 환경 변수 NEXT_PUBLIC_SITE_URL로 바꿀 수 있음)
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://justkeepbuyingtqqq.com').replace(/\/$/, '')
export const SITE_NAME = 'justkeepbuyingtqqq'

// 포스트 폴더의 layout.tsx에서 쓰는 메타데이터 (제목·요약은 lib/posts.ts에서)
export function postMetadata(slug: string): Metadata {
  const p = posts.find(x => x.slug === slug)
  if (!p) return {}
  return {
    title: p.title,
    description: p.summary,
    alternates: { canonical: `/posts/${slug}` },
    openGraph: { type: 'article', title: p.title, description: p.summary, url: `/posts/${slug}`, publishedTime: p.date },
  }
}

export function pageMetadata(path: string, title: string, description: string): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path },
  }
}
