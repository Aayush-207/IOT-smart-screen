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
  const zones = Array.from(new Set((screens || []).map((s: any) => s.zone).filter(Boolean))).sort()

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
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-heading-lg text-[var(--ink)]">
          {existing ? 'Edit Announcement' : 'New Announcement'}
        </h1>
        <p className="text-sm text-[var(--mute)] mt-1">Create a text or image announcement to display on campus screens.</p>
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
