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
    if (file.size > 10 * 1024 * 1024) {
      setError('Attachment must be smaller than 10MB.')
      return
    }
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

  const handleSubmit = async (action: 'draft' | 'approval') => {
    setError(null)
    if (!title.trim()) {
      setError('Please provide a title for the announcement.')
      return
    }
    if (displayStart && displayEnd && new Date(displayStart) >= new Date(displayEnd)) {
      setError('The display start date must be before the end date.')
      return
    }

    setSubmitting(action)
    try {
      let uploadedUrl = existing?.attachment_url || null

      if (attachment) {
        const ext = attachment.name.split('.').pop() || 'jpg'
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
        const { error: uploadErr } = await supabase.storage
          .from('announcement-attachments')
          .upload(path, attachment, { contentType: attachment.type, upsert: true })

        if (uploadErr) throw uploadErr

        const { data: { publicUrl } } = supabase.storage
          .from('announcement-attachments')
          .getPublicUrl(path)

        uploadedUrl = publicUrl
      }

      const payload = {
        title: title.trim(),
        body: body.trim() || null,
        department_id: departmentId || null,
        priority,
        target_all: targetAll,
        target_zones: targetAll ? [] : targetZones,
        display_start: displayStart ? new Date(displayStart).toISOString() : null,
        display_end: displayEnd ? new Date(displayEnd).toISOString() : null,
        attachment_url: uploadedUrl,
        submitted_by: userId,
        status: action === 'approval' ? 'pending_hod' : 'draft',
      }

      if (existing?.id) {
        const { error: updateErr } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', existing.id)
        if (updateErr) throw updateErr
      } else {
        const { error: insertErr } = await supabase
          .from('announcements')
          .insert(payload)
        if (insertErr) throw insertErr
      }

      router.push('/dashboard/submitter')
      router.refresh()
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Failed to submit announcement.')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-white">
      {/* Form Fields (Left 2 Cols) */}
      <div className="lg:col-span-2 bg-[#141414] border border-[#212327] rounded-lg p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg text-xs font-mono">
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf]">
              Announcement Title <span className="text-rose-400">*</span>
            </label>
            <span className="font-mono text-[11px] text-[#7d8187]">
              {title.length}/100
            </span>
          </div>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Tech Symposium Registrations Open"
            className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf]">
              Message Details
            </label>
            <span className="font-mono text-[11px] text-[#7d8187]">
              {body.length}/500
            </span>
          </div>
          <textarea
            value={body}
            maxLength={500}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Provide key details, dates, venue, or eligibility requirements..."
            className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-white transition-colors leading-relaxed"
          />
        </div>

        {/* Department & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf] mb-1.5">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3.5 py-2 text-xs text-white focus:outline-none focus:border-white transition-colors"
            >
              <option value="">General / Campus-Wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf] mb-1.5">
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
                    className={`py-2 px-2 rounded-full text-[10px] font-mono uppercase tracking-wider border transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'border-white bg-white text-[#0a0a0a] font-medium'
                        : 'border-[#212327] bg-[#0a0a0a] text-[#7d8187] hover:border-white/20'
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
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf]">
              Target Display Locations
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllZones}
                className="text-[11px] font-mono text-white hover:underline cursor-pointer"
              >
                Select All
              </button>
              <span className="text-[#212327]">&bull;</span>
              <button
                type="button"
                onClick={clearAllZones}
                className="text-[11px] font-mono text-[#7d8187] hover:underline cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label
              className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border cursor-pointer transition-all ${
                targetAll
                  ? 'bg-white text-[#0a0a0a] border-white font-medium'
                  : 'border-[#212327] bg-[#0a0a0a] text-[#7d8187] hover:border-white/30'
              }`}
            >
              <input type="checkbox" className="hidden" checked={targetAll} onChange={(e) => setTargetAll(e.target.checked)} />
              All Campus Screens
            </label>
            {zones.map((zone) => (
              <label
                key={zone}
                className={`px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider border cursor-pointer transition-all ${
                  targetAll ? 'opacity-40 pointer-events-none' : ''
                } ${
                  targetZones.includes(zone)
                    ? 'bg-white text-[#0a0a0a] border-white font-medium'
                    : 'border-[#212327] bg-[#0a0a0a] text-[#7d8187] hover:border-white/30'
                }`}
              >
                <input type="checkbox" className="hidden" checked={targetZones.includes(zone)} onChange={() => toggleZone(zone)} />
                {zone}
              </label>
            ))}
          </div>
        </div>

        {/* Display Duration */}
        <div>
          <div className="flex flex-wrap justify-between items-center gap-2 mb-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf]">
              Broadcast Schedule
            </label>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-mono uppercase text-[#7d8187]">Presets:</span>
              <button
                type="button"
                onClick={() => applyWindowPreset(24)}
                className="px-2.5 py-0.5 rounded-full border border-[#212327] text-[10px] font-mono text-[#dadbdf] hover:bg-white/5 cursor-pointer"
              >
                24h
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(72)}
                className="px-2.5 py-0.5 rounded-full border border-[#212327] text-[10px] font-mono text-[#dadbdf] hover:bg-white/5 cursor-pointer"
              >
                3d
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(168)}
                className="px-2.5 py-0.5 rounded-full border border-[#212327] text-[10px] font-mono text-[#dadbdf] hover:bg-white/5 cursor-pointer"
              >
                7d
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[11px] text-[#7d8187] font-mono block mb-1">Start Date &amp; Time</span>
              <input
                type="datetime-local"
                value={displayStart}
                onChange={(e) => setDisplayStart(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <span className="text-[11px] text-[#7d8187] font-mono block mb-1">End Date (Auto Expire)</span>
              <input
                type="datetime-local"
                value={displayEnd}
                onChange={(e) => setDisplayEnd(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#212327] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Attachment Upload Zone */}
        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#dadbdf] mb-1.5">
            Slide Poster (Optional)
          </label>
          
          {attachmentPreview || (existing?.attachment_url && !attachment) ? (
            <div className="relative p-3 bg-[#0a0a0a] border border-[#212327] rounded-lg flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentPreview || existing.attachment_url}
                alt="Poster preview"
                className="w-20 h-20 rounded-md object-cover border border-[#212327] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-normal text-white truncate">
                  {attachment ? attachment.name : 'Current Attachment'}
                </p>
                <p className="text-[11px] text-[#7d8187] font-mono">
                  {attachment ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Stored visual'}
                </p>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="mt-1 text-xs text-rose-400 hover:underline font-mono cursor-pointer"
                >
                  Remove visual
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-6 border border-dashed border-[#212327] hover:border-white/40 rounded-lg cursor-pointer transition-colors bg-[#0a0a0a]">
              <UploadCloud className="w-5 h-5 text-[#7d8187] mb-2" />
              <p className="text-xs text-white">Click or drag image to upload poster</p>
              <p className="text-[10px] text-[#7d8187] mt-0.5 font-mono">JPEG, PNG, or WebP up to 10MB</p>
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
        <div className="flex flex-wrap items-center justify-between gap-3 pt-6 border-t border-[#212327]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('approval')}
              className="px-5 py-2.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting === 'approval' ? 'Submitting…' : 'Submit for Approval'}
            </button>
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('draft')}
              className="px-5 py-2.5 rounded-full border border-white/20 text-white text-xs hover:bg-white/5 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting === 'draft' ? 'Saving…' : 'Save Draft'}
            </button>
          </div>

          <button
            type="button"
            onClick={() => setPreviewOpen(true)}
            className="px-4 py-2 rounded-full border border-white/20 text-white text-xs hover:bg-white/5 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-white" /> Screen Simulator
          </button>
        </div>
      </div>

      {/* Live Mini Screen Preview (Right Col) */}
      <div className="space-y-4">
        <div className="bg-[#141414] border border-[#212327] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#212327] pb-3">
            <span className="text-xs font-mono uppercase tracking-wider text-white flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Display Output
            </span>
            <span className="text-[10px] font-mono text-[#7d8187]">16:9 Aspect</span>
          </div>

          <div className="aspect-[16/9] rounded-lg bg-black border border-[#212327] flex flex-col justify-between p-3.5 text-center text-white overflow-hidden relative shadow-inner">
            <div className="text-[8px] font-mono uppercase tracking-widest text-[#7d8187] truncate">
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
              <h4 className="text-xs font-normal line-clamp-2 px-1 text-white">
                {title.trim() || 'Announcement Title'}
              </h4>
              {body.trim() && (
                <p className="text-[9px] text-[#dadbdf] line-clamp-2 mt-1 px-2 font-normal">
                  {body}
                </p>
              )}
            </div>

            <div className="text-[7px] font-mono text-[#7d8187] flex justify-between border-t border-white/10 pt-1">
              <span>CampusCast Engine</span>
              <span>{targetAll ? 'All Screens' : `${targetZones.length} Target Zones`}</span>
            </div>
          </div>

          <p className="text-[11px] text-[#7d8187] mt-4 leading-relaxed font-mono">
            Submissions are verified by policy heuristics before routing to department heads.
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
