'use client'

// 간단한 마크다운 렌더러 — 헤딩, 굵게, 인용문, 구분선, 목록, 표 처리
// react-markdown 없이 직접 파싱

function InlineText({ text }: { text: string }) {
  // **굵게**, `코드` 인라인 처리
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-bold text-gray-900 dark:text-white">{p.slice(2, -2)}</strong>
        }
        if (p.startsWith('`') && p.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-sm font-mono text-gray-800 dark:text-gray-200">{p.slice(1, -1)}</code>
        }
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

function TableRow({ line, isHeader }: { line: string; isHeader: boolean }) {
  const cells = line.split('|').map(c => c.trim()).filter(Boolean)
  const Tag = isHeader ? 'th' : 'td'
  return (
    <tr className={isHeader ? 'bg-gray-100 dark:bg-gray-800' : 'border-t border-gray-100 dark:border-gray-800'}>
      {cells.map((c, i) => (
        <Tag key={i} className={`px-3 py-2 text-left text-sm ${isHeader ? 'font-bold text-gray-700 dark:text-gray-300' : 'text-gray-700 dark:text-gray-300'}`}>
          <InlineText text={c} />
        </Tag>
      ))}
    </tr>
  )
}

export default function MarkdownView({ content }: { content: string }) {
  const lines = content.split('\n')
  const nodes: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 구분선
    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={i} className="my-6 border-gray-200 dark:border-gray-700" />)
      i++
      continue
    }

    // H1
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      nodes.push(
        <h1 key={i} className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
          <InlineText text={line.slice(2)} />
        </h1>
      )
      i++
      continue
    }

    // H2
    if (line.startsWith('## ') && !line.startsWith('### ')) {
      nodes.push(
        <h2 key={i} className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mt-7 mb-3 scroll-mt-20">
          <InlineText text={line.slice(3)} />
        </h2>
      )
      i++
      continue
    }

    // H3
    if (line.startsWith('### ')) {
      nodes.push(
        <h3 key={i} className="text-base font-bold text-gray-800 dark:text-gray-200 mt-5 mb-2">
          <InlineText text={line.slice(4)} />
        </h3>
      )
      i++
      continue
    }

    // 인용문 블록 (연속된 > 줄 묶음)
    if (line.startsWith('>')) {
      const quoteLines: string[] = []
      while (i < lines.length && lines[i].startsWith('>')) {
        quoteLines.push(lines[i].slice(1).trim())
        i++
      }
      nodes.push(
        <blockquote key={`q-${i}`} className="my-4 pl-4 border-l-4 border-indigo-400 dark:border-indigo-600 space-y-1">
          {quoteLines.map((q, j) =>
            q ? (
              <p key={j} className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
                <InlineText text={q} />
              </p>
            ) : <div key={j} className="h-1" />
          )}
        </blockquote>
      )
      continue
    }

    // 비순서 목록 (- 또는 * 로 시작하는 연속 줄)
    if (/^[-*] /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items.push(lines[i].slice(2))
        i++
      }
      nodes.push(
        <ul key={`ul-${i}`} className="my-3 pl-5 space-y-1 list-disc">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      )
      continue
    }

    // 순서 목록 (숫자. 로 시작하는 연속 줄)
    if (/^\d+\. /.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      nodes.push(
        <ol key={`ol-${i}`} className="my-3 pl-5 space-y-1 list-decimal">
          {items.map((item, j) => (
            <li key={j} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              <InlineText text={item} />
            </li>
          ))}
        </ol>
      )
      continue
    }

    // 테이블 (| 로 시작하는 연속 줄)
    if (line.startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      // 구분선 행(|---|---|) 제거
      const dataLines = tableLines.filter(l => !/^\|[-| :]+\|$/.test(l.trim()))
      if (dataLines.length > 0) {
        nodes.push(
          <div key={`tbl-${i}`} className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-sm">
              <thead><TableRow line={dataLines[0]} isHeader /></thead>
              <tbody>
                {dataLines.slice(1).map((tl, j) => <TableRow key={j} line={tl} isHeader={false} />)}
              </tbody>
            </table>
          </div>
        )
      }
      continue
    }

    // 빈 줄
    if (line.trim() === '') {
      i++
      continue
    }

    // 일반 문단
    nodes.push(
      <p key={i} className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed my-2">
        <InlineText text={line} />
      </p>
    )
    i++
  }

  return <div className="max-w-4xl mx-auto">{nodes}</div>
}
