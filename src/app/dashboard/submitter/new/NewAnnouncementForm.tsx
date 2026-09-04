'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UploadCloud, Eye, Monitor, Smartphone, Loader2, Building2, Clock } from 'lucide-react'
import { PRIORITY_LABEL, type Priority } from '@/lib/priority'
import { BillboardPreviewModal } from '@/components/BillboardPreviewModal'

interface Department {
  id: string
  name: string
}

// Submitters and HODs pick from these three; Emergency broadcasts go through
// the dedicated /dashboard/admin/emergency screen instead.
const SUBMITTER_PRIORITIES: Priority[] = ['routine', 'timesensitive', 'critical']

function toLocalDatetimeInput(isoStr?: string | null): string {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function NewAnnouncementForm({
  userId,
  defaultDepartmentId,
  departments,
  zones,
  existing,
}: {
  userId: string
  defaultDepartmentId: string
  departments: Department[]
  zones: string[]
  existing: any | null
}) {
  const supabase = createClient()
  const router = useRouter()

  const [title, setTitle] = useState(existing?.title || '')
  const [body, setBody] = useState(existing?.body || '')
  const [departmentId, setDepartmentId] = useState(existing?.department_id || defaultDepartmentId)
  const [priority, setPriority] = useState<Priority>(
    SUBMITTER_PRIORITIES.includes(existing?.priority) ? existing.priority : 'routine'
  )
  const [targetAll, setTargetAll] = useState<boolean>(existing?.target_all || false)
  const [targetZones, setTargetZones] = useState<string[]>(existing?.target_zones || [])
  const [displayStart, setDisplayStart] = useState(toLocalDatetimeInput(existing?.display_start))
  const [displayEnd, setDisplayEnd] = useState(toLocalDatetimeInput(existing?.display_end))
  const [attachment, setAttachment] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState<'draft' | 'approval' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')

  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null)

  const handleFileChange = (file: File | null) => {
    if (!file) {
      setAttachment(null)
      setAttachmentPreview(null)
      return
    }
    // Security validation: max 10MB
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachment must be smaller than 10MB.')
      return
    }
    // Security validation: image types only
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Only JPEG, PNG, and WebP images are allowed.')
      return
    }
    setError(null)
    setAttachment(file)
    setAttachmentPreview(URL.createObjectURL(file))
  }

  const removeAttachment = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview)
    setAttachment(null)
    setAttachmentPreview(null)
  }

  const applyWindowPreset = (hours: number) => {
    const now = new Date()
    const end = new Date(now.getTime() + hours * 60 * 60 * 1000)
    setDisplayStart(toLocalDatetimeInput(now.toISOString()))
    setDisplayEnd(toLocalDatetimeInput(end.toISOString()))
  }

  const toggleZone = (zone: string) => {
    setTargetZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]))
  }

  const selectAllZones = () => {
    setTargetAll(false)
    setTargetZones([...zones])
  }

  const clearAllZones = () => {
    setTargetAll(false)
    setTargetZones([])
  }

  const handleSubmit = async (mode: 'draft' | 'approval') => {
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (mode === 'approval' && !targetAll && targetZones.length === 0) {
      setError('Select at least one target screen.')
      return
    }
    if (mode === 'approval' && (!displayStart || !displayEnd)) {
      setError('Display start and end are required to submit for approval.')
      return
    }
    if (mode === 'approval' && displayStart && displayEnd && new Date(displayEnd).getTime() <= new Date(displayStart).getTime()) {
      setError('Display stop time must be later than the display start time.')
      return
    }

    setSubmitting(mode)
    try {
      let attachmentUrl: string | null = existing?.attachment_url || null
      if (attachment) {
        const fileExt = attachment.name.split('.').pop()
        const filePath = `announcements/${userId}/${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage.from('posters').upload(filePath, attachment)
        if (uploadError) throw uploadError
        const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(filePath)
        attachmentUrl = publicUrl
      }

      const payload = {
        title: title.trim(),
        body: body.trim(),
        department_id: departmentId || null,
        priority,
        target_all: targetAll,
        target_zones: targetAll ? [] : targetZones,
        attachment_url: attachmentUrl,
        display_start: displayStart ? new Date(displayStart).toISOString() : null,
        display_end: displayEnd ? new Date(displayEnd).toISOString() : null,
        status: mode === 'approval' ? 'pending_approval' : 'draft',
        rejection_reason: null,
      }

      let announcementId: string | undefined = existing?.id
      if (existing) {
        const { error: dbError } = await supabase.from('announcements').update(payload).eq('id', existing.id)
        if (dbError) throw dbError
      } else {
        const { data: inserted, error: dbError } = await supabase
          .from('announcements')
          .insert({ ...payload, submitted_by: userId })
          .select('id')
          .single()
        if (dbError) throw dbError
        announcementId = inserted?.id
      }

      // Advisory moderation pass — non-blocking (blueprint Part 22).
      if (mode === 'approval' && announcementId) {
        fetch('/api/announcements/moderate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ id: announcementId }),
        }).catch(() => {})
      }

      router.push('/dashboard/submitter')
      router.refresh()
    } catch (e: any) {
      console.error(e)
      setError(e.message || 'Failed to save announcement.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-6xl animate-fade-in-up">
      {/* Main Form (Left 2 cols) */}
      <div className="xl:col-span-2 p-6 md:p-8 rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] shadow-sm space-y-6">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">Submission Editor</span>
          <h2 className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-white mt-1">Compose Announcement</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              Title <span className="text-rose-500">*</span>
            </label>
            <span className="font-mono text-[11px] text-neutral-500 dark:text-[#7d8187]">
              {title.length}/100
            </span>
          </div>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Tech Fest Registrations Open"
            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all font-medium"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              Message Content
            </label>
            <span className="font-mono text-[11px] text-neutral-500 dark:text-[#7d8187]">
              {body.length}/500
            </span>
          </div>
          <textarea
            value={body}
            maxLength={500}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Describe the details, dates, venue, or eligibility requirements for students and faculty..."
            className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl text-sm text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 dark:focus:border-white transition-all leading-relaxed"
          />
        </div>

        {/* Department & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white mb-1.5">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
            >
              <option value="">General / Campus-Wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white mb-1.5">
              Priority Tier
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {SUBMITTER_PRIORITIES.map((p) => {
                const isSelected = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2 rounded-xl text-[11px] font-mono font-semibold uppercase tracking-wider border transition-all cursor-pointer truncate ${
                      isSelected
                        ? p === 'critical'
                          ? 'border-rose-500 bg-rose-500 text-white shadow-xs'
                          : p === 'timesensitive'
                          ? 'border-sky-500 bg-sky-500 text-white shadow-xs'
                          : 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-[#0a0a0a] shadow-xs'
                        : 'border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-white/5'
                    }`}
                  >
                    {PRIORITY_LABEL[p]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Target Screens & Zones */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              Target Screens &amp; Zones
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllZones}
                className="text-[11px] text-sky-600 dark:text-sky-400 hover:underline font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-neutral-300 dark:text-neutral-700">&bull;</span>
              <button
                type="button"
                onClick={clearAllZones}
                className="text-[11px] text-neutral-500 dark:text-[#7d8187] hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {zones.map((zone) => (
              <label
                key={zone}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                  targetZones.includes(zone)
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] border-neutral-900 dark:border-white shadow-xs'
                    : 'border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5'
                }`}
              >
                <input type="checkbox" className="hidden" checked={targetZones.includes(zone)} onChange={() => toggleZone(zone)} />
                {zone}
              </label>
            ))}
          </div>
        </div>

        {/* Display Window & Presets */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">
              Display Duration
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-neutral-500 dark:text-[#7d8187]">Presets:</span>
              <button
                type="button"
                onClick={() => applyWindowPreset(24)}
                className="px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-[10px] font-mono text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                24H
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(72)}
                className="px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-[10px] font-mono text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(168)}
                className="px-2.5 py-0.5 rounded-full border border-neutral-200 dark:border-[#212327] bg-neutral-50 dark:bg-[#0a0a0a] text-[10px] font-mono text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                7D
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-neutral-500 dark:text-[#7d8187] block mb-1">Start Displaying</span>
              <input
                type="datetime-local"
                value={displayStart}
                onChange={(e) => setDisplayStart(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
            <div>
              <span className="text-[11px] text-neutral-500 dark:text-[#7d8187] block mb-1">Stop Displaying (Auto-Expire)</span>
              <input
                type="datetime-local"
                value={displayEnd}
                onChange={(e) => setDisplayEnd(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-900 dark:focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Attachment Upload Zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white mb-1.5">
            Slide Poster / Graphic (Optional)
          </label>
          
          {attachmentPreview || (existing?.attachment_url && !attachment) ? (
            <div className="relative p-3 bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327] rounded-xl flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentPreview || existing.attachment_url}
                alt="Poster preview"
                className="w-20 h-20 rounded-lg object-cover border border-neutral-200 dark:border-[#212327] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-neutral-900 dark:text-white truncate">
                  {attachment ? attachment.name : 'Current Attachment'}
                </p>
                <p className="text-[11px] text-neutral-500 dark:text-[#7d8187]">
                  {attachment ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Stored image'}
                </p>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="mt-1 text-xs text-rose-600 hover:underline font-medium cursor-pointer"
                >
                  Remove visual
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border border-dashed border-neutral-300 dark:border-[#212327] hover:border-neutral-400 dark:hover:border-white/30 rounded-xl cursor-pointer transition-colors bg-neutral-50/60 dark:bg-[#0a0a0a]/50 hover:bg-neutral-100/60 dark:hover:bg-white/[0.03]">
              <UploadCloud className="w-6 h-6 text-neutral-400 dark:text-[#7d8187] mb-2" />
              <p className="text-xs font-medium text-neutral-900 dark:text-white">Click to upload poster or drag and drop</p>
              <p className="text-[10px] text-neutral-500 dark:text-[#7d8187] mt-0.5 font-mono">JPEG, PNG, or WebP up to 10MB</p>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </label>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-neutral-200 dark:border-[#212327]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('approval')}
              className="px-5 py-2.5 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] text-xs font-medium hover:opacity-90 active:scale-95 transition-all inline-flex items-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
            >
              {submitting === 'approval' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting…</span>
                </>
              ) : (
                <span>Submit for Approval</span>
              )}
            </button>
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white text-xs font-medium hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-95 transition-all inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {submitting === 'draft' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving…</span>
                </>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-4 py-2.5 rounded-full border border-neutral-200 dark:border-white/20 text-neutral-700 dark:text-white text-xs font-medium hover:bg-neutral-100 dark:hover:bg-white/5 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-500" /> Billboard Simulator
          </button>
        </div>
      </div>

      {/* Live Mini Billboard Agent Console Card (Right Col) */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-neutral-200 dark:border-[#212327] bg-white dark:bg-[#141414] p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 border-b border-neutral-200 dark:border-[#212327] pb-3 gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Display Output
            </span>
            <div className="flex bg-neutral-100 dark:bg-[#0a0a0a] p-1 rounded-full border border-neutral-200 dark:border-[#212327] text-[10px]">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-xs'
                    : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Monitor className="w-3 h-3" /> 16:9
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-[#0a0a0a] font-medium shadow-xs'
                    : 'text-neutral-500 dark:text-[#7d8187] hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3 h-3" /> 9:16
              </button>
            </div>
          </div>

          <div className={`mx-auto rounded-xl bg-black border border-white/10 flex flex-col justify-between p-3.5 text-center text-white overflow-hidden relative transition-all duration-300 ${
            orientation === 'landscape' ? 'w-full aspect-[16/9]' : 'w-[56.25%] aspect-[9/16]'
          }`}>
            {attachmentPreview || existing?.attachment_url ? (
              <img
                src={attachmentPreview || existing?.attachment_url}
                alt="Mini preview"
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <>
                <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 truncate relative z-10">
                  {departments.find((d) => d.id === departmentId)?.name || 'Campus Wide'} &bull; {PRIORITY_LABEL[priority]}
                </div>

                <div className="my-auto relative z-10">
                  <h4 className="text-xs font-semibold line-clamp-2 px-1 text-white">
                    {title.trim() || 'Announcement Title'}
                  </h4>
                  {body.trim() && (
                    <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1 px-2">
                      {body}
                    </p>
                  )}
                </div>

                <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/5 pt-1 mt-auto relative z-10">
                  <span>CampusCast Engine</span>
                  <span>{targetZones.length} Target Screens</span>
                </div>
              </>
            )}
          </div>

          {/* Live Configuration Details */}
          <div className="mt-5 pt-4 border-t border-neutral-200 dark:border-[#212327] space-y-2.5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 dark:text-[#7d8187]">
              Dispatch Specifications
            </div>

            <div className="grid grid-cols-1 gap-2 text-xs">
              {/* Department */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327]">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-[#dadbdf]">
                  <Building2 className="w-3.5 h-3.5 text-sky-500" />
                  <span className="text-[11px] font-medium">Department</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-neutral-900 dark:text-white truncate max-w-[150px]">
                  {departments.find((d) => d.id === departmentId)?.name || 'Campus Wide'}
                </span>
              </div>

              {/* Screens Selected */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327]">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-[#dadbdf]">
                  <Monitor className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-[11px] font-medium">Screens Selected</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-neutral-900 dark:text-white text-right">
                  {targetZones.length > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {targetZones.length} node{targetZones.length > 1 ? 's' : ''} ({targetZones.join(', ')})
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400">0 selected</span>
                  )}
                </span>
              </div>

              {/* Duration / Schedule */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#212327]">
                <div className="flex items-center gap-2 text-neutral-600 dark:text-[#dadbdf]">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-[11px] font-medium">Duration</span>
                </div>
                <span className="text-[11px] font-mono font-medium text-neutral-900 dark:text-white text-right">
                  {displayStart ? (
                    <span>
                      {displayStart.replace('T', ' ')} {displayEnd ? `→ ${displayEnd.replace('T', ' ')}` : '(Permanent)'}
                    </span>
                  ) : (
                    <span className="text-neutral-500 dark:text-[#7d8187]">Immediate</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

          <p className="text-[11px] text-[var(--slate)] dark:text-neutral-400 mt-4 leading-relaxed">
            Content is vetted against automated safety policies before transmission to department HODs and admin consoles.
          </p>
        </div>

      <BillboardPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        body={body}
        priority={priority}
        departmentName={departments.find((d) => d.id === departmentId)?.name || 'Department Announcement'}
        attachmentUrl={existing?.attachment_url}
        attachmentFile={attachment}
      />
    </div>
  )
}
