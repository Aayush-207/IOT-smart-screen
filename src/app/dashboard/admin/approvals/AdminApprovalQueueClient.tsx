'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { AiAdvisoryPanel } from '@/components/AiAdvisoryPanel'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'

export function AdminApprovalQueueClient({
  initialRequests,
  adminId,
}: {
  initialRequests: any[]
  adminId: string
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const decide = async (req: any, decision: 'approved' | 'rejected', reason?: string) => {
    setLoading(true)
    try {
      const patch: Record<string, unknown> = {
        status: decision,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      }
      if (decision === 'rejected') patch.rejection_reason = reason
      const { error } = await supabase.from('announcements').update(patch).eq('id', req.id)
      if (error) throw error

      await logAudit(supabase, {
        actorId: adminId,
        action: decision,
        targetType: 'announcement',
        targetId: req.id,
        targetLabel: req.title,
        metadata: decision === 'rejected' ? { reason } : undefined,
      })

      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      setRejectTarget(null)
      setRejectReason('')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert(`Failed to ${decision === 'approved' ? 'approve' : 'reject'} announcement.`)
    } finally {
      setLoading(false)
    }
  }

  const REJECT_PRESETS = [
    'Missing exact date, time, or venue',
    'Low resolution poster / image',
    'Inappropriate phrasing / needs sentence case',
    'Requires HOD pre-approval first',
    'Duplicate or outdated submission',
  ]

  const [query, setQuery] = useState('')

  const filtered = requests.filter((r) => {
    if (!query) return true
    const haystack = `${r.title} ${r.body || ''} ${r.profiles?.email || ''} ${r.departments?.name || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[var(--hairline)] mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="cohere-chip-coral">Critical Governance</span>
            <span className="text-xs font-mono text-[var(--mute)]">{requests.length} Pending High-Priority</span>
          </div>
          <h1 className="cohere-display-product text-[var(--ink)]">
            Critical Approvals Terminal
          </h1>
          <p className="text-sm text-[var(--slate)] max-w-xl mt-1.5 leading-relaxed">
            Campus-wide emergency alerts, critical policy broadcasts, and high-priority cross-departmental announcements requiring Admin verification.
          </p>
        </div>

        {requests.length > 0 && (
          <div className="w-full sm:w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search approvals..."
              className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
            />
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="p-16 text-center border border-[var(--hairline)] rounded-2xl bg-[var(--canvas-stone)]/30 text-[var(--slate)]">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-[var(--cohere-deep-green)] opacity-70" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">Critical Queue Empty</h3>
          <p className="text-xs max-w-sm mx-auto mt-1">
            No high-priority or campus-wide announcements awaiting admin review.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[var(--hairline)] rounded-2xl bg-[var(--canvas-stone)]/30 text-[var(--slate)]">
          <p className="text-xs">No announcements match &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req.id} className="p-6 rounded-2xl border border-[#ffad9b] bg-[var(--canvas)] space-y-4">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="cohere-chip-coral">Critical Priority</span>
                    <span className="text-xs font-mono text-[var(--slate)]">{req.departments?.name || 'Cross-Department'}</span>
                  </div>
                  <h3 className="font-semibold text-base text-[var(--ink)]">{req.title}</h3>
                  <p className="text-xs text-[var(--mute)] font-mono mt-1">
                    {req.profiles?.email} &middot; submitted {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--body)] leading-relaxed">
                {req.body || <em className="text-[var(--mute)]">No message body provided.</em>}
              </p>

              {req.ai_advisory && <div><AiAdvisoryPanel advisory={req.ai_advisory} /></div>}

              <div className="text-xs text-[var(--slate)] bg-[var(--canvas-stone)]/50 border border-[var(--hairline)] rounded-lg p-3 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                <span><b>TARGETS:</b> {req.target_all ? 'All Campus Screens' : (req.target_zones || []).join(', ') || '—'}</span>
                {req.display_start && (
                  <>
                    <span className="text-[var(--hairline)]">&bull;</span>
                    <span>
                      <b>WINDOW:</b> {new Date(req.display_start).toLocaleDateString()}
                      {req.display_end && ` – ${new Date(req.display_end).toLocaleDateString()}`}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[var(--hairline)]">
                <button
                  disabled={loading}
                  onClick={() => decide(req, 'approved')}
                  className="cohere-btn-primary text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve for Broadcast
                </button>
                <button
                  disabled={loading}
                  onClick={() => setRejectTarget(req)}
                  className="cohere-btn-pill-outline border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Reject Submission
                </button>
                <button
                  onClick={() => setPreviewTarget(req)}
                  className="cohere-btn-secondary text-xs ml-auto"
                >
                  <Eye className="w-3.5 h-3.5 text-[var(--cohere-action-blue)]" /> Billboard Simulator &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-[var(--canvas-elevated)] rounded-2xl border border-[var(--hairline)] p-6 w-full max-w-lg floating-shadow">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-1">Reject &ldquo;{rejectTarget.title}&rdquo;</h3>
            <p className="text-xs text-[var(--mute)] mb-3">Provide feedback so the submitter understands why this was declined.</p>

            <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-[var(--mute)] block mb-1.5">Quick Reason Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="px-2.5 py-1 rounded-lg border border-[var(--hairline)] text-[11px] text-[var(--body)] hover:text-[var(--ink)] hover:bg-[var(--canvas-inset)] cursor-pointer text-left"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Enter rejection reason or feedback..."
              className="w-full p-3 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-xl text-sm text-[var(--ink)] focus:outline-none focus:border-rose-500 mb-4"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="px-4 py-2 text-xs font-semibold text-[var(--mute)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => decide(rejectTarget, 'rejected', rejectReason.trim())}
                disabled={loading || !rejectReason.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all cursor-pointer shadow-xs"
              >
                {loading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
      {previewTarget && (
        <BillboardPreviewModal
          isOpen={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          title={previewTarget.title}
          body={previewTarget.body}
          priority={previewTarget.priority}
          departmentName={previewTarget.departments?.name || 'Department Announcement'}
          attachmentUrl={previewTarget.attachment_url}
        />
      )}
    </>
  )
}
