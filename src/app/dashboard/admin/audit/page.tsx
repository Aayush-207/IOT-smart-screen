import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AuditLogClient } from './AuditLogClient'

export default async function AuditLogPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return redirect('/login')

  const { data: rows } = await supabase
    .from('audit_log')
    .select('*, profiles(email, role)')
    .order('created_at', { ascending: false })
    .limit(500)

  return <AuditLogClient rows={rows || []} />
}
