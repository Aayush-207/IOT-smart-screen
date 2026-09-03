'use client'

import React, { useState } from 'react'
import { Monitor, Smartphone, X, AlertTriangle, Clock } from 'lucide-react'
import { PRIORITY_LABEL, type Priority } from '@/lib/priority'

interface BillboardPreviewProps {
  isOpen: boolean
  onClose: () => void
  title: string
  body: string
  priority: Priority
  departmentName?: string
  attachmentUrl?: string | null
  attachmentFile?: File | null
}

export function BillboardPreviewModal({
  isOpen,
  onClose,
  title,
  body,
  priority,
  departmentName = 'Department Announcement',
  attachmentUrl,
  attachmentFile,
}: BillboardPreviewProps) {
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [objectUrl, setObjectUrl] = useState<string | null>(null)

  React.useEffect(() => {
    if (!attachmentFile) {
      setObjectUrl(null)
      return
    }
    const url = URL.createObjectURL(attachmentFile)
    setObjectUrl(url)
    return () => {
      URL.revokeObjectURL(url)
    }
  }, [attachmentFile])

  if (!isOpen) return null

  const displayImage = objectUrl || attachmentUrl || null
  const isEmergency = priority === 'emergency'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200" role="dialog" aria-modal="true" aria-label="Display Screen Simulator">
      <div className="bg-[#141414] border border-[#212327] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#212327] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-white/5 border border-[#212327]">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-normal text-white">Display Screen Simulator</h2>
              <p className="text-xs text-[#7d8187]">Real-time preview of your notice rendered on physical displays</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation toggles */}
            <div className="flex bg-[#141414] p-1 rounded-full border border-[#212327] text-xs">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white text-[#0a0a0a] font-medium'
                    : 'text-[#7d8187] hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white text-[#0a0a0a] font-medium'
                    : 'text-[#7d8187] hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              className="p-1.5 text-[#7d8187] hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Simulated Hardware Screen */}
        <div className="flex-1 p-6 overflow-auto bg-[#0a0a0a] flex flex-col items-center justify-center relative">
          <div
            className={`transition-all duration-300 relative rounded-2xl border-4 border-[#212327] shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black overflow-hidden flex flex-col ${
              orientation === 'landscape'
                ? 'w-full max-w-2xl aspect-[16/9]'
                : 'w-[320px] aspect-[9/16]'
            }`}
          >
            {/* Top Billboard Status Bar */}
            <div className="px-4 py-2 bg-neutral-950 border-b border-[#212327] flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-white">CampusCast Display</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                <Clock className="w-3 h-3 text-white" />
                <span>1080p &bull; 60 FPS</span>
              </div>
            </div>

            {/* Billboard Screen Canvas */}
            <div
              className={`flex-1 flex flex-col justify-center items-center text-center transition-colors relative overflow-hidden ${
                isEmergency ? 'bg-radial from-rose-950 to-black text-rose-100 p-6' : 'bg-black text-white p-6'
              }`}
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="Billboard Poster"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  {isEmergency && (
                    <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-600/30 border border-rose-500 text-rose-200 text-xs font-mono uppercase tracking-wider mb-3 animate-pulse">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Emergency Alert
                    </div>
                  )}

                  <div className="text-[10px] font-mono tracking-widest uppercase text-neutral-400 mb-2 px-3 py-0.5 rounded-full bg-neutral-900 border border-[#212327]">
                    {departmentName} &bull; {PRIORITY_LABEL[priority]}
                  </div>

                  <h1 className="text-lg sm:text-2xl font-normal tracking-tight mb-2 line-clamp-2 text-white px-2">
                    {title.trim() || 'Untitled Announcement'}
                  </h1>

                  {body.trim() && (
                    <p className="text-xs sm:text-sm text-neutral-300 max-w-md line-clamp-3 whitespace-pre-wrap leading-relaxed px-2 font-normal">
                      {body}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-4 py-2 bg-neutral-950 border-t border-[#212327] text-[10px] text-neutral-400 flex justify-between font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white" /> Connected Screen
              </span>
              <span>Sync Cycle: 5s</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#212327] bg-[#0a0a0a] flex justify-between items-center">
          <span className="text-xs text-[#7d8187]">Simulating native screen output at scale</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-full bg-white text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
