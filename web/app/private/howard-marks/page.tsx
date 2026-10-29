import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import PrivateTabs from '@/components/PrivateTabs'
import CycleChecklist from '@/components/howard-marks/CycleChecklist'

export default async function HowardMarksPage() {
  const cookieStore = await cookies()
  const auth = cookieStore.get('private_auth')
  if (!auth || auth.value !== process.env.PRIVATE_PASSWORD) {
    redirect('/private/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <PrivateTabs active="howard-marks" />
        <div className="mt-6">
          <CycleChecklist />
        </div>
      </div>
    </div>
  )
}
