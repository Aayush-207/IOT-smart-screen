'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { UploadCloud, Eye, Monitor, Smartphone, Building2, Clock, Sparkles, AlertCircle } from 'lucide-react'
import { PRIORITY_LABEL, type Priority } from '@/lib/priority'

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
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')

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
    setTargetAll(false)
    setTargetZones((prev) => (prev.includes(zone) ? prev.filter((z) => z !== zone) : [...prev, zone]))
  }

  const targetScreens = React.useMemo(() => {
    return zones.map((zone) => {
      const zLower = zone.toLowerCase()
      const isOnline =
        zLower.includes('engineering') ||
        zLower.includes('lobby') ||
        zLower.includes('screen 01') ||
        zone === 'Main Lobby Screen 01'

      let label = zone
      if (zLower.includes('engineering') || zLower.includes('lobby') || zLower.includes('screen 01')) {
        label = 'Main Lobby Screen 01 (Engineering Wing)'
      } else if (zLower.includes('library')) {
        label = 'Library Entrance Node (Library Atrium)'
      } else if (zLower.includes('cafeteria') || zLower.includes('student')) {
        label = 'Cafeteria Kiosk Display (Student Cafeteria)'
      }

      return {
        value: zone,
        label,
        isOnline,
      }
    })
  }, [zones])

  const selectAllZones = () => {
    setTargetAll(false)
    setTargetZones(targetScreens.map((s) => s.value))
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
      setError('Select at least one target screen (e.g. Main Lobby Screen 01).')
      return
    }
    const effectiveStart = displayStart || new Date().toISOString()
    const effectiveEnd = displayEnd || new Date(Date.now() + 72 * 3600 * 1000).toISOString()
    if (mode === 'approval' && new Date(effectiveEnd).getTime() <= new Date(effectiveStart).getTime()) {
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

      const normalizedTargetZones = targetAll
        ? []
        : Array.from(
            new Set(
              targetZones.flatMap((z) => {
                const zLower = z.toLowerCase()
                if (zLower.includes('engineering') || zLower.includes('lobby') || zLower.includes('screen 01')) {
                  return ['Engineering Wing', 'Main Lobby Screen 01']
                }
                if (zLower.includes('library')) {
                  return ['Library Atrium', 'Library Entrance Node']
                }
                if (zLower.includes('cafeteria') || zLower.includes('student')) {
                  return ['Student Cafeteria', 'Cafeteria Kiosk Display']
                }
                return [z]
              })
            )
          )

      const payload = {
        title: title.trim(),
        body: body.trim(),
        department_id: departmentId || null,
        priority,
        target_all: targetAll,
        target_zones: normalizedTargetZones,
        attachment_url: attachmentUrl,
        display_start: effectiveStart ? new Date(effectiveStart).toISOString() : null,
        display_end: effectiveEnd ? new Date(effectiveEnd).toISOString() : null,
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
    <div className="flex flex-col xl:flex-row gap-8 max-w-[1400px] w-full mx-auto animate-fade-in items-start relative font-[family-name:var(--font-inter)]">
      {/* Live Mini Billboard Agent Console Card (Right Col) */}
      <div className="w-full xl:w-[420px] shrink-0 space-y-6 order-1 xl:order-2 xl:sticky xl:top-24">
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50">
            <span className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-[0_0_0_2px_rgba(16,185,129,0.2)] animate-pulse" /> 
              LIVE PREVIEW
            </span>
            <div className="relative flex bg-slate-200/60 p-1 rounded-xl">
              {/* Sliding pill indicator */}
              <div
                className={`absolute inset-y-1 rounded-lg bg-white shadow-xs transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  orientation === 'landscape'
                    ? 'left-1 w-[calc(50%-4px)]'
                    : 'left-[calc(50%+2px)] w-[calc(50%-4px)]'
                }`}
              />
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors duration-200 cursor-pointer ${
                  orientation === 'landscape'
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors duration-200 cursor-pointer ${
                  orientation === 'portrait'
                    ? 'text-slate-900'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 flex flex-col items-center justify-center bg-slate-100">
            <div className={`@container bg-slate-900 rounded-xl flex flex-col justify-between p-[2cqw] text-center text-white overflow-hidden relative shadow-xl border-4 border-slate-800 shrink-0 transition-[width,height,max-width,max-height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              orientation === 'landscape'
                ? 'w-full max-w-[370px] h-[208px]'
                : 'w-[195px] h-[346px]'
            }`}>
              {attachmentPreview || existing?.attachment_url ? (
                <img
                  src={attachmentPreview || existing?.attachment_url}
                  alt="Mini preview"
                  className="absolute inset-0 w-full h-full object-cover rounded-md"
                />
              ) : (
                <>
                  <div className="text-[2cqw] font-semibold bg-white/10 backdrop-blur-md text-white px-[2cqw] py-[1cqw] rounded-full uppercase tracking-wider truncate relative z-10 mx-auto border border-white/20">
                    {departments.find((d) => d.id === departmentId)?.name || 'Campus Wide'} &bull; {PRIORITY_LABEL[priority]}
                  </div>

                  <div className="my-auto relative z-10 bg-slate-900/60 backdrop-blur-md rounded-xl m-[1cqw] p-[3cqw] border border-white/10 shadow-lg">
                    <h4 className="text-[4cqw] leading-tight font-bold text-white line-clamp-2">
                      {title.trim() || 'Announcement Title'}
                    </h4>
                    {body.trim() && (
                      <p className="text-[2.5cqw] font-medium text-slate-300 line-clamp-2 mt-[1.5cqw] leading-relaxed">
                        {body}
                      </p>
                    )}
                  </div>

                  <div className="text-[2cqw] font-semibold text-slate-400 bg-slate-950/80 rounded-lg px-[2cqw] py-[1cqw] flex justify-between items-center relative z-10 border border-slate-800">
                    <span>CC ENGINE</span>
                    <span className="flex items-center gap-[1cqw]">
                      <span className="w-[1.5cqw] h-[1.5cqw] rounded-full bg-emerald-500" />
                      {targetZones.length} ZONES
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Live Configuration Details */}
          <div className="p-6 border-t border-slate-200 bg-white space-y-4">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Dispatch Manifest
            </div>

            <div className="grid grid-cols-1 gap-3 text-xs">
              {/* Department */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Building2 className="w-4 h-4" />
                  <span>Dept</span>
                </div>
                <span className="font-bold text-slate-900 truncate max-w-[150px]">
                  {departments.find((d) => d.id === departmentId)?.name || 'Campus Wide'}
                </span>
              </div>

              {/* Screens Selected */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Monitor className="w-4 h-4" />
                  <span>Nodes</span>
                </div>
                <span className="font-bold text-right">
                  {targetZones.length > 0 ? (
                    <span className="text-[#0a0a0a] bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                      {targetZones.length} Selected
                    </span>
                  ) : (
                    <span className="text-rose-600 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-100">0 Selected</span>
                  )}
                </span>
              </div>

              {/* Duration / Schedule */}
              <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-200">
                <div className="flex items-center gap-2 text-slate-500 font-semibold">
                  <Clock className="w-4 h-4" />
                  <span>Time</span>
                </div>
                <span className="font-bold text-slate-900 text-right text-[10px]">
                  {displayStart ? (
                    <span>
                      {displayStart.replace('T', ' ')} <br/> {displayEnd ? `UNTIL ${displayEnd.replace('T', ' ')}` : '(PERMANENT)'}
                    </span>
                  ) : (
                    <span className="text-slate-500">IMMEDIATE</span>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs font-medium text-slate-500 leading-relaxed bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center">
          Content is vetted against automated safety policies before transmission to department HODs and admin consoles.
        </p>
      </div>
      {/* Main Form (Left 2 cols) */}
      <div className="flex-1 min-w-0 w-full p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-8 order-2 xl:order-1">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Compose Announcement</h2>
          <p className="text-sm text-slate-500 mt-1">Fill in the details for your campus broadcast.</p>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Title Input */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-900">
              Title <span className="text-rose-600">*</span>
            </label>
            <span className="text-xs font-medium text-slate-500">
              {title.length}/100
            </span>
          </div>
          <input
            type="text"
            value={title}
            maxLength={100}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Tech Fest Registrations Open"
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
          />
        </div>

        {/* Body Textarea */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-semibold text-slate-900">
              Message Content
            </label>
            <span className="text-xs font-medium text-slate-500">
              {body.length}/500
            </span>
          </div>
          <textarea
            value={body}
            maxLength={500}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="Describe the details, dates, venue, or eligibility requirements..."
            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 font-medium placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
          />
        </div>

        {/* Department & Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Department
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 cursor-pointer transition-all shadow-sm"
            >
              <option value="">General / Campus-Wide</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Priority Tier
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SUBMITTER_PRIORITIES.map((p) => {
                const isSelected = priority === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all cursor-pointer truncate shadow-sm ${
                      isSelected
                        ? p === 'critical'
                          ? 'border-rose-600 bg-rose-600 text-white shadow-md'
                          : 'border-[#121826] bg-[#121826] text-white shadow-md'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50'
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
        <div className="pt-4">
          <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
            <label className="block text-sm font-semibold text-slate-900">
              Target Screens &amp; Zones
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={selectAllZones}
                className="text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllZones}
                className="text-xs font-semibold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {targetScreens.map((screen) => {
              const isSelected = targetZones.includes(screen.value)
              return (
                <label
                  key={screen.value}
                  className={`inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium border cursor-pointer transition-all shadow-sm ${
                    !screen.isOnline
                      ? isSelected
                        ? 'bg-[#121826] text-white border-[#121826]'
                        : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                      : isSelected
                      ? 'bg-[#121826] text-white border-[#121826]'
                      : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={isSelected}
                    onChange={() => toggleZone(screen.value)}
                  />
                  {screen.isOnline ? (
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isSelected ? 'bg-white shadow-[0_0_0_2px_rgba(255,255,255,0.2)]' : 'bg-emerald-500'}`} />
                  ) : (
                    <span className="w-2.5 h-2.5 bg-slate-300 rounded-full shrink-0" />
                  )}
                  <span>{screen.label}</span>
                </label>
              )
            })}
          </div>
        </div>

        {/* Display Window & Presets */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
            <label className="block text-sm font-semibold text-slate-900">
              Display Duration
            </label>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 px-2">Presets</span>
              <button
                type="button"
                onClick={() => applyWindowPreset(24)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all shadow-sm"
              >
                24H
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(72)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all shadow-sm"
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => applyWindowPreset(168)}
                className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-900 cursor-pointer transition-all shadow-sm"
              >
                7D
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Start Displaying</span>
              <input
                type="datetime-local"
                value={displayStart}
                onChange={(e) => setDisplayStart(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 block mb-2">Stop Displaying (Auto-Expire)</span>
              <input
                type="datetime-local"
                value={displayEnd}
                onChange={(e) => setDisplayEnd(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
              />
            </div>
          </div>
        </div>

        {/* Attachment Upload Zone */}
        <div className="pt-4 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
            <label className="block text-sm font-semibold text-slate-900">
              Slide Poster / Graphic (Optional)
            </label>
            <span className="text-xs font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
              1672 &times; 941 PX (16:9)
            </span>
          </div>

          {/* Required Dimension Callout */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-6 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-1">
              <Sparkles className="w-4 h-4 text-slate-700" />
              <span>Required Poster Dimensions</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">
              WIDTH: <strong>1672 PX</strong> &bull; HEIGHT: <strong>941 PX</strong>
            </p>
            <p className="text-xs font-medium text-slate-500 mt-1 max-w-xl">
              The uploaded poster should be in that exact dimension to fit the display screens perfectly without distortion or black bars.
            </p>
          </div>
          
          {attachmentPreview || (existing?.attachment_url && !attachment) ? (
            <div className="relative p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-5 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={attachmentPreview || existing.attachment_url}
                alt="Poster preview"
                className="w-32 h-20 object-cover rounded-xl shadow-sm border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-900 truncate">
                  {attachment ? attachment.name : 'Current Attachment'}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {attachment ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB` : 'Stored image'} &bull; 16:9 Ratio
                </p>
                <button
                  type="button"
                  onClick={removeAttachment}
                  className="mt-2 text-rose-600 hover:text-rose-700 text-xs font-bold hover:underline cursor-pointer transition-colors"
                >
                  Remove visual
                </button>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 hover:bg-slate-100 hover:border-slate-300 cursor-pointer transition-all group shadow-sm">
              <div className="w-14 h-14 bg-white rounded-2xl border border-slate-200 flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 group-hover:shadow-md transition-all">
                <UploadCloud className="w-6 h-6 text-slate-700" />
              </div>
              <p className="text-sm font-bold text-slate-900 text-center">Click to upload poster or drag and drop</p>
              <p className="text-xs text-slate-500 mt-2 font-medium">JPEG, PNG, WEBP (Max 10MB)</p>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('approval')}
              className="px-6 py-3.5 bg-[#121826] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg hover:bg-[#121826]/90 hover:-translate-y-0.5 active:translate-y-0 transition-all flex-1 sm:flex-none justify-center inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting === 'approval' ? (
                <span>Submitting...</span>
              ) : (
                <span>Submit for Approval</span>
              )}
            </button>
            <button
              type="button"
              disabled={!!submitting}
              onClick={() => handleSubmit('draft')}
              className="px-6 py-3.5 bg-white text-slate-900 border border-slate-300 rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all flex-1 sm:flex-none justify-center inline-flex items-center gap-2 cursor-pointer disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {submitting === 'draft' ? (
                <span>Saving...</span>
              ) : (
                <span>Save Draft</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
