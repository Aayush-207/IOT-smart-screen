'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, XCircle, Clock, Tv, AlertCircle, 
  Image as ImageIcon, Monitor, ScrollText, Eye, Maximize2, X, ChevronRight, ChevronLeft, Pencil
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function HodDashboardClient({ 
  initialRequests, 
  initialScreenRequests,
  initialScreens,
  initialClubs
}: { 
  initialRequests: any[], 
  initialScreenRequests: any[],
  initialScreens: any[],
  initialClubs: any[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [screenRequests, setScreenRequests] = useState(initialScreenRequests)
  const [screens, setScreens] = useState(initialScreens)
  
  const unusedScreens = useMemo(() => {
    if (!initialClubs) return []
    return initialClubs.flatMap(club => {
      const usedCount = screens.filter(s => s.club_id === club.id).length + 
                        screenRequests.filter(r => r.club_id === club.id && r.status !== 'rejected').length
      const unusedCount = Math.max(0, 3 - usedCount)
      return Array.from({ length: unusedCount }).map((_, i) => ({
        id: `unused|${club.id}|${i}`,
        club_id: club.id,
        clubs: { name: club.name }
      }))
    })
  }, [initialClubs, screens, screenRequests])
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'posters' | 'hardware' | 'screens' | 'logs'>('posters')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [activeReqId, setActiveReqId] = useState<string | null>(null)
  const [activeReqType, setActiveReqType] = useState<'poster' | 'screen'>('poster')
  const [rejectActionType, setRejectActionType] = useState<'reject' | 'changes'>('reject')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editingScreenId, setEditingScreenId] = useState<string | null>(null)
  const [editingScreenName, setEditingScreenName] = useState('')
  const [editingScreenLocation, setEditingScreenLocation] = useState('')

  // Lightbox & Modals
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)
  const [activeLogDetail, setActiveLogDetail] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  // Calculated Badges
  const pendingPostersCount = requests.filter(r => r.status === 'pending').length
  const pendingHardwareCount = screenRequests.filter(r => r.status === 'pending').length

  // Calculated Logs
  const logs = useMemo(() => {
    const posterLogs = requests
      .filter(r => r.status !== 'pending')
      .map(r => ({
        id: r.id,
        type: 'Poster',
        status: r.status,
        clubName: r.clubs?.name,
        target: r.screens?.name,
        imageUrl: r.image_url,
        rejectionReason: r.rejection_reason,
        date: new Date(r.updated_at || r.created_at)
      }))

    const hardwareLogs = screenRequests
      .filter(r => r.status !== 'pending')
      .map(r => ({
        id: r.id,
        type: 'Hardware',
        status: r.status,
        clubName: r.clubs?.name,
        target: r.name,
        location: r.location,
        rejectionReason: r.rejection_reason,
        date: new Date(r.updated_at || r.created_at)
      }))

    return [...posterLogs, ...hardwareLogs].sort((a, b) => b.date.getTime() - a.date.getTime())
  }, [requests, screenRequests])

  const handleApprovePoster = async (reqId: string, screenId: string, imageUrl: string) => {
    setLoading(true)
    try {
      // 1. Update poster_requests status
      const { error: reqError } = await supabase
        .from('poster_requests')
        .update({ status: 'approved' })
        .eq('id', reqId)

      if (reqError) throw reqError

      router.refresh()
      setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved', updated_at: new Date().toISOString() } : r))

    } catch (e) {
      console.error(e)
      alert("Failed to approve poster.")
    } finally {
      setLoading(false)
    }
  }

  const handleApproveScreen = async (reqId: string, clubId: string, name: string, location: string) => {
    setLoading(true)
    try {
      // 1. Insert actual screen hardware record
      const { data: newScreen, error: screenError } = await supabase
        .from('screens')
        .insert({ name, location, club_id: clubId })
        .select()
        .single()

      if (screenError) throw screenError

      // 2. Mark request as approved
      const { error: reqError } = await supabase
        .from('screen_requests')
        .update({ status: 'approved' })
        .eq('id', reqId)

      if (reqError) throw reqError

      router.refresh()
      setScreenRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved', updated_at: new Date().toISOString() } : r))
      
      // Attempt to attach club name for the UI immediately
      if (newScreen) {
        const clubName = screenRequests.find(r => r.id === reqId)?.clubs?.name
        setScreens(prev => [...prev, { ...newScreen, clubs: { name: clubName } }])
      }
    } catch (e) {
      console.error(e)
      alert("Failed to approve hardware screen request.")
    } finally {
      setLoading(false)
    }
  }

  const handleClearPoster = async (screenId: string) => {
    if (!confirm('Are you sure you want to remove the poster from this screen?')) return
    setLoading(true)
    try {
      const { error } = await supabase
        .from('screens')
        .update({ current_poster_url: null })
        .eq('id', screenId)

      if (error) throw error

      setScreens(prev => prev.map(s => s.id === screenId ? { ...s, current_poster_url: null } : s))
      router.refresh()
    } catch (e) {
      console.error(e)
      alert("Failed to clear poster")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!activeReqId || !rejectionReason.trim()) return
    setLoading(true)
    try {
      const table = activeReqType === 'poster' ? 'poster_requests' : 'screen_requests'
      const statusValue = rejectActionType === 'changes' ? 'changes_requested' : 'rejected'
      const { error } = await supabase
        .from(table)
        .update({ 
          status: statusValue,
          rejection_reason: rejectionReason
        })
        .eq('id', activeReqId)

      if (error) throw error

      router.refresh()
      
      if (activeReqType === 'poster') {
        setRequests(prev => prev.map(r => r.id === activeReqId ? { ...r, status: statusValue, rejection_reason: rejectionReason, updated_at: new Date().toISOString() } : r))
      } else {
        setScreenRequests(prev => prev.map(r => r.id === activeReqId ? { ...r, status: statusValue, rejection_reason: rejectionReason, updated_at: new Date().toISOString() } : r))
      }
      
      setRejectModalOpen(false)
      setRejectionReason('')
    } catch (e) {
      console.error(e)
      alert("Failed to reject request.")
    } finally {
      setLoading(false)
    }
  }

  const openRejectModal = (reqId: string, type: 'poster' | 'screen', actionType: 'reject' | 'changes' = 'reject') => {
    setActiveReqId(reqId)
    setActiveReqType(type)
    setRejectActionType(actionType)
    setRejectModalOpen(true)
  }

  const openEditModal = (screenId: string, currentName: string, currentLocation: string = '') => {
    setEditingScreenId(screenId)
    setEditingScreenName(currentName)
    setEditingScreenLocation(currentLocation)
    setEditModalOpen(true)
  }

  const handleEditScreenSubmit = async () => {
    if (!editingScreenId || !editingScreenName.trim()) return
    setLoading(true)
    try {
      if (editingScreenId.startsWith('unused|')) {
        // Create new screen from unused slot
        const clubId = editingScreenId.split('|')[1]
        
        // Find club name for local state
        const clubName = initialClubs?.find(c => c.id === clubId)?.name
        
        const { data: newScreen, error } = await supabase
          .from('screens')
          .insert({ name: editingScreenName, location: editingScreenLocation || 'TBD', club_id: clubId })
          .select()
          .single()

        if (error) throw error
        
        if (newScreen) {
          setScreens(prev => [...prev, { ...newScreen, clubs: { name: clubName } }])
        }
      } else {
        // Update existing screen
        const { error } = await supabase
          .from('screens')
          .update({ name: editingScreenName, location: editingScreenLocation || 'TBD' })
          .eq('id', editingScreenId)

        if (error) throw error

        setScreens(prev => prev.map(s => s.id === editingScreenId 
          ? { ...s, name: editingScreenName, location: editingScreenLocation || 'TBD' } 
          : s
        ))
      }

      router.refresh()
      setEditModalOpen(false)
    } catch (e) {
      console.error(e)
      alert("Failed to update screen name")
    } finally {
      setLoading(false)
    }
  }

  const navItems = [
    { id: 'posters', label: 'Poster Requests', icon: ImageIcon, badge: pendingPostersCount },
    { id: 'hardware', label: 'Hardware Requests', icon: Monitor, badge: pendingHardwareCount },
    { id: 'screens', label: 'Current Screens', icon: Tv, badge: 0 },
    { id: 'logs', label: 'Activity Logs', icon: ScrollText, badge: 0 },
  ] as const

  return (
    <div className="flex w-full min-h-[calc(100vh-73px)]">
      
      {/* Left Sidebar */}
      <aside 
        onMouseEnter={() => setIsSidebarExpanded(true)}
        onMouseLeave={() => setIsSidebarExpanded(false)}
        className={`bg-[var(--canvas-elevated)] border-r border-[var(--hairline)] transition-all duration-300 flex flex-col shrink-0 pt-4 ${
          isSidebarExpanded ? 'w-64' : 'w-[72px]'
        }`}
      >
        <nav className="flex-1 p-3 space-y-2 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center p-2.5 rounded-lg transition-colors relative group ${
                  isActive 
                    ? 'bg-[var(--ink)] text-[var(--canvas)] shadow-md' 
                    : 'text-[var(--mute)] hover:bg-[var(--canvas-inset)] hover:text-[var(--ink)]'
                } ${!isSidebarExpanded ? 'justify-center' : 'justify-start'}`}
                title={!isSidebarExpanded ? item.label : undefined}
              >
                <div className="relative shrink-0 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                  {item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[var(--canvas-elevated)]" />
                  )}
                </div>
                
                {isSidebarExpanded && (
                  <span className="ml-3 text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}

                {/* Badge Number when expanded */}
                {isSidebarExpanded && item.badge > 0 && (
                  <span className={`ml-auto text-xs px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 transition-all duration-300 overflow-x-hidden">
        <div className="max-w-7xl mx-auto p-6 md:p-8">
        
        {/* POSTER REQUESTS */}
        {activeTab === 'posters' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2 border-b border-[var(--hairline)] pb-2">
              <ImageIcon className="w-5 h-5 text-[var(--ink)]" />
              <h2 className="text-xl font-semibold">Poster Requests</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {requests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="geist-card flex flex-col justify-between whisper-shadow overflow-hidden group">
                  <div className="h-48 bg-[var(--canvas-inset)] border-b border-[var(--hairline)] relative overflow-hidden group/image">
                    <img src={req.image_url} alt="Poster" className="w-full h-full object-cover transition-transform group-hover/image:scale-105" />
                    
                    {/* Fullscreen view button overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover/image:bg-black/20 transition-colors flex items-center justify-center pointer-events-none group-hover/image:pointer-events-auto">
                      <button 
                        onClick={() => setLightboxImage(req.image_url)}
                        className="opacity-0 group-hover/image:opacity-100 transform translate-y-2 group-hover/image:translate-y-0 transition-all bg-[var(--canvas)]/90 text-[var(--ink)] p-2 rounded-full shadow-lg hover:scale-110"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>

                    {req.status === 'pending' && (
                      <div className="absolute top-3 right-3 bg-[var(--canvas)] text-[var(--ink)] px-3 py-1 rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 pointer-events-none">
                        <Clock className="w-3 h-3 text-amber-500" /> Pending Review
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#0070f3]">
                        {req.clubs?.name}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        req.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                        req.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' :
                        'bg-rose-500/10 text-rose-600'
                      }`}>
                        {req.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[var(--ink)]">{req.screens?.name}</p>
                    <p className="text-xs text-[var(--mute)] mb-2">{req.screens?.location}</p>
                    
                    {req.scheduled_time && (
                      <div className="text-[11px] bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded p-2 mb-2 text-[var(--mute)]">
                        <strong>Schedule:</strong> {new Date(req.scheduled_time).toLocaleString()} <br/>
                        <strong>Duration:</strong> {req.duration_days} Days
                      </div>
                    )}

                    {req.status === 'rejected' && (
                      <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-600">
                        <span className="font-semibold">Reason:</span> {req.rejection_reason}
                      </div>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="p-4 border-t border-[var(--hairline)] bg-[var(--canvas-inset)] flex gap-3">
                      <button 
                        onClick={() => openRejectModal(req.id, 'poster', 'changes')}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-blue-600 bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-blue-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Changes
                      </button>
                      <button 
                        onClick={() => openRejectModal(req.id, 'poster', 'reject')}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--ink)] bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-rose-500 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Reject
                      </button>
                      <button 
                        onClick={() => handleApprovePoster(req.id, req.screen_id, req.image_url)}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--canvas)] bg-[var(--ink)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {requests.filter(r => r.status === 'pending').length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas-inset)] text-[var(--mute)]">
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-500 opacity-50" />
                  <p>No pending poster requests to review.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* HARDWARE SCREEN REQUESTS */}
        {activeTab === 'hardware' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2 border-b border-[var(--hairline)] pb-2">
              <Monitor className="w-5 h-5 text-[var(--ink)]" />
              <h2 className="text-xl font-semibold">Hardware Screen Requests</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {screenRequests.filter(r => r.status === 'pending').length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas-inset)] text-[var(--mute)]">
                  <CheckCircle className="w-8 h-8 mx-auto mb-3 text-emerald-500 opacity-50" />
                  <p>No pending hardware screen requests.</p>
                </div>
              )}

              {screenRequests.filter(r => r.status === 'pending').map((req) => (
                <div key={req.id} className="geist-card flex flex-col justify-between whisper-shadow overflow-hidden group p-5 border-amber-500/20 relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-amber-500/10 rounded-bl-full -z-10" />
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#0070f3]">
                        {req.clubs?.name}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-500/10 text-amber-600">
                        PENDING
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-[var(--ink)]">{req.name}</p>
                    <p className="text-sm text-[var(--mute)] mt-1 font-mono">{req.location}</p>
                  </div>

                  <div className="pt-4 border-t border-[var(--hairline)] flex gap-3">
                    <button 
                      onClick={() => openRejectModal(req.id, 'screen', 'changes')}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-blue-600 bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-blue-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Changes
                    </button>
                    <button 
                      onClick={() => openRejectModal(req.id, 'screen', 'reject')}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--ink)] bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-rose-500 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button 
                      onClick={() => handleApproveScreen(req.id, req.club_id, req.name, req.location)}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--canvas)] bg-[var(--ink)] hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                    >
                      <CheckCircle className="w-4 h-4" /> Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CURRENT SCREENS */}
        {activeTab === 'screens' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2 border-b border-[var(--hairline)] pb-2">
              <Tv className="w-5 h-5 text-[var(--ink)]" />
              <h2 className="text-xl font-semibold">Active Hardware Fleet</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {screens.length === 0 && unusedScreens.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas-inset)] text-[var(--mute)]">
                  <p>No active screens allocated in this department.</p>
                </div>
              )}
              {screens.map(screen => {
                const activeReq = requests.find(req => {
                  if (req.screen_id !== screen.id || req.status !== 'approved' || !req.scheduled_time || !req.duration_days) return false
                  const start = new Date(req.scheduled_time)
                  const end = new Date(start.getTime() + req.duration_days * 24 * 60 * 60 * 1000)
                  const now = new Date()
                  return now >= start && now <= end
                })
                
                const displayImageUrl = activeReq ? activeReq.image_url : screen.current_poster_url
                
                let daysLeft = null
                if (activeReq) {
                  const end = new Date(new Date(activeReq.scheduled_time).getTime() + activeReq.duration_days * 24 * 60 * 60 * 1000)
                  const now = new Date()
                  daysLeft = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
                }

                return (
                <div key={screen.id} className="geist-card p-0 whisper-shadow border-[var(--hairline)] flex flex-col overflow-hidden group">
                   <div className="h-40 bg-[var(--canvas-inset)] border-b border-[var(--hairline)] relative overflow-hidden flex items-center justify-center">
                     {displayImageUrl ? (
                       <>
                         <img src={displayImageUrl} alt="Screen Poster" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100">
                            <button 
                              onClick={() => setLightboxImage(displayImageUrl)}
                              className="bg-[var(--canvas)]/90 text-[var(--ink)] p-2 rounded-full shadow-lg hover:scale-110"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                         </div>
                       </>
                     ) : (
                       <div className="text-[var(--mute)] flex flex-col items-center opacity-50">
                         <Monitor className="w-8 h-8 mb-2" />
                         <span className="text-xs font-medium uppercase tracking-wider">No Poster</span>
                       </div>
                     )}
                   </div>

                   <div className="p-5 flex-1 flex flex-col justify-between">
                     <div>
                       <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1 block">
                         {screen.clubs?.name}
                       </span>
                       <h3 className="font-semibold text-[var(--ink)] text-lg flex items-center gap-2 group/edit">
                         <Tv className="w-4 h-4" /> {screen.name}
                         <button 
                           onClick={() => openEditModal(screen.id, screen.name, screen.location)}
                           className="opacity-0 group-hover/edit:opacity-100 p-1 text-[var(--mute)] hover:text-[#0070f3] hover:bg-[#0070f3]/10 rounded transition-all"
                           title="Edit Screen Name"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                         </button>
                       </h3>
                       <p className="text-sm font-mono text-[var(--mute)] mt-1">{screen.location}</p>
                     </div>
                     <div className="mt-4 pt-4 border-t border-[var(--hairline)] flex items-center justify-between">
                       {activeReq ? (
                         <span className="text-xs bg-blue-500/10 text-blue-600 px-3 py-1.5 rounded-md font-medium border border-blue-500/20 flex items-center gap-1">
                           <Clock className="w-3.5 h-3.5" /> {daysLeft} Days Left
                         </span>
                       ) : screen.current_poster_url ? (
                         <span className="text-xs bg-emerald-500/10 text-emerald-600 px-3 py-1.5 rounded-md font-medium">Legacy Poster Live</span>
                       ) : (
                         <span className="text-xs bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] px-3 py-1.5 rounded-md font-medium">Empty Screen</span>
                       )}
                       
                       {displayImageUrl && (
                         <button 
                           onClick={() => handleClearPoster(screen.id)}
                           disabled={loading}
                           className="text-xs flex items-center gap-1.5 bg-rose-500/10 text-rose-600 px-3 py-1.5 rounded-md font-medium hover:bg-rose-500/20 transition-colors"
                         >
                           <XCircle className="w-3.5 h-3.5" /> Delete
                         </button>
                       )}
                     </div>
                   </div>
                </div>
              )})}

              {unusedScreens.map(unused => (
                <div key={unused.id} className="geist-card p-0 border-dashed border-2 opacity-60 flex flex-col overflow-hidden group">
                   <div className="h-40 bg-[var(--canvas-inset)] border-b border-[var(--hairline)] flex flex-col items-center justify-center text-[var(--mute)]">
                     <Monitor className="w-8 h-8 mb-2 opacity-30" />
                     <span className="text-xs font-medium uppercase tracking-wider">Unused Screen Slot</span>
                   </div>
                   <div className="p-5 flex-1 flex flex-col justify-between">
                     <div>
                       <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1 block">
                         {unused.clubs.name}
                       </span>
                       <h3 className="font-semibold text-[var(--ink)] text-lg flex items-center gap-2 group/edit">
                         <Tv className="w-4 h-4 opacity-50" /> Unallocated
                         <button 
                           onClick={() => openEditModal(unused.id, '', '')}
                           className="opacity-0 group-hover/edit:opacity-100 p-1 text-[var(--mute)] hover:text-[#0070f3] hover:bg-[#0070f3]/10 rounded transition-all"
                           title="Allocate and Name this screen"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                         </button>
                       </h3>
                       <p className="text-sm font-mono text-[var(--mute)] mt-1">Waiting for club request</p>
                     </div>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIVITY LOGS */}
        {activeTab === 'logs' && (
          <div className="animate-in fade-in duration-300">
            <div className="mb-6 flex items-center gap-2 border-b border-[var(--hairline)] pb-2">
              <ScrollText className="w-5 h-5 text-[var(--ink)]" />
              <h2 className="text-xl font-semibold">Department Activity Logs</h2>
            </div>

            <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-xl overflow-hidden whisper-shadow">
              {logs.length === 0 ? (
                <div className="p-8 text-center text-[var(--mute)]">No activity logged yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--canvas-inset)] border-b border-[var(--hairline)] text-[var(--mute)]">
                    <tr>
                      <th className="px-4 py-3 font-medium">Date & Time</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Club</th>
                      <th className="px-4 py-3 font-medium">Target</th>
                      <th className="px-4 py-3 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--hairline)]">
                    {logs.map(log => (
                      <tr key={log.id} className="hover:bg-[var(--canvas-inset)]/50 transition-colors">
                        <td className="px-4 py-3 text-[var(--mute)] tabular-nums">{log.date.toLocaleString()}</td>
                        <td className="px-4 py-3 font-medium text-[var(--ink)]">{log.type}</td>
                        <td className="px-4 py-3 text-[var(--ink)]">{log.clubName}</td>
                        <td className="px-4 py-3 text-[var(--mute)] max-w-xs truncate">{log.target}</td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            log.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                          }`}>
                            {log.status.toUpperCase()}
                          </span>
                          <button 
                            onClick={() => setActiveLogDetail(log)}
                            className="p-1 rounded hover:bg-[var(--canvas)] text-[var(--mute)] hover:text-[var(--ink)] transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-12 animate-in fade-in duration-200"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
             <button 
               onClick={() => setLightboxImage(null)}
               className="absolute top-0 right-0 z-10 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-lg transition-colors"
             >
               <X className="w-6 h-6" />
             </button>
             <img 
               src={lightboxImage} 
               alt="Fullscreen Poster" 
               className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" 
             />
          </div>
        </div>
      )}

      {/* Log Detail Modal */}
      {activeLogDetail && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setActiveLogDetail(null)}>
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-[var(--ink)]">Log Details</h3>
              <button onClick={() => setActiveLogDetail(null)} className="text-[var(--mute)] hover:text-[var(--ink)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeLogDetail.type === 'Poster' && activeLogDetail.imageUrl && (
              <img src={activeLogDetail.imageUrl} alt="Poster" className="w-full h-48 object-cover rounded-lg border border-[var(--hairline)] mb-4" />
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                <span className="text-[var(--mute)]">Type</span>
                <span className="font-medium text-[var(--ink)]">{activeLogDetail.type}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                <span className="text-[var(--mute)]">Status</span>
                <span className={`font-medium ${activeLogDetail.status === 'approved' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {activeLogDetail.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                <span className="text-[var(--mute)]">Club</span>
                <span className="font-medium text-[var(--ink)]">{activeLogDetail.clubName}</span>
              </div>
              <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                <span className="text-[var(--mute)]">Target</span>
                <span className="font-medium text-[var(--ink)]">{activeLogDetail.target}</span>
              </div>
              {activeLogDetail.type === 'Hardware' && activeLogDetail.location && (
                <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                  <span className="text-[var(--mute)]">Location</span>
                  <span className="font-medium text-[var(--ink)]">{activeLogDetail.location}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-[var(--hairline)] pb-2">
                <span className="text-[var(--mute)]">Date</span>
                <span className="font-medium text-[var(--ink)]">{activeLogDetail.date.toLocaleString()}</span>
              </div>
              {activeLogDetail.status === 'rejected' && (
                <div className="pt-2">
                  <span className="text-[var(--mute)] block mb-1">Rejection Reason</span>
                  <p className="bg-rose-500/10 text-rose-600 p-3 rounded-lg text-xs">{activeLogDetail.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tailwind Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">
              {rejectActionType === 'changes' ? 'Request Changes' : 'Reject Request'}
            </h3>
            <p className="text-sm text-[var(--mute)] mb-4">
              {rejectActionType === 'changes' 
                ? 'Please provide detailed feedback on what needs to be changed.' 
                : 'Please provide a reason for rejecting this request.'}
            </p>
            
            <textarea
              className="w-full p-3 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] min-h-[100px] mb-4"
              placeholder={rejectActionType === 'changes' ? "e.g., Update the font size and add more contrast..." : "e.g., Image quality is too low..."}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            
            <div className="flex gap-3 justify-end">
               <button 
                 onClick={() => {
                   setRejectModalOpen(false)
                   setRejectionReason('')
                 }}
                 className="px-4 py-2 text-sm font-medium text-[var(--body)] hover:text-[var(--ink)]"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleReject}
                 disabled={loading || !rejectionReason.trim()}
                 className={`px-4 py-2 hover:opacity-90 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${rejectActionType === 'changes' ? 'bg-blue-600' : 'bg-rose-600'}`}
               >
                 {loading ? 'Processing...' : rejectActionType === 'changes' ? 'Submit Feedback' : 'Reject Request'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Screen Name Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-[var(--canvas-elevated)] rounded-xl border border-[var(--hairline)] p-6 w-full max-w-md floating-shadow animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-1">
              Edit Screen Name
            </h3>
            <p className="text-sm text-[var(--mute)] mb-4">This new name will be updated instantly for the club.</p>
            
            <input
              type="text"
              className="w-full p-3 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] mb-3"
              placeholder="e.g., Main Hall Display"
              value={editingScreenName}
              onChange={(e) => setEditingScreenName(e.target.value)}
            />
            <input
              type="text"
              className="w-full p-3 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-[#0070f3] focus:ring-1 focus:ring-[#0070f3] mb-4"
              placeholder="Location (Optional)"
              value={editingScreenLocation}
              onChange={(e) => setEditingScreenLocation(e.target.value)}
            />
            
            <div className="flex gap-3 justify-end">
               <button 
                 onClick={() => setEditModalOpen(false)}
                 className="px-4 py-2 text-sm font-medium text-[var(--body)] hover:text-[var(--ink)]"
               >
                 Cancel
               </button>
               <button 
                 onClick={handleEditScreenSubmit}
                 disabled={loading || !editingScreenName.trim()}
                 className="px-4 py-2 bg-[var(--ink)] hover:opacity-90 text-[var(--canvas)] rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
               >
                 {loading ? 'Saving...' : 'Save Name'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
