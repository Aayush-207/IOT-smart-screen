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
      <div className="bg-[#141414] border border-[#212327] rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#ffffff]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#212327] flex items-center justify-between bg-[#0a0a0a]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-[#ffffff]/5 border border-[#212327]">
              <Monitor className="w-4 h-4 text-[#ffffff]" />
            </div>
            <div>
              <h2 className="text-sm font-normal text-[#ffffff]">Display Screen Simulator</h2>
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
                    ? 'bg-[#ffffff] text-[#0a0a0a] font-medium'
                    : 'text-[#7d8187] hover:text-[#ffffff]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-[#ffffff] text-[#0a0a0a] font-medium'
                    : 'text-[#7d8187] hover:text-[#ffffff]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              className="p-1.5 text-[#7d8187] hover:text-[#ffffff] rounded-full hover:bg-[#ffffff]/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Simulated Hardware Screen */}
        <div className="flex-1 p-6 overflow-auto bg-[#0a0a0a] flex flex-col items-center justify-center relative">
          <div
            className={`@container transition-all duration-300 relative rounded-2xl border-4 border-[#212327] shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black overflow-hidden flex flex-col shrink-0 ${
              orientation === 'landscape'
                ? 'w-full max-w-2xl aspect-[16/9]'
                : 'w-auto h-[65vh] aspect-[9/16]'
            }`}
          >
            {/* Top Billboard Status Bar */}
            <div className="px-4 py-2 bg-neutral-950 border-b border-[#212327] flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00eaff] animate-pulse" />
                <span className="font-mono text-[10px] uppercase tracking-wider text-[#ffffff]">CampusCast Display</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                <Clock className="w-3 h-3 text-[#ffffff]" />
                <span>1672x941 &bull; 60 FPS</span>
              </div>
            </div>

            <div
              className={`flex-1 flex flex-col justify-center items-center text-center transition-colors relative overflow-hidden font-sans ${
                isEmergency ? 'bg-radial from-[#ef2045]/20 to-black text-[#ffeaea] p-[4cqw]' : 'bg-black text-[#ffffff] p-[4cqw]'
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
                    <div className="flex items-center gap-[1cqw] px-[2cqw] py-[0.5cqw] rounded-full bg-[#ef2045]/30 border border-[#ef2045] text-[#ef2045] text-[2cqw] font-mono uppercase tracking-wider mb-[2cqw] animate-pulse shadow-[0_0_20px_rgba(239,32,69,0.5)]">
                      <AlertTriangle className="w-[2.5cqw] h-[2.5cqw]" /> Emergency Alert
                    </div>
                  )}

                  <div className="text-[1.5cqw] font-mono tracking-widest uppercase text-neutral-400 mb-[1.5cqw] px-[1.5cqw] py-[0.25cqw] rounded-full bg-neutral-900 border border-[#212327]">
                    {departmentName} &bull; {PRIORITY_LABEL[priority]}
                  </div>

                  <h1 className="text-[4cqw] leading-tight font-bold tracking-tight mb-[1.5cqw] line-clamp-2 text-[#ffffff] px-[1cqw]">
                    {title.trim() || 'Untitled Announcement'}
                  </h1>

                  {body.trim() && (
                    <p className="text-[2cqw] leading-relaxed text-[#ffffff]/80 max-w-[85%] line-clamp-4 mx-auto font-medium">
                      {body}
                    </p>
                  )}

                  <div className="absolute bottom-[2cqw] right-[3cqw] opacity-40">
                    <div className="w-[6cqw] h-[6cqw] bg-[#ffffff] mix-blend-overlay rounded-full blur-xl" />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-4 py-2 bg-neutral-950 border-t border-[#212327] text-[10px] text-neutral-400 flex justify-between font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ffffff]" /> Connected Screen
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
            className="px-4 py-1.5 rounded-full bg-[#ffffff] text-[#0a0a0a] text-xs font-medium hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
