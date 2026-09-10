'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logAudit } from '@/lib/audit'
import { StatusBadge } from '@/components/StatusBadge'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'
import { Eye, Trash2, Clock, Monitor, User, Calendar, Loader2, Image as ImageIcon } from 'lucide-react'
import { formatDate, formatDuration } from '@/lib/dateUtils'

export function HodRecentSubmissionsClient({
  initialNotices,
  hodId,
  departmentName,
}: {
  initialNotices: any[]
  hodId: string
  departmentName: string
}) {
  const [notices, setNotices] = useState(initialNotices)
  const [previewTarget, setPreviewTarget] = useState<any | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the notice "${title}"? It will be removed immediately.`)) {
      return
    }

    setDeletingId(id)
    try {
      const res = await fetch('/api/announcements/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = await res.json()

      if (!res.ok || !result.ok) {
        throw new Error(result.error || 'Failed to delete announcement.')
      }

      setNotices((prev) => prev.filter((n) => n.id !== id))
      router.refresh()
    } catch (e: any) {
      console.error(e)
      alert(e.message || 'Failed to delete announcement.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#212327] rounded-2xl overflow-hidden shadow-sm card-hover">
      {/* Header */}
      <div className="p-6 border-b border-neutral-200 dark:border-[#212327] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
            Recent Department Submissions
          </h2>
          <p className="text-xs text-neutral-500 dark:text-[#7d8187] mt-0.5">
            Notices submitted by students and faculty in your department with real-time broadcast details
          </p>
        </div>
        <Link
          href="/dashboard/hod/approvals"
          className="px-4 py-2 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-800 dark:text-white hover:bg-neutral-100 dark:hover:bg-white/5 text-xs font-mono transition-colors self-start sm:self-auto shrink-0 shadow-sm"
        >
          Open Queue &rarr;
        </Link>
      </div>

      {/* Body: Spacious Event Cards */}
      {notices.length === 0 ? (
        <div className="p-16 text-center text-xs text-neutral-500 dark:text-[#7d8187] space-y-2">
          <p className="font-medium text-neutral-800 dark:text-neutral-200 text-sm">No announcements in department</p>
          <p>Submissions from faculty and students will appear here for review and management.</p>
        </div>
      ) : (
        <div className="divide-y divide-neutral-200 dark:divide-[#212327]">
          {notices.map((n) => {
            const hasPoster = Boolean(n.attachment_url)
            const isDeleting = deletingId === n.id

            return (
              <div
                key={n.id}
                className="p-6 hover:bg-neutral-50/60 dark:hover:bg-white/[0.02] transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                {/* Left: Thumbnail & Event Info */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  {/* Poster Thumbnail or Icon */}
                  {hasPoster ? (
                    <button
                      type="button"
                      onClick={() => setPreviewTarget(n)}
                      title="Click to view full poster"
                      className="group relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-neutral-200 dark:border-white/10 shadow-sm cursor-pointer"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={n.attachment_url}
                        alt={n.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                        <Eye className="w-4 h-4" />
                      </div>
                    </button>
                  ) : (
                    <div className="w-20 h-20 rounded-xl bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 shrink-0 flex items-center justify-center text-neutral-400">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                  )}

                  {/* Text Details */}
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={n.status} />
                      {n.priority && (
                        <span className="px-2 py-0.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-neutral-200 dark:border-white/20 text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5">
                          {n.priority}
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-semibold text-neutral-900 dark:text-white truncate">
                        {n.title}
                      </h3>
                      {n.body && (
                        <p className="text-xs text-neutral-600 dark:text-[#dadbdf] line-clamp-2 mt-0.5 leading-relaxed">
                          {n.body}
                        </p>
                      )}
                    </div>

                    {/* Rich Details Chips: Duration, Submitter, Target Screens */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {/* Duration */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                        <Clock className="w-3.5 h-3.5 text-[#af1591] dark:text-[#af1591] shrink-0" />
                        <span className="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">Duration:</span>
                        <span suppressHydrationWarning className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                          {formatDuration(n.display_start, n.display_end)}
                        </span>
                      </div>

                      {/* Submitter */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                        <User className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400 shrink-0" />
                        <span className="font-mono text-[11px] text-neutral-700 dark:text-neutral-300 truncate max-w-[180px]">
                          {n.profiles?.email || 'Faculty/Student'}
                        </span>
                      </div>

                      {/* Target Screens */}
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 text-xs">
                        <Monitor className="w-3.5 h-3.5 text-[#00eaff] dark:text-[#00eaff] shrink-0" />
                        <span className="text-[10px] uppercase font-mono text-neutral-400 dark:text-neutral-500">Screens:</span>
                        <span className="font-medium text-neutral-800 dark:text-neutral-200 font-mono text-[11px]">
                          {n.target_all
                            ? 'All Campus Screens'
                            : n.target_zones && n.target_zones.length > 0
                              ? `${n.target_zones.length} Selected`
                              : 'All Screens'}
                        </span>
                      </div>

                      {/* Submitted Date */}
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 text-xs text-neutral-400 dark:text-neutral-500 font-mono text-[10px]">
                        <Calendar className="w-3 h-3" />
                        <span suppressHydrationWarning>{formatDate(n.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Action Buttons */}
                <div className="flex sm:flex-row lg:flex-col items-center gap-2.5 shrink-0">
                  {/* View Poster Button */}
                  <button
                    type="button"
                    onClick={() => setPreviewTarget(n)}
                    className="w-full px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/15 border border-neutral-200 dark:border-white/10 text-neutral-900 dark:text-white text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{hasPoster ? 'View Poster' : 'Simulator'}</span>
                  </button>

                  {/* Delete Event Button */}
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDelete(n.id, n.title)}
                    className="w-full px-4 py-2 rounded-xl border border-[#ef2045]/30 text-[#ef2045] dark:text-[#ef2045] hover:bg-[#ffeaea] dark:hover:bg-[#ef2045]/10 text-xs font-mono inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Deleting…</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Notice</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Full Resolution Poster / Simulator Modal */}
      {previewTarget && (
        <BillboardPreviewModal
          isOpen={!!previewTarget}
          onClose={() => setPreviewTarget(null)}
          title={previewTarget.title}
          body={previewTarget.body || ''}
          priority={previewTarget.priority || 'routine'}
          departmentName={departmentName}
          attachmentUrl={previewTarget.attachment_url}
        />
      )}
    </div>
  )
}
