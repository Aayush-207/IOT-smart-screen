import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditLogClient } from './AuditLogClient'

export const dynamic = 'force-dynamic'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: rows } = await supabase
    .from('audit_log')
    .select('*, profiles(email, role)')
    .order('created_at', { ascending: false })
    .limit(500)

  // Fetch announcements to enrich audit log with poster visual and duration
  let announcementMap: Record<string, any> = {}
  const { data: allAnnouncements } = await supabase
    .from('announcements')
    .select('id, title, attachment_url, display_start, display_end, created_at, status')

  if (allAnnouncements) {
    allAnnouncements.forEach((a: any) => {
      announcementMap[a.id] = a
      if (a.title && !announcementMap[`title:${a.title.toLowerCase()}`]) {
        announcementMap[`title:${a.title.toLowerCase()}`] = a
      }
    })
  }

  // Attach announcement info to each audit row
  const enrichedRows = (rows || []).map((r: any) => {
    const ann =
      (r.target_id && announcementMap[r.target_id]) ||
      (r.target_label && announcementMap[`title:${r.target_label.toLowerCase()}`]) ||
      null

    return {
      ...r,
      announcement: ann,
    }
  })

  return <AuditLogClient rows={enrichedRows} />
}
