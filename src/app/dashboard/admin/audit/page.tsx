import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditTabsClient } from './AuditTabsClient'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin' && profile?.role !== 'emergency') return redirect('/dashboard/admin')

  const [
    { data: auditRows },
    { data: allAnnouncements },
    { data: catalogRows }
  ] = await Promise.all([
    supabase
      .from('audit_log')
      .select('*, profiles(email, role)')
      .order('created_at', { ascending: false })
      .limit(500),
    supabase
      .from('announcements')
      .select('id, title, attachment_url, display_start, display_end, created_at, status'),
    supabase
      .from('announcements')
      .select('*, departments(name), profiles!announcements_submitted_by_fkey(email)')
      .in('status', ['approved', 'expired', 'withdrawn'])
      .order('created_at', { ascending: false })
      .limit(200)
  ])

  // Fetch announcements to enrich audit log with poster visual and duration
  const announcementMap: Record<string, any> = {}

  if (allAnnouncements) {
    allAnnouncements.forEach((a: any) => {
      announcementMap[a.id] = a
      if (a.title && !announcementMap[`title:${a.title.toLowerCase()}`]) {
        announcementMap[`title:${a.title.toLowerCase()}`] = a
      }
    })
  }

  // Attach announcement info to each audit row
  const enrichedRows = (auditRows || []).map((r: any) => {
    const ann =
      (r.target_id && announcementMap[r.target_id]) ||
      (r.target_label && announcementMap[`title:${r.target_label.toLowerCase()}`]) ||
      null

    return {
      ...r,
      announcement: ann,
    }
  })

  return (
    <AuditTabsClient
      auditRows={enrichedRows}
      catalogRows={catalogRows || []}
      actorId={user.id}
    />
  )
}
