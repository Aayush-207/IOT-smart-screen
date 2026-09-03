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
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleApprove = async (id: string, title: string) => {
    setLoading(true)
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
      setLoading(false)
    }
  }

  const handleReject = async (id: string, title: string) => {
    if (!rejectReason.trim()) return
    setLoading(true)
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
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4 text-white">
      {requests.length === 0 ? (
        <div className="p-12 text-center bg-[#141414] border border-[#212327] rounded-lg text-xs text-[#7d8187]">
          No pending approvals require admin escalation.
        </div>
      ) : (
        requests.map((req) => (
          <div
            key={req.id}
            className="bg-[#141414] border border-[#212327] rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-white/30 transition-colors"
          >
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-white/20 text-white bg-white/5">
                  {req.priority.toUpperCase()}
                </span>
                <span className="text-xs font-mono text-[#7d8187]">
                  {req.departments?.name || 'Campus Wide'} &bull; Submitted by {req.profiles?.email}
                </span>
                <span className="text-[10px] text-[#7d8187] font-mono">
                  &bull; {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>

              <div>
                <h3 className="text-base font-normal text-white truncate">{req.title}</h3>
                {req.body && (
                  <p className="text-xs text-[#dadbdf] line-clamp-2 mt-1 leading-relaxed font-normal">
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
                className="px-4 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> Simulator
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleApprove(req.id, req.title)}
                className="px-4 py-2 rounded-full bg-white text-[#0a0a0a] hover:bg-neutral-200 text-xs font-medium inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-3.5 h-3.5" /> Approve
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => setRejectId(req.id)}
                className="px-4 py-2 rounded-full border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" /> Reject
              </button>
            </div>

            {rejectId === req.id && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
                <div className="bg-[#141414] rounded-xl border border-[#212327] p-6 w-full max-w-md space-y-4 shadow-2xl text-white">
                  <h3 className="text-sm font-normal text-white">Admin Rejection Feedback</h3>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="State the reason for rejecting this announcement..."
                    rows={3}
                    className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white leading-relaxed"
                  />
                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setRejectId(null)}
                      className="px-4 py-1.5 rounded-full border border-white/20 text-white hover:bg-white/5 text-xs font-mono cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={loading || !rejectReason.trim()}
                      onClick={() => handleReject(req.id, req.title)}
                      className="px-5 py-1.5 rounded-full bg-rose-600 text-white text-xs font-mono uppercase tracking-wider hover:bg-rose-500 disabled:opacity-50 cursor-pointer"
                    >
                      Confirm Reject
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))
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
