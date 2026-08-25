'use client'

import React, { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, AlertCircle, CheckCircle, Clock, Plus, Tv } from 'lucide-react'
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
  
  // Modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false)
  const [newScreenName, setNewScreenName] = useState('')
  const [newScreenLocation, setNewScreenLocation] = useState('')
  const [requesting, setRequesting] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, screenId: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingFor(screenId)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `${clubId}/${fileName}`

      // Upload to Storage
      const { error: uploadError } = await supabase.storage
        .from('posters')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('posters')
        .getPublicUrl(filePath)

      // Create Poster Request
      const { error: dbError } = await supabase
        .from('poster_requests')
        .insert({
          screen_id: screenId,
          club_id: clubId,
          image_url: publicUrl,
          status: 'pending'
        })

      if (dbError) throw dbError

      // Refresh data
      router.refresh()
      window.location.reload()
    } catch (error) {
      alert('Error uploading poster!')
      console.error(error)
    } finally {
      setUploadingFor(null)
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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-semibold">Your Screens</h2>
          <p className="text-sm text-[var(--mute)]">Manage posters or request new displays.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {allSlots.map((slot) => {
          const isBlurred = slot.type !== 'active'
          const name = slot.type === 'active' || slot.type === 'pending' ? slot.data.name : "Available Screen Slot"
          const location = slot.type === 'active' || slot.type === 'pending' ? slot.data.location : "Unallocated"
          const req = slot.type === 'active' ? slot.data.latestRequest : null

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
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <p className="text-sm font-medium text-emerald-600 dark:text-emerald-500">Live on Screen</p>
                        </div>
                        <img src={req.image_url} alt="Current Poster" className="rounded-md border border-[var(--hairline)] w-full h-32 object-cover" />
                        <p className="text-xs text-[var(--mute)] mt-3 text-center" suppressHydrationWarning>
                          Updated on {new Date(req.created_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <label className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${slot.type === 'active' && uploadingFor === slot.data.id ? 'bg-[var(--mute)] text-white cursor-not-allowed' : 'bg-[var(--ink)] text-[var(--canvas)] whisper-shadow'} ${slot.type === 'active' ? 'cursor-pointer hover:opacity-90' : ''}`}>
                    <Upload className="w-4 h-4" />
                    {slot.type === 'active' && uploadingFor === slot.data.id ? 'Uploading...' : 'Upload New Poster'}
                    {slot.type === 'active' && (
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => handleFileUpload(e, slot.data.id)}
                        disabled={uploadingFor === slot.data.id}
                      />
                    )}
                  </label>
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
    </>
  )
}
