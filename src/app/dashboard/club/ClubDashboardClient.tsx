'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, AlertCircle, CheckCircle, Clock, Plus, Tv, Calendar, Edit2, CheckSquare } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function ClubDashboardClient({ 
  initialScreens, 
  initialScreenRequests,
  clubId 
}: { 
  initialScreens: any[], 
  initialScreenRequests: any[],
  clubId: string 
}) {
  const [screens, setScreens] = useState(initialScreens)
  const activeRequests = initialScreenRequests.filter(r => r.status !== 'rejected')
  const [screenRequests, setScreenRequests] = useState(activeRequests)
  const [uploadingFor, setUploadingFor] = useState<string | null>(null)
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'hardware' | 'schedule'>('hardware')

  // Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [newScreenName, setNewScreenName] = useState('')
  const [newScreenLocation, setNewScreenLocation] = useState('')
  const [requesting, setRequesting] = useState(false)

  // Event Modal state
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventName, setEventName] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventPoster, setEventPoster] = useState<File | null>(null)
  const [eventStartDate, setEventStartDate] = useState('')
  const [eventStartTime, setEventStartTime] = useState('')
  const [eventEndDate, setEventEndDate] = useState('')
  const [eventEndTime, setEventEndTime] = useState('')
  const [selectedScreens, setSelectedScreens] = useState<string[]>([])
  const [creatingEvent, setCreatingEvent] = useState(false)

  // Schedule Modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [activeScreenForSchedule, setActiveScreenForSchedule] = useState<string | null>(null)
  const [scheduleFile, setScheduleFile] = useState<File | null>(null)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [scheduleDuration, setScheduleDuration] = useState('7')
  const [scheduling, setScheduling] = useState(false)
  const [editingReqId, setEditingReqId] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeScreenForSchedule || !scheduleDate || !scheduleTime || !scheduleDuration) return

    setScheduling(true)
    try {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString()

      if (editingReqId && !scheduleFile) {
        // Update schedule only
        const { error: dbError } = await supabase
          .from('poster_requests')
          .update({
            scheduled_time: scheduledDateTime,
            duration_days: parseInt(scheduleDuration)
          })
          .eq('id', editingReqId)

        if (dbError) throw dbError
      } else {
        // Upload new file and insert/update
        if (!scheduleFile) throw new Error('No file selected')
        
        const fileExt = scheduleFile.name.split('.').pop()
        const fileName = `${Math.random()}.${fileExt}`
        const filePath = `${clubId}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('posters')
          .upload(filePath, scheduleFile)

        if (uploadError) throw uploadError

        const { data: { publicUrl } } = supabase.storage
          .from('posters')
          .getPublicUrl(filePath)

        if (editingReqId) {
          const { error: dbError } = await supabase
            .from('poster_requests')
            .update({
              image_url: publicUrl,
              scheduled_time: scheduledDateTime,
              duration_days: parseInt(scheduleDuration)
            })
            .eq('id', editingReqId)
          if (dbError) throw dbError
        } else {
          const { error: dbError } = await supabase
            .from('poster_requests')
            .insert({
              screen_id: activeScreenForSchedule,
              club_id: clubId,
              image_url: publicUrl,
              status: 'pending',
              scheduled_time: scheduledDateTime,
              duration_days: parseInt(scheduleDuration)
            })
          if (dbError) throw dbError
        }
      }

      setScheduleModalOpen(false)
      setScheduleFile(null)
      router.refresh()
      window.location.reload()
    } catch (error) {
      alert('Error scheduling poster!')
      console.error(error)
    } finally {
      setScheduling(false)
    }
  }

  const openScheduleModal = (screenId: string, req?: any) => {
    setActiveScreenForSchedule(screenId)
    if (req) {
      setEditingReqId(req.id)
      if (req.scheduled_time) {
        const d = new Date(req.scheduled_time)
        // Correct for timezone offset when formatting YYYY-MM-DD
        const offset = d.getTimezoneOffset()
        const dLocal = new Date(d.getTime() - (offset*60*1000))
        setScheduleDate(dLocal.toISOString().split('T')[0])
        setScheduleTime(d.toTimeString().split(' ')[0].substring(0,5))
      } else {
        const d = new Date()
        const offset = d.getTimezoneOffset()
        const dLocal = new Date(d.getTime() - (offset*60*1000))
        setScheduleDate(dLocal.toISOString().split('T')[0])
        setScheduleTime(d.toTimeString().split(' ')[0].substring(0,5))
      }
      setScheduleDuration(req.duration_days?.toString() || '7')
    } else {
      setEditingReqId(null)
      const d = new Date()
      const offset = d.getTimezoneOffset()
      const dLocal = new Date(d.getTime() - (offset*60*1000))
      setScheduleDate(dLocal.toISOString().split('T')[0])
      setScheduleTime(d.toTimeString().split(' ')[0].substring(0,5))
      setScheduleDuration('7')
    }
    setScheduleFile(null)
    setScheduleModalOpen(true)
  }

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventName || !eventPoster || selectedScreens.length === 0 || !eventStartDate || !eventStartTime || !eventEndDate || !eventEndTime) return
    
    setCreatingEvent(true)
    try {
      const startDT = new Date(`${eventStartDate}T${eventStartTime}`).toISOString()
      const endDT = new Date(`${eventEndDate}T${eventEndTime}`).toISOString()

      const fileExt = eventPoster.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${clubId}/${fileName}`

      const { error: uploadError } = await supabase.storage.from('posters').upload(filePath, eventPoster)
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('posters').getPublicUrl(filePath)

      const requestsToInsert = selectedScreens.map(screenId => ({
        screen_id: screenId,
        club_id: clubId,
        image_url: publicUrl,
        status: 'pending',
        scheduled_time: startDT,
        end_time: endDT,
        event_name: eventName,
        description: eventDescription
      }))

      const { error: dbError } = await supabase.from('poster_requests').insert(requestsToInsert)
      if (dbError) throw dbError

      setEventModalOpen(false)
      setActiveTab('schedule')
      router.refresh()
      window.location.reload()
    } catch (error) {
      console.error(error)
      alert("Failed to create event")
    } finally {
      setCreatingEvent(false)
    }
  }

  const handleRequestScreen = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newScreenName || !newScreenLocation) return
    setRequesting(true)
    try {
      const { data, error } = await supabase.from('screen_requests').insert({
        club_id: clubId,
        name: newScreenName,
        location: newScreenLocation,
        status: 'pending'
      }).select().single()

      if (error) throw error
      
      setScreenRequests([data, ...screenRequests])
      setRequestModalOpen(false)
      setNewScreenName('')
      setNewScreenLocation('')
      router.refresh()
    } catch(err) {
      alert("Failed to request screen")
      console.error(err)
    } finally {
      setRequesting(false)
    }
  }

  const totalUsed = screens.length + screenRequests.length
  const placeholderCount = Math.max(0, 3 - totalUsed)
  const placeholders = Array.from({ length: placeholderCount })

  const allSlots = [
    ...screens.map(s => ({ type: 'active', data: s, id: s.id })),
    ...screenRequests.map(r => ({ type: 'pending', data: r, id: r.id })),
    ...placeholders.map((_, i) => ({ type: 'unrequested', id: `placeholder-${i}` }))
  ]

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-[var(--ink)]">Club Dashboard</h2>
          <p className="text-[var(--mute)]">Manage your hardware and poster schedules.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setEventModalOpen(true)}
            className="bg-[#0070f3] text-white px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" /> Create an Event
          </button>
          <button 
            onClick={() => setRequestModalOpen(true)}
            className="bg-[var(--ink)] text-[var(--canvas)] px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Request Screen
          </button>
        </div>
      </div>

      <div className="flex gap-6 border-b border-[var(--hairline)] mb-6">
        <button 
          onClick={() => setActiveTab('hardware')}
          className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'hardware' ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}
        >
          Active Hardware
          {activeTab === 'hardware' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ink)] rounded-t-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`pb-3 font-medium text-sm transition-colors relative ${activeTab === 'schedule' ? 'text-[var(--ink)]' : 'text-[var(--mute)] hover:text-[var(--ink)]'}`}
        >
          Schedule
          {activeTab === 'schedule' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--ink)] rounded-t-full" />}
        </button>
      </div>

      {activeTab === 'hardware' && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {allSlots.map((slot) => {
          const isBlurred = slot.type !== 'active'
          const name = slot.type === 'active' || slot.type === 'pending' ? slot.data.name : "Available Screen Slot"
          const location = slot.type === 'active' || slot.type === 'pending' ? slot.data.location : "Unallocated"
          const req = slot.type === 'active' ? slot.data.latestRequest : null
          
          let isLive = false
          if (req && req.status === 'approved' && req.scheduled_time && req.duration_days) {
            const start = new Date(req.scheduled_time)
            const end = new Date(start.getTime() + req.duration_days * 24 * 60 * 60 * 1000)
            const now = new Date()
            isLive = now >= start && now <= end
          }

          return (
            <div key={slot.id} className="relative group h-full">
              
              {/* LOCK OVERLAY FOR PENDING/UNREQUESTED */}
              {isBlurred && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--canvas)]/30 backdrop-blur-[4px] rounded-xl transition-all group-hover:backdrop-blur-[2px]">
                  {slot.type === 'unrequested' ? (
                     <button 
                        onClick={() => setRequestModalOpen(true)}
                        className="px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 transition-all whisper-shadow shadow-xl transform group-hover:scale-105"
                     >
                        <Plus className="w-4 h-4" />
                        Request This Screen
                     </button>
                  ) : (
                     <div className={`px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 text-white shadow-xl ${slot.data?.status === 'changes_requested' ? 'bg-blue-500 shadow-blue-500/20' : 'bg-amber-500 shadow-amber-500/20'}`}>
                        {slot.data?.status === 'changes_requested' ? <AlertCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                        {slot.data?.status === 'changes_requested' ? 'Changes Requested' : 'Waiting for Approval'}
                     </div>
                  )}
                </div>
              )}

              {/* BASE CARD */}
              <div className={`geist-card p-6 flex flex-col justify-between whisper-shadow h-full transition-all ${isBlurred ? 'opacity-70 blur-[3px] pointer-events-none select-none grayscale-[50%]' : ''}`}>
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-[var(--ink)]">{name}</h3>
                    <span className="text-xs bg-[var(--canvas-inset)] px-2 py-1 rounded border border-[var(--hairline)]">
                      {location}
                    </span>
                  </div>
                  
                  {/* Status UI */}
                  <div className="mb-6">
                    {!req ? (
                      <div className="p-4 bg-[var(--canvas-inset)] border border-dashed border-[var(--hairline)] rounded-lg text-center text-sm text-[var(--mute)]">
                        No active poster request.
                      </div>
                    ) : req.status === 'pending' ? (
                      <div className="p-4 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-4 text-center">
                          <Clock className="w-6 h-6 text-amber-400 mb-2" />
                          <p className="text-sm font-semibold text-white shadow-sm">Waiting for HOD approval</p>
                        </div>
                        <img src={req.image_url} alt="Pending Poster" className="w-full h-32 object-cover rounded-md opacity-60" />
                      </div>
                    ) : req.status === 'changes_requested' ? (
                      <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-600 dark:text-blue-500">Changes Requested</p>
                          <p className="text-xs text-blue-600/80 dark:text-blue-500/80 mt-1">Feedback: {req.rejection_reason}</p>
                        </div>
                      </div>
                    ) : req.status === 'rejected' ? (
                      <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg flex gap-3 items-start">
                        <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-rose-600 dark:text-rose-500">Request Rejected</p>
                          <p className="text-xs text-rose-600/80 dark:text-rose-500/80 mt-1">Reason: {req.rejection_reason}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle className={`w-4 h-4 ${isLive ? 'text-emerald-500' : 'text-blue-500'}`} />
                          <p className={`text-sm font-medium ${isLive ? 'text-emerald-600 dark:text-emerald-500' : 'text-blue-600 dark:text-blue-500'}`}>
                            {isLive ? 'Live on Screen' : 'Scheduled'}
                          </p>
                        </div>
                        <img src={req.image_url} alt="Current Poster" className="rounded-md border border-[var(--hairline)] w-full h-32 object-cover" />
                        {req.scheduled_time && (
                          <div className="text-[11px] text-[var(--mute)] mt-3 bg-[var(--canvas-elevated)] p-2 rounded text-center">
                            <strong>Starts:</strong> {new Date(req.scheduled_time).toLocaleString()} <br/>
                            <strong>Duration:</strong> {req.duration_days} Days
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => openScheduleModal(slot.data.id)}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${slot.type === 'active' && scheduling ? 'bg-[var(--mute)] text-white cursor-not-allowed' : 'bg-[var(--ink)] text-[var(--canvas)] whisper-shadow'} ${slot.type === 'active' ? 'cursor-pointer hover:opacity-90' : ''}`}
                    disabled={slot.type !== 'active'}
                  >
                    <Calendar className="w-4 h-4" />
                    Schedule New
                  </button>
                  {slot.type === 'active' && req && (
                     <button
                       onClick={() => openScheduleModal(slot.data.id, req)}
                       className="py-2.5 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all bg-[var(--canvas-inset)] border border-[var(--hairline)] hover:border-[#0070f3] hover:text-[#0070f3]"
                     >
                       <Edit2 className="w-4 h-4" />
                     </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
      )}

      {activeTab === 'schedule' && (
        <div className="space-y-4">
          {screenRequests.length === 0 && (
            <div className="p-12 text-center border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas-inset)] text-[var(--mute)]">
              <Calendar className="w-8 h-8 mx-auto mb-3 opacity-50" />
              <p>No events or posters scheduled yet.</p>
            </div>
          )}
          {screenRequests.map(req => {
            const screen = screens.find(s => s.id === req.screen_id)
            const isLive = req.status === 'approved' && req.scheduled_time && (
              req.end_time ? (new Date() >= new Date(req.scheduled_time) && new Date() <= new Date(req.end_time))
              : (req.duration_days && new Date() >= new Date(req.scheduled_time) && new Date() <= new Date(new Date(req.scheduled_time).getTime() + req.duration_days * 24 * 60 * 60 * 1000))
            )
            return (
              <div key={req.id} className="geist-card p-4 whisper-shadow border-[var(--hairline)] flex gap-4 items-center">
                <img src={req.image_url} alt="Poster" className="w-24 h-32 object-cover rounded-md border border-[var(--hairline)]" />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--ink)]">{req.event_name || req.screens?.name || 'Scheduled Poster'}</h3>
                      <p className="text-sm text-[var(--mute)]">Screen: {screen ? screen.name : 'Unknown'}</p>
                    </div>
                    {req.status === 'pending' && <span className="text-xs bg-yellow-500/10 text-yellow-600 px-2 py-1 rounded border border-yellow-500/20">Pending Approval</span>}
                    {req.status === 'approved' && isLive && <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-1 rounded border border-emerald-500/20">Live</span>}
                    {req.status === 'approved' && !isLive && <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-1 rounded border border-blue-500/20">Approved (Upcoming)</span>}
                  </div>
                  {req.description && <p className="text-sm text-[var(--mute)] mt-2">{req.description}</p>}
                  {req.scheduled_time && (
                    <div className="mt-3 text-xs bg-[var(--canvas-inset)] p-2 rounded text-[var(--mute)] inline-block">
                      <strong>Start:</strong> {new Date(req.scheduled_time).toLocaleString()} &nbsp;|&nbsp; 
                      <strong>End:</strong> {req.end_time ? new Date(req.end_time).toLocaleString() : (req.duration_days ? `${req.duration_days} Days` : 'N/A')}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Request Screen Modal */}
      {requestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">Request New Screen</h3>
            <p className="text-sm text-[var(--mute)] mb-4">Request a new digital signage display from your HOD.</p>
            
            <form onSubmit={handleRequestScreen}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">Screen Name</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] outline-none transition-all"
                    placeholder="e.g. Lab 2 Display"
                    value={newScreenName}
                    onChange={e => setNewScreenName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">Location</label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] outline-none transition-all"
                    placeholder="e.g. Floor 2, Corridor A"
                    value={newScreenLocation}
                    onChange={e => setNewScreenLocation(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setRequestModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--mute)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={requesting}
                  className="px-4 py-2 bg-[var(--ink)] text-[var(--canvas)] hover:opacity-90 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50"
                >
                  {requesting ? 'Requesting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Poster Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">{editingReqId ? 'Edit Schedule' : 'Schedule Poster'}</h3>
            <p className="text-sm text-[var(--mute)] mb-4">Set exactly when and how long your poster should be live.</p>
            
            <form onSubmit={handleScheduleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">Poster Image {editingReqId && '(Leave blank to keep current)'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setScheduleFile(e.target.files?.[0] || null)}
                    required={!editingReqId}
                    className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none transition-all"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={scheduleDate}
                      onChange={e => setScheduleDate(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:border-[#0070f3] outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-1">Start Time</label>
                    <input
                      type="time"
                      required
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:border-[#0070f3] outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--ink)] mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    required
                    value={scheduleDuration}
                    onChange={e => setScheduleDuration(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm focus:border-[#0070f3] outline-none transition-all"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 justify-end">
                <button 
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--mute)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={scheduling}
                  className="px-4 py-2 bg-[#0070f3] text-white hover:opacity-90 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {scheduling ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Event Creation Modal */}
      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-2xl floating-shadow animate-in zoom-in-95 duration-200 my-8">
            <h3 className="text-xl font-semibold text-[var(--ink)] mb-1">Create an Event</h3>
            <p className="text-sm text-[var(--mute)] mb-6">Schedule a poster across multiple screens for your upcoming event.</p>
            
            <form onSubmit={handleEventSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-1">Event Name *</label>
                    <input
                      type="text"
                      required
                      value={eventName}
                      onChange={e => setEventName(e.target.value)}
                      placeholder="e.g. Annual Tech Symposium"
                      className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none focus:border-[#0070f3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-1">Short Description</label>
                    <textarea
                      value={eventDescription}
                      onChange={e => setEventDescription(e.target.value)}
                      placeholder="Briefly describe the event..."
                      rows={3}
                      className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none focus:border-[#0070f3]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-1">Poster Image *</label>
                    <input
                      type="file"
                      accept="image/*"
                      required
                      onChange={e => setEventPoster(e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none"
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--ink)] mb-2">Target Screens *</label>
                    <div className="max-h-32 overflow-y-auto bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg p-2 space-y-1">
                      {screens.length === 0 && <p className="text-xs text-[var(--mute)] p-2">No active screens available.</p>}
                      {screens.map(screen => (
                        <label key={screen.id} className="flex items-center gap-2 p-2 hover:bg-[var(--canvas-elevated)] rounded cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={selectedScreens.includes(screen.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedScreens([...selectedScreens, screen.id])
                              else setSelectedScreens(selectedScreens.filter(id => id !== screen.id))
                            }}
                            className="rounded border-[var(--hairline)] text-[#0070f3] focus:ring-[#0070f3]"
                          />
                          <span className="text-sm text-[var(--ink)]">{screen.name}</span>
                          <span className="text-xs text-[var(--mute)] ml-auto">{screen.location}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-[var(--mute)] mb-1">Start Date *</label>
                      <input type="date" required value={eventStartDate} onChange={e => setEventStartDate(e.target.value)} className="w-full px-3 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--mute)] mb-1">Start Time *</label>
                      <input type="time" required value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} className="w-full px-3 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--mute)] mb-1">End Date *</label>
                      <input type="date" required value={eventEndDate} onChange={e => setEventEndDate(e.target.value)} className="w-full px-3 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[var(--mute)] mb-1">End Time *</label>
                      <input type="time" required value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} className="w-full px-3 py-1.5 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm outline-none" />
                    </div>
                  </div>
                </div>

              </div>
              
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--hairline)]">
                <button 
                  type="button"
                  onClick={() => setEventModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-[var(--mute)] hover:text-[var(--ink)]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={creatingEvent || selectedScreens.length === 0}
                  className="px-6 py-2 bg-[#0070f3] text-white hover:opacity-90 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 flex items-center gap-2"
                >
                  {creatingEvent ? 'Submitting...' : 'Submit Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
