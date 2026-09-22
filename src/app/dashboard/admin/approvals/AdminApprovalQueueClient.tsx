'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, Loader2, Building2, Clock, Monitor } from 'lucide-react'
import { logAudit } from '@/lib/audit'
import { AiAdvisoryPanel } from '@/components/AiAdvisoryPanel'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'
import { formatDate, formatDuration } from '@/lib/dateUtils'

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
    <div className="space-y-4 text-slate-900  animate-fade-in-up">
      {requests.length === 0 ? (
        <div className="p-12 text-center bg-white  border border-slate-200  rounded-xl text-xs text-slate-500  shadow-sm">
          No pending approvals require admin escalation.
        </div>
      ) : (
        requests.map((req) => {
          const isApproving = processingAction?.id === req.id && processingAction?.type === 'approve'
          const isRejecting = processingAction?.id === req.id && processingAction?.type === 'reject'

          return (
            <div
              key={req.id}
              className="bg-white  border border-slate-200  rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-300  transition-all shadow-sm card-hover"
            >
              <div className="space-y-3 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-slate-200  text-slate-900  bg-slate-100 ">
                    {req.priority.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-slate-500 ">
                    {req.departments?.name || 'Campus Wide'} &bull; Submitted by {req.profiles?.email}
                  </span>
                  <span suppressHydrationWarning className="text-[10px] text-slate-400   font-mono">
                    &bull; {formatDate(req.created_at)}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-medium text-slate-900  truncate">{req.title}</h3>
                  {req.body && (
                    <p className="text-xs text-slate-600  line-clamp-2 mt-1 leading-relaxed font-normal">
                      {req.body}
                    </p>
                  )}
                </div>

                {/* Visual Details Bar: Duration, Screens, Department */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {/* Department */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100  border border-slate-200  text-xs">
                    <Building2 className="w-3.5 h-3.5 text-sky-600 " />
                    <span className="text-[10px] uppercase font-mono text-slate-400 ">Dept:</span>
                    <span className="font-medium text-slate-800  font-mono text-[11px]">
                      {req.departments?.name || 'Campus Wide'}
                    </span>
                  </div>

                  {/* Screens Selected */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100  border border-slate-200  text-xs">
                    <Monitor className="w-3.5 h-3.5 text-[#00eaff] " />
                    <span className="text-[10px] uppercase font-mono text-slate-400 ">Screens:</span>
                    <span className="font-medium text-slate-800  font-mono text-[11px]">
                      {req.target_all
                        ? 'All Campus Screens'
                        : req.target_zones && req.target_zones.length > 0
                          ? `${req.target_zones.length} Nodes (${req.target_zones.join(', ')})`
                          : 'All Campus Screens'}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100  border border-slate-200  text-xs">
                    <Clock className="w-3.5 h-3.5 text-[#af1591] " />
                    <span className="text-[10px] uppercase font-mono text-slate-400 ">Duration:</span>
                    <span suppressHydrationWarning className="font-medium text-slate-800  font-mono text-[11px]">
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

              <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewTarget(req)}
                  className="px-4 py-2 rounded-full border border-slate-200  text-slate-900  hover:bg-slate-100  text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors btn-press"
                >
                  <Eye className="w-3.5 h-3.5" /> Simulator
                </button>
                <button
                  type="button"
                  disabled={!!processingAction}
                  onClick={() => handleApprove(req.id, req.title)}
                  className="px-4 py-2 rounded-full bg-[#121826] text-white   hover:opacity-90 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-sm btn-press"
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
                  className="px-4 py-2 rounded-full border border-[#ef2045]/30 text-[#ef2045]  hover:bg-[#ffeaea]  text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors btn-press"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
              </div>

              {rejectId === req.id && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                  <div className="bg-white  rounded-2xl border border-slate-200  p-6 w-full max-w-md space-y-4 shadow-2xl text-slate-900  animate-scale-in">
                    <h3 className="text-sm font-semibold text-slate-900 ">Admin Rejection Feedback</h3>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="State the reason for rejecting this announcement..."
                      rows={3}
                      className="w-full bg-slate-50  border border-slate-200  rounded-xl px-3.5 py-2 text-xs text-slate-900  placeholder:text-slate-400 focus:outline-none focus:border-[#121826]  leading-relaxed"
                    />
                    <div className="flex gap-2 justify-end pt-2">
                      <button
                        type="button"
                        onClick={() => setRejectId(null)}
                        className="px-4 py-1.5 rounded-full border border-slate-200  text-slate-700  hover:bg-slate-100  text-xs font-mono cursor-pointer btn-press"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={!!processingAction || !rejectReason.trim()}
                        onClick={() => handleReject(req.id, req.title)}
                        className="px-5 py-1.5 rounded-full bg-[#ef2045] text-white text-xs font-mono uppercase tracking-wider hover:bg-[#ef2045] disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5 btn-press"
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
