import type { SupabaseClient } from '@supabase/supabase-js'

export async function logAudit(
  supabase: SupabaseClient,
  params: {
    actorId: string
    action: string
    targetType: 'announcement' | 'screen' | 'broadcast'
    targetId?: string | null
    targetLabel?: string | null
    metadata?: Record<string, unknown> | null
  }
) {
  const { error } = await supabase.from('audit_log').insert({
    actor_id: params.actorId,
    action: params.action,
    target_type: params.targetType,
    target_id: params.targetId || null,
    target_label: params.targetLabel || null,
    metadata: params.metadata || null,
  })
  if (error) console.error('Failed to write audit log:', error)
}
