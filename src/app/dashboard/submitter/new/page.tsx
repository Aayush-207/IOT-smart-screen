import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { NewAnnouncementForm } from './NewAnnouncementForm'

export default async function NewAnnouncementPage({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string }>
}) {
  const { edit } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('department_id')
    .eq('id', user.id)
    .single()

  const { data: departments } = await supabase.from('departments').select('id, name').order('name')

  const { data: screens } = await supabase.from('screens').select('zone')
  let dbZones = Array.from(new Set((screens || []).map((s: any) => s.zone).filter(Boolean))).sort() as string[]
  
  // Use mock screens if DB is empty for demonstration
  let zones = dbZones.length > 0 ? dbZones : [
    'Main Lobby Screen 01',
    'Library Entrance Node',
    'Cafeteria Kiosk Display'
  ]

  let existing = null
  if (edit) {
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', edit)
      .eq('submitted_by', user.id)
      .single()
    existing = data
  }

  return (
    <>
      <div className="mb-8 flex flex-col items-start animate-fade-in-up">
        <span className="text-xs font-semibold text-[#512a74] bg-[#512a74]/10 rounded-full px-3 py-1 inline-block mb-3">
          Announcement Authoring
        </span>
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[#1e1e2e]">
          {existing ? 'Edit Announcement' : 'New Announcement'}
        </h1>
        <p className="text-sm text-[#7D7D7D] mt-2">
          Create a text or image announcement to display on campus screens.
        </p>
      </div>

      <NewAnnouncementForm
        userId={user.id}
        defaultDepartmentId={profile?.department_id || ''}
        departments={departments || []}
        zones={zones as string[]}
        existing={existing}
      />
    </>
  )
}
