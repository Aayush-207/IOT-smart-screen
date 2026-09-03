'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UploadCloud, Eye } from 'lucide-react'
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
      setError('Select at least one target zone, or "All Screens".')
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
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-6xl">
      {/* Main Form (Left 2 cols) */}
      <div className="xl:col-span-2 p-6 md:p-8 rounded-2xl border border-[var(--border-light)] bg-[var(--canvas)] space-y-6">
        <div>
          <span className="cohere-mono-label text-[var(--mute)]">Submission Editor</span>
          <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)] mt-1">Compose Announcement</h2>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              Title <span className="text-rose-500">*</span>
            </label>
            <span className="font-mono text-[11px] text-[var(--mute)]">
              {title.length}/100
            </span>
          </div>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Tech Fest Registrations Open"
            className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)] focus:ring-1 focus:ring-[var(--focus-blue)] transition-all font-medium"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              Message Content
            </label>
            <span className="font-mono text-[11px] text-[var(--mute)]">
              {body.length}/500
            </span>
          </div>
          <textarea
            value={body}
            maxLength={500}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Describe the details, dates, venue, or eligibility requirements for students and faculty..."
            className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)] focus:ring-1 focus:ring-[var(--focus-blue)] transition-all leading-relaxed"
          />
        </div>

        {/* Department & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
            >
              <option value="">General / Campus-Wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5">
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
                    className={`py-2 px-2 rounded-lg text-[11px] font-mono font-semibold uppercase tracking-wider border transition-all cursor-pointer truncate ${
                      isSelected
                        ? p === 'critical'
                          ? 'border-[#ff7759] bg-[#ff7759] text-white'
                          : p === 'timesensitive'
                          ? 'border-[#1863dc] bg-[#1863dc] text-white'
                          : 'border-[var(--cohere-near-black)] bg-[var(--cohere-near-black)] text-white'
                        : 'border-[var(--hairline)] text-[var(--slate)] hover:bg-[var(--canvas-stone)]'
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              Target Screens &amp; Zones
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllZones}
                className="text-[11px] text-[var(--cohere-action-blue)] hover:underline font-medium cursor-pointer"
              >
                Select All
              </button>
              <span className="text-[var(--hairline)]">&bull;</span>
              <button
                type="button"
                onClick={clearAllZones}
                className="text-[11px] text-[var(--slate)] hover:underline font-medium cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label
              className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                targetAll
                  ? 'bg-[var(--cohere-near-black)] text-white border-[var(--cohere-near-black)]'
                  : 'border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--canvas-stone)]'
              }`}
            >
              <input type="checkbox" className="hidden" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} />
              All Campus Screens
            </label>
            {zones.map((zone) => (
              <label
                key={zone}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border cursor-pointer transition-all ${
                  targetAll ? 'opacity-40 pointer-events-none' : ''
                } ${
                  targetZones.includes(zone)
                    ? 'bg-[var(--cohere-near-black)] text-white border-[var(--cohere-near-black)]'
                    : 'border-[var(--hairline)] text-[var(--ink)] hover:bg-[var(--canvas-stone)]'
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)]">
              Display Duration
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-[var(--mute)]">Presets:</span>
              <button
                type="button"
                onClick={() => applyWindowPreset(24)}
                className="px-2.5 py-0.5 rounded-full border border-[var(--hairline)] text-[10px] font-mono text-[var(--ink)] hover:bg-[var(--canvas-stone)] cursor-pointer"
              >
                24H
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(72)}
                className="px-2.5 py-0.5 rounded-full border border-[var(--hairline)] text-[10px] font-mono text-[var(--ink)] hover:bg-[var(--canvas-stone)] cursor-pointer"
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(168)}
                className="px-2.5 py-0.5 rounded-full border border-[var(--hairline)] text-[10px] font-mono text-[var(--ink)] hover:bg-[var(--canvas-stone)] cursor-pointer"
              >
                7D
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-[var(--slate)] block mb-1">Start Displaying</span>
              <input
                type="datetime-local"
                value={displayStart}
                onChange={(e) => setDisplayStart(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
              />
            </div>
            <div>
              <span className="text-[11px] text-[var(--slate)] block mb-1">Stop Displaying (Auto-Expire)</span>
              <input
                type="datetime-local"
                value={displayEnd}
                onChange={(e) => setDisplayEnd(e.target.value)}
                className="w-full px-3.5 py-2 bg-[var(--canvas)] border border-[var(--hairline)] rounded-lg text-xs text-[var(--ink)] focus:outline-none focus:border-[var(--focus-blue)]"
              />
            </div>
          </div>
        </div>

        {/* Attachment Upload Zone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-[var(--ink)] mb-1.5">
            Slide Poster / Graphic (Optional)
          </label>
          
          {attachmentPreview || (existing?.attachment_url && !attachment) ? (
            <div className="relative p-3 bg-[var(--canvas-stone)]/40 border border-[var(--hairline)] rounded-xl flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentPreview || existing.attachment_url}
                alt="Poster preview"
                className="w-20 h-20 rounded-lg object-cover border border-[var(--hairline)] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[var(--ink)] truncate">
                  {attachment ? attachment.name : 'Current Attachment'}
                </p>
                <p className="text-[11px] text-[var(--mute)]">
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
            <label className="flex flex-col items-center justify-center p-6 border border-dashed border-[var(--hairline)] hover:border-[var(--cohere-near-black)] rounded-xl cursor-pointer transition-colors bg-[var(--canvas-stone)]/20 hover:bg-[var(--canvas-stone)]/40">
              <UploadCloud className="w-6 h-6 text-[var(--mute)] mb-2" />
              <p className="text-xs font-medium text-[var(--ink)]">Click to upload poster or drag and drop</p>
              <p className="text-[10px] text-[var(--mute)] mt-0.5 font-mono">JPEG, PNG, or WebP up to 10MB</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[var(--hairline)]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('approval')}
              className="cohere-btn-primary"
            >
              {submitting === 'approval' ? 'Submitting…' : 'Submit for Approval'}
            </button>
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('draft')}
              className="cohere-btn-secondary"
            >
              {submitting === 'draft' ? 'Saving…' : 'Save Draft'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="cohere-btn-pill-outline flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-[var(--cohere-action-blue)]" /> Billboard Simulator
          </button>
        </div>
      </div>

      {/* Live Mini Billboard Agent Console Card (Right Col) */}
      <div className="space-y-4">
        <div className="agent-console-card p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[var(--hairline)] dark:border-white/10 pb-3">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--ink)] dark:text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Display Output
            </span>
            <span className="text-[10px] font-mono text-[var(--slate)] dark:text-neutral-400">16:9 Aspect</span>
          </div>

          <div className="aspect-[16/9] rounded-xl bg-black border border-white/10 flex flex-col justify-between p-3.5 text-center text-white overflow-hidden relative">
            <div className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 truncate">
              {departments.find((d) => d.id === departmentId)?.name || 'Campus Wide'} &bull; {PRIORITY_LABEL[priority]}
            </div>

            <div className="my-auto">
              {(attachmentPreview || existing?.attachment_url) && (
                <div className="mb-2 max-h-14 flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachmentPreview || existing?.attachment_url}
                    alt="Mini preview"
                    className="max-h-14 object-contain rounded-md"
                  />
                </div>
              )}
              <h4 className="text-xs font-semibold line-clamp-2 px-1 text-white">
                {title.trim() || 'Announcement Title'}
              </h4>
              {body.trim() && (
                <p className="text-[9px] text-neutral-300 line-clamp-2 mt-1 px-2">
                  {body}
                </p>
              )}
            </div>

            <div className="text-[7px] font-mono text-neutral-500 flex justify-between border-t border-white/5 pt-1">
              <span>CampusCast Engine</span>
              <span>{targetAll ? 'All Screens' : `${targetZones.length} Target Zones`}</span>
            </div>
          </div>

          <p className="text-[11px] text-[var(--slate)] dark:text-neutral-400 mt-4 leading-relaxed">
            Content is vetted against automated safety policies before transmission to department HODs and admin consoles.
          </p>
        </div>
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
