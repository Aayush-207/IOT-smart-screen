'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react'
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
  const [processingAction, setProcessingAction] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null)
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (id: string, title: string) => {
    setProcessingAction({ id, type: 'approve' })
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ status: 'approved', reviewed_by: adminId, reviewed_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error

      await logAudit(supabase, {
        actorId: adminId,
        action: 'admin_override_approved',
        targetType: 'announcement',
        targetId: id,
        targetLabel: title,
      })

      setRequests((prev) => prev.filter((r) => r.id !== id))
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to approve announcement.')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (id: string, title: string) => {
    if (!rejectReason.trim()) return
    setProcessingAction({ id, type: 'reject' })
    try {
      const { error } = await supabase
        .from('announcements')
        .update({
          status: 'rejected',
          rejection_reason: rejectReason.trim(),
          reviewed_by: adminId,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
      if (error) throw error

      await logAudit(supabase, {
        actorId: adminId,
        action: 'admin_override_rejected',
        targetType: 'announcement',
        targetId: id,
        targetLabel: title,
        metadata: { reason: rejectReason.trim() },
      })

      setRequests((prev) => prev.filter((r) => r.id !== id))
      setRejectId(null)
      setRejectReason('')
      router.refresh()
    } catch (e) {
      console.error(e)
      alert('Failed to reject announcement.')
    } finally {
      setProcessingAction(null)
    }
  }

  return (
    <div className="space-y-4 text-neutral-900 dark:text-white">
      {requests.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl text-xs text-neutral-500 dark:text-[#7d8187] shadow-sm">
          No pending approvals require admin escalation.
        </div>
      ) : (
        requests.map((req) => {
          const isApproving = processingAction?.id === req.id && processingAction?.type === 'approve'
          const isRejecting = processingAction?.id === req.id && processingAction?.type === 'reject'

          return (
            <div
              key={req.id}
              className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-neutral-300 dark:hover:border-white/30 transition-all shadow-sm"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-900 dark:text-white bg-neutral-100 dark:bg-white/5">
                    {req.priority.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-neutral-500 dark:text-[#7d8187]">
                    {req.departments?.name || 'Campus Wide'} &bull; Submitted by {req.profiles?.email}
                  </span>
                  <span className="text-[10px] text-neutral-400 dark:text-[#7d8187] font-mono">
                    &bull; {new Date(req.created_at).toLocaleDateString()}
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

                {req.advisory_checks && (
                  <div className="pt-1">
                    <AiAdvisoryPanel advisory={req.advisory_checks} />
                  </div>
                )}
              </div>

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
                  onClick={() => handleApprove(req.id, req.title)}
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
                  onClick={() => setRejectId(req.id)}
                  className="px-4 py-2 rounded-full border border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>

              {rejectId === req.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                  <div className="bg-white dark:bg-[#141414] rounded-2xl border border-neutral-200 dark:border-[#212327] p-6 w-full max-w-md space-y-4 shadow-2xl text-neutral-900 dark:text-white">
                    <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">Admin Rejection Feedback</h3>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="State the reason for rejecting this announcement..."
                      rows={3}
                      className="w-full bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white leading-relaxed"
                    />
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setRejectId(null)}
                        className="px-4 py-1.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!!processingAction || !rejectReason.trim()}
                        onClick={() => handleReject(req.id, req.title)}
                        className="px-5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-mono uppercase tracking-wider hover:bg-rose-500 disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5"
                      >
                        {isRejecting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Rejecting…</span>
                          </>
                        ) : (
                          <span>Confirm Reject</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })
      )}

      {/* Billboard Simulator Modal */}
      {previewTarget && (
        <BillboardPreviewModal
          isOpen={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          title={previewTarget.title}
          body={previewTarget.body}
          priority={previewTarget.priority}
          departmentName={previewTarget.departments?.name || 'Campus Wide Announcement'}
          attachmentUrl={previewTarget.attachment_url}
        />
      )}
    </div>
  )
}
