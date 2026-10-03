import { readFileSync } from 'node:fs'
import path from 'node:path'

// 서버 컴포넌트 전용 — 빌드 시점에 public CSV 의 첫/마지막 날짜를 읽는다
// (종가 자동 업데이트 커밋 → 재배포 시 함께 갱신)
export function csvDateRange(file: string): { first: string; last: string } {
  const lines = readFileSync(path.join(process.cwd(), 'public', file), 'utf8')
    .trim()
    .split('\n')
  return { first: lines[1].split(',')[0], last: lines[lines.length - 1].split(',')[0] }
}
