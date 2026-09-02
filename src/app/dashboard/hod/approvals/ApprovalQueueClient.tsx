'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, X } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { priorityLabel } from '@/lib/priority'
import { AiAdvisoryPanel } from '@/components/AiAdvisoryPanel'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'

export function ApprovalQueueClient({
  initialRequests,
  hodId,
}: {
  initialRequests: any[]
  hodId: string
  departmentId: string
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [loading, setLoading] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [viewTarget, setViewTarget] = useState<any | null>(null)
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (req: any) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'approved', reviewed_by: hodId, reviewed_at: new Date().toISOString() })
        .eq('id', req.id)
      if (error) throw error

      await logAudit(supabase, {
        actorId: hodId,
        action: 'approved',
        targetType: 'announcement',
        targetId: req.id,
        targetLabel: req.title,
      })

      setRequests((prev) => prev.filter((r) => r.id !== req.id))
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to approve announcement.')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
          reviewed_by: hodId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', rejectTarget.id)
      if (error) throw error

      await logAudit(supabase, {
        actorId: hodId,
        action: 'rejected',
        targetType: 'announcement',
        targetId: rejectTarget.id,
        targetLabel: rejectTarget.title,
        metadata: { reason: rejectReason.trim() },
      })

      setRequests((prev) => prev.filter((r) => r.id !== rejectTarget.id))
      setRejectTarget(null)
      setRejectReason('')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to reject announcement.')
    } finally {
      setLoading(false)
    }
  }

  const REJECT_PRESETS = [
    'Missing exact date, time, or venue',
    'Low resolution poster / flier image',
    'Inappropriate phrasing / formatting needed',
    'Event not approved by department faculty',
    'Duplicate or outdated submission',
  ]

  const [query, setQuery] = useState('')

  const filtered = requests.filter((r) => {
    if (!query) return true
    const haystack = `${r.title} ${r.body || ''} ${r.profiles?.email || ''}`.toLowerCase()
    return haystack.includes(query.toLowerCase())
  })

  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#362d59] mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="sentry-chip-pink">Department Queue</span>
            <span className="text-xs font-mono text-[#8b8496]">{requests.length} Pending Submissions</span>
          </div>
          <h1 className="sentry-display-section text-white">
            Pending Approvals
          </h1>
          <p className="text-sm text-[#bdb8c0] max-w-xl mt-1.5 leading-relaxed">
            Review submissions from your department. Check AI policy recommendations and approve or send back with feedback.
          </p>
        </div>

        {requests.length > 0 && (
          <div className="w-full sm:w-64">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search submissions..."
              className="sentry-input text-xs"
            />
          </div>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="p-16 text-center border border-[#362d59] rounded-2xl bg-[#150f23] text-[#bdb8c0]">
          <CheckCircle className="w-8 h-8 mx-auto mb-3 text-[#c2ef4e]" />
          <h3 className="text-base font-bold text-white">All Submissions Reviewed</h3>
          <p className="text-xs max-w-sm mx-auto mt-1 text-[#8b8496]">
            No pending announcements awaiting authorization for your department.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center border border-[#362d59] rounded-2xl bg-[#150f23] text-[#8b8496]">
          <p className="text-xs">No announcements match &ldquo;{query}&rdquo;.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div key={req.id} className="p-6 rounded-2xl border border-[#362d59] bg-[#150f23] space-y-4 text-white shadow-md">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-bold text-base text-white">{req.title}</h3>
                  <p className="text-xs text-[#8b8496] font-mono mt-1">
                    {req.profiles?.email} &middot; submitted {new Date(req.created_at).toLocaleString()}
                  </p>
                </div>
                <span className="sentry-chip-violet">
                  {priorityLabel(req.priority)}
                </span>
              </div>

              <p className="text-xs text-[#bdb8c0] leading-relaxed">
                {req.body || <em className="text-[#8b8496]">No message body provided.</em>}
              </p>

              {req.ai_advisory && <div><AiAdvisoryPanel advisory={req.ai_advisory} /></div>}

              <div className="text-xs text-[#bdb8c0] bg-[#1f1633] border border-[#362d59] rounded-lg p-3 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                <span><b className="text-white">TARGETS:</b> {req.target_all ? 'All Campus Screens' : (req.target_zones || []).join(', ') || '—'}</span>
                {req.display_start && (
                  <>
                    <span className="text-[#362d59]">&bull;</span>
                    <span>
                      <b className="text-white">WINDOW:</b> {new Date(req.display_start).toLocaleDateString()}
                      {req.display_end && ` – ${new Date(req.display_end).toLocaleDateString()}`}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#362d59]">
                <button
                  disabled={loading}
                  onClick={() => handleApprove(req)}
                  className="sentry-btn-lime text-xs"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve Announcement
                </button>
                <button
                  disabled={loading}
                  onClick={() => setRejectTarget(req)}
                  className="sentry-btn-secondary text-[#fa5252] border-[#fa5252]/40 hover:bg-[#fa5252]/10 text-xs"
                >
                  <XCircle className="w-3.5 h-3.5 text-[#fa5252]" /> Send Feedback / Reject
                </button>
                <button
                  onClick={() => setPreviewTarget(req)}
                  className="sentry-btn-outline text-xs ml-auto"
                >
                  <Eye className="w-3.5 h-3.5 text-[#c2ef4e]" /> Screen Simulator &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#150f23] rounded-2xl border border-[#362d59] p-6 w-full max-w-lg shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white mb-1">Reject &ldquo;{rejectTarget.title}&rdquo;</h3>
            <p className="text-xs text-[#8b8496] mb-3">Provide feedback so the submitter can fix and resubmit.</p>

            <div className="mb-3">
              <span className="text-[10px] uppercase font-bold text-[#8b8496] block mb-1.5">Quick Reason Presets:</span>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="px-2.5 py-1 rounded-lg border border-[#362d59] text-[11px] text-[#bdb8c0] hover:text-white hover:bg-[#1f1633] cursor-pointer text-left transition-colors"
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
              placeholder="e.g. missing exact venue or date — please add and resubmit"
              className="sentry-input text-xs mb-4"
            />
            <div className="flex gap-2.5 justify-end">
              <button
                onClick={() => { setRejectTarget(null); setRejectReason('') }}
                className="px-4 py-2 text-xs font-bold text-[#8b8496] hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectReason.trim()}
                className="sentry-btn-secondary bg-[#fa5252] text-white border-transparent text-xs font-bold disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Rejecting…' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setViewTarget(null)}>
          <div className="bg-[#150f23] rounded-xl border border-[#362d59] p-6 w-full max-w-lg shadow-2xl text-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-bold text-white">{viewTarget.title}</h3>
              <button onClick={() => setViewTarget(null)} className="text-[#8b8496] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {viewTarget.attachment_url && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={viewTarget.attachment_url} alt="Attachment" className="w-full max-h-64 object-contain rounded-lg border border-[#362d59] mb-4" />
            )}
            <p className="text-sm text-[#bdb8c0] whitespace-pre-wrap mb-4">{viewTarget.body || 'No message body.'}</p>
            <AiAdvisoryPanel advisory={viewTarget.ai_advisory} />
            <div className="text-xs text-[#8b8496] space-y-1 border-t border-[#362d59] pt-3 mt-3 font-mono">
              <div>Submitted by: {viewTarget.profiles?.email}</div>
              <div>Priority: {priorityLabel(viewTarget.priority)}</div>
              <div>Targets: {viewTarget.target_all ? 'All Screens' : (viewTarget.target_zones || []).join(', ') || '—'}</div>
              {viewTarget.display_start && (
                <div>
                  Window: {new Date(viewTarget.display_start).toLocaleString()} &ndash;{' '}
                  {viewTarget.display_end ? new Date(viewTarget.display_end).toLocaleString() : 'open'}
                </div>
              )}
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
