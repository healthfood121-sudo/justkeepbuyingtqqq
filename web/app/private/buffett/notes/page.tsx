import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import NotesClient, { type NoteEntry } from './NotesClient'
import data from './notes.json'

// 버핏·멍거 주주총회 노트 — 책에서 뽑은 질문·답과 내 생각. 서버에서 로그인 확인 뒤에만 내용을 내려보낸다
// (화면 코드(JS 파일)에는 노트 내용이 들어가지 않는다).
export default async function BuffettNotesPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) redirect('/private/login')
  const d = data as unknown as { topics: [string, string][]; entries: NoteEntry[] }
  return <NotesClient topics={d.topics} entries={d.entries} />
}
