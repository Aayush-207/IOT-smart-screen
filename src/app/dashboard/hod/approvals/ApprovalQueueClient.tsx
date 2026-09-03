'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, X, Loader2, Building2, Clock, Monitor } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { priorityLabel } from '@/lib/priority'
import { AiAdvisoryPanel } from '@/components/AiAdvisoryPanel'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'
import { formatDate, formatDuration } from '@/lib/dateUtils'

export function ApprovalQueueClient({
  initialRequests,
  hodId,
}: {
  initialRequests: any[]
  hodId: string
  departmentId: string
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [processingAction, setProcessingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [rejectTarget, setRejectTarget] = useState<any | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (req: any) => {
    setProcessingAction({ id: req.id, type: 'approve' })
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
      setProcessingAction(null)
    }
  }

  const handleReject = async () => {
    if (!rejectTarget || !rejectReason.trim()) return
    setProcessingAction({ id: rejectTarget.id, type: 'reject' })
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
      setProcessingAction(null)
    }
  }

  const REJECT_PRESETS = [
    'Missing exact date, time, or venue',
    'Low resolution poster / flier image',
    'Inappropriate phrasing / formatting needed',
    'Event not approved by department faculty',
    'Duplicate or outdated submission',
  ]

  return (
    <div className="space-y-6 text-neutral-900 dark:text-white">
      {requests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl space-y-3 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-white/5 border border-emerald-200 dark:border-[#212327] flex items-center justify-center mx-auto text-emerald-600 dark:text-white">
            <CheckCircle className="w-5 h-5" />
          </div>
          <h3 className="text-base font-medium text-neutral-900 dark:text-white">All Caught Up</h3>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] max-w-sm mx-auto">
            There are no pending submissions in your department queue right now.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((req) => {
            const isApproving = processingAction?.id === req.id && processingAction?.type === 'approve'
            const isRejecting = processingAction?.id === req.id && processingAction?.type === 'reject'
            const isItemBusy = processingAction?.id === req.id

            return (
              <div
                key={req.id}
                className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-300 dark:hover:border-white/30 transition-all shadow-sm"
              >
                <div className="space-y-3 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
                      {priorityLabel(req.priority)}
                    </span>
                    <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">
                      By {req.profiles?.email || 'Student/Faculty'}
                    </span>
                    <span suppressHydrationWarning className="text-[10px] text-neutral-400 dark:text-[#7d8187] font-mono">
                      &bull; {formatDate(req.created_at)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-medium text-neutral-900 dark:text-white truncate">{req.title}</h3>
                    {req.body && (
                      <p className="text-xs text-neutral-600 dark:text-[#dadbdf] line-clamp-2 mt-1 leading-relaxed font-normal">
                        {req.body}
                      </p>
                    )}
                  </div>

                  {/* Visual Details Bar: Duration, Screens, Department */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {/* Department */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                      <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span className="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">Dept:</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                        {req.departments?.name || 'Campus Wide'}
                      </span>
                    </div>

                    {/* Screens Selected */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                      <Monitor className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">Screens:</span>
                      <span className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                        {req.target_all
                          ? 'All Campus Screens'
                          : req.target_zones && req.target_zones.length > 0
                            ? `${req.target_zones.length} Nodes (${req.target_zones.join(', ')})`
                            : 'All Campus Screens'}
                      </span>
                    </div>

                    {/* Duration */}
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span className="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">Duration:</span>
                      <span suppressHydrationWarning className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                        {formatDuration(req.display_start, req.display_end)}
                      </span>
                    </div>
                  </div>

                  {req.advisory_checks && (
                    <div className="pt-1">
                      <AiAdvisoryPanel advisory={req.advisory_checks} />
                    </div>
                  )}
                </div>

                {/* Actions & Simulator */}
                <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewTarget(req)}
                    className="px-4 py-2 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> Simulator
                  </button>
                  <button
                    type="button"
                    disabled={!!processingAction}
                    onClick={() => handleApprove(req)}
                    className="px-4 py-2 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] hover:opacity-90 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm"
                  >
                    {isApproving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Approving…</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Approve</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={!!processingAction}
                    onClick={() => setRejectTarget(req)}
                    className="px-4 py-2 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-[#212327] p-6 w-full max-w-lg space-y-4 shadow-2xl text-neutral-900 dark:text-white">
            <div className="flex justify-between items-center border-b border-neutral-200 dark:border-[#212327] pb-3">
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Reject Announcement</h3>
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-900 dark:text-[#7d8187] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-600 dark:text-[#dadbdf]">
              Provide feedback for <strong className="text-neutral-900 dark:text-white">&ldquo;{rejectTarget.title}&rdquo;</strong>. The submitter will see this reason to revise their notice.
            </p>

            {/* Quick Reason Presets */}
            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 dark:text-[#7d8187] block mb-1.5">
                Quick Reason Presets:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {REJECT_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRejectReason(preset)}
                    className="px-2.5 py-1 rounded-full border border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-[10px] font-mono text-neutral-700 dark:text-[#dadbdf] hover:border-neutral-400 dark:hover:border-white/40 cursor-pointer transition-colors"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-mono tracking-wider text-neutral-500 dark:text-[#7d8187] block mb-1">
                Custom Feedback Note <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain what changes are needed before this can be approved..."
                rows={3}
                className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white leading-relaxed"
              />
            </div>

            <div className="flex gap-2.5 justify-end pt-2 border-t border-neutral-200 dark:border-[#212327]">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!!processingAction || !rejectReason.trim()}
                onClick={handleReject}
                className="px-5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-mono uppercase tracking-wider hover:bg-rose-500 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
              >
                {processingAction?.type === 'reject' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting…</span>
                  </>
                ) : (
                  <span>Confirm Rejection</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Billboard Simulator Modal */}
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
    </div>
  )
}
