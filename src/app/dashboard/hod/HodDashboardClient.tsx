'use client'

import React, { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  CheckCircle, XCircle, Clock, Tv, AlertCircle, 
  Image as ImageIcon, Monitor, ScrollText, Eye, Maximize2, X, ChevronRight, ChevronLeft
} from 'lucide-react'
import { useRouter } from 'next/navigation'

export function HodDashboardClient({ 
  initialRequests, 
  initialScreenRequests,
  initialScreens
}: { 
  initialRequests: any[], 
  initialScreenRequests: any[],
  initialScreens: any[]
}) {
  const [requests, setRequests] = useState(initialRequests)
  const [screenRequests, setScreenRequests] = useState(initialScreenRequests)
  const [screens, setScreens] = useState(initialScreens)
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'posters' | 'hardware' | 'screens' | 'logs'>('posters')
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)

  // Modals
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [activeReqId, setActiveReqId] = useState<string | null>(null)
  const [activeReqType, setActiveReqType] = useState<'poster' | 'screen'>('poster')
  const [rejectionReason, setRejectionReason] = useState('')
  const [loading, setLoading] = useState(false)

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
      const { error: reqError } = await supabase
        .from('poster_requests')
        .update({ status: 'approved' })
        .eq('id', reqId)

      if (reqError) throw reqError

      const { error: screenError } = await supabase
        .from('screens')
        .update({ current_poster_url: imageUrl })
        .eq('id', screenId)

      if (screenError) throw screenError

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
      const { error: screenError } = await supabase
        .from('screens')
        .insert({ name, location, club_id: clubId })

      if (screenError) throw screenError

      // 2. Mark request as approved
      const { error: reqError } = await supabase
        .from('screen_requests')
        .update({ status: 'approved' })
        .eq('id', reqId)

      if (reqError) throw reqError

      router.refresh()
      setScreenRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'approved', updated_at: new Date().toISOString() } : r))
    } catch (e) {
      console.error(e)
      alert("Failed to approve hardware screen request.")
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    if (!activeReqId || !rejectionReason.trim()) return
    setLoading(true)
    try {
      const table = activeReqType === 'poster' ? 'poster_requests' : 'screen_requests'
      const { error } = await supabase
        .from(table)
        .update({ status: 'rejected', rejection_reason: rejectionReason })
        .eq('id', activeReqId)

      if (error) throw error

      router.refresh()
      if (activeReqType === 'poster') {
        setRequests(prev => prev.map(r => r.id === activeReqId ? { ...r, status: 'rejected', rejection_reason: rejectionReason, updated_at: new Date().toISOString() } : r))
      } else {
        setScreenRequests(prev => prev.map(r => r.id === activeReqId ? { ...r, status: 'rejected', rejection_reason: rejectionReason, updated_at: new Date().toISOString() } : r))
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

  const openRejectModal = (reqId: string, type: 'poster' | 'screen') => {
    setActiveReqId(reqId)
    setActiveReqType(type)
    setRejectModalOpen(true)
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
                    <p className="text-xs text-[var(--mute)]">{req.screens?.location}</p>
                    
                    {req.status === 'rejected' && (
                      <div className="mt-3 p-2 bg-rose-500/10 border border-rose-500/20 rounded text-xs text-rose-600">
                        <span className="font-semibold">Reason:</span> {req.rejection_reason}
                      </div>
                    )}
                  </div>

                  {req.status === 'pending' && (
                    <div className="p-4 border-t border-[var(--hairline)] bg-[var(--canvas-inset)] flex gap-3">
                      <button 
                        onClick={() => openRejectModal(req.id, 'poster')}
                        disabled={loading}
                        className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--ink)] bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-rose-500 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Reject
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
                      onClick={() => openRejectModal(req.id, 'screen')}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-[var(--ink)] bg-[var(--canvas-elevated)] border border-[var(--hairline)] hover:border-rose-500 hover:text-rose-500 transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" /> Reject
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
              {screens.length === 0 && (
                <div className="col-span-full p-12 text-center border border-dashed border-[var(--hairline)] rounded-xl bg-[var(--canvas-inset)] text-[var(--mute)]">
                  <p>No active screens allocated in this department.</p>
                </div>
              )}
              {screens.map(screen => (
                <div key={screen.id} className="geist-card p-5 whisper-shadow border-[var(--hairline)] flex flex-col justify-between">
                   <div>
                     <span className="text-xs font-semibold uppercase tracking-wider text-[var(--mute)] mb-1 block">
                       {screen.clubs?.name}
                     </span>
                     <h3 className="font-semibold text-[var(--ink)] text-lg flex items-center gap-2">
                       <Tv className="w-4 h-4" /> {screen.name}
                     </h3>
                     <p className="text-sm font-mono text-[var(--mute)] mt-1">{screen.location}</p>
                   </div>
                   <div className="mt-4 pt-4 border-t border-[var(--hairline)] flex items-center justify-between">
                     <span className="text-xs text-[var(--mute)]">Current Poster:</span>
                     {screen.current_poster_url ? (
                       <span className="text-xs bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded font-medium">Active</span>
                     ) : (
                       <span className="text-xs bg-[var(--canvas-inset)] border border-[var(--hairline)] text-[var(--mute)] px-2 py-0.5 rounded font-medium">None</span>
                     )}
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
              Reject {activeReqType === 'poster' ? 'Poster' : 'Screen'} Request
            </h3>
            <p className="text-sm text-[var(--mute)] mb-4">Please provide a reason for rejecting this request. The club will see this reason.</p>
            
            <textarea
              className="w-full p-3 bg-[var(--canvas-inset)] border border-[var(--hairline)] rounded-lg text-sm text-[var(--ink)] focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 mb-4 min-h-[100px]"
              placeholder="e.g., Request exceeds budget, invalid file format..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
            
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-[var(--body)] hover:text-[var(--ink)]"
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
