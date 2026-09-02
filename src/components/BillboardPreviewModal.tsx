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
      <div className="bg-[#150f23] border border-[#362d59] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-white">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#362d59] flex items-center justify-between bg-[#150f23]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#1f1633] border border-[#362d59]">
              <Monitor className="w-5 h-5 text-[#c2ef4e]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Display Screen Simulator</h2>
              <p className="text-xs text-[#8b8496]">Real-time preview of your notice rendered on physical displays</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation toggles */}
            <div className="flex bg-[#1f1633] p-1 rounded-lg border border-[#362d59] text-xs font-bold">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-[#c2ef4e] text-[#150f23] shadow-sm'
                    : 'text-[#8b8496] hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9 Horizontal
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-[#c2ef4e] text-[#150f23] shadow-sm'
                    : 'text-[#8b8496] hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16 Vertical
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close Preview"
              className="p-2 text-[#8b8496] hover:text-white rounded-lg hover:bg-[#1f1633] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Simulated Hardware Screen */}
        <div className="flex-1 p-6 overflow-auto bg-[#140e21] flex flex-col items-center justify-center relative">
          <div
            className={`transition-all duration-300 relative rounded-3xl border-8 border-neutral-900 shadow-[0_0_50px_rgba(0,0,0,0.8)] bg-black overflow-hidden flex flex-col ${
              orientation === 'landscape'
                ? 'w-full max-w-2xl aspect-[16/9]'
                : 'w-[320px] aspect-[9/16]'
            }`}
          >
            {/* Top Billboard Status Bar */}
            <div className="px-4 py-2.5 bg-neutral-900/95 border-b border-neutral-800 flex items-center justify-between text-[11px] text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#c2ef4e] shadow-[0_0_8px_#c2ef4e] animate-pulse" />
                <span className="font-bold tracking-tight text-white">CampusCast Display Pro</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                <Clock className="w-3 h-3 text-[#c2ef4e]" />
                <span>1080p &bull; 60 FPS</span>
              </div>
            </div>

            {/* Billboard Screen Canvas */}
            <div
              className={`flex-1 p-6 flex flex-col justify-center items-center text-center transition-colors relative ${
                isEmergency ? 'bg-radial from-rose-900 to-black text-rose-100' : 'bg-neutral-950 text-white'
              }`}
            >
              {isEmergency && (
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-600/40 border border-rose-500 text-rose-200 text-xs font-extrabold uppercase tracking-wider mb-3 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                  <AlertTriangle className="w-4 h-4 text-rose-400" /> Emergency Alert
                </div>
              )}

              <div className="text-[10px] font-mono font-bold tracking-widest uppercase text-neutral-400 mb-2 px-3 py-1 rounded-full bg-neutral-900/80 border border-neutral-800">
                {departmentName} &bull; {PRIORITY_LABEL[priority]}
              </div>

              {displayImage && (
                <div className="mb-3 max-h-[45%] max-w-[85%] rounded-xl overflow-hidden border border-neutral-800 shadow-xl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={displayImage}
                    alt="Billboard Poster"
                    className="w-full h-full object-contain max-h-[160px]"
                  />
                </div>
              )}

              <h1 className="text-lg sm:text-2xl font-extrabold tracking-tight mb-2 line-clamp-2 text-white px-2">
                {title.trim() || 'Untitled Announcement'}
              </h1>

              {body.trim() && (
                <p className="text-xs sm:text-sm text-neutral-300 max-w-md line-clamp-3 whitespace-pre-wrap leading-relaxed px-2 font-normal">
                  {body}
                </p>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-[10px] text-neutral-400 flex justify-between font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c2ef4e]" /> Connected Screen
              </span>
              <span>Sync Cycle: 5s</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[#362d59] bg-[#150f23] flex justify-between items-center">
          <span className="text-xs text-[#8b8496]">Simulating native screen output at scale</span>
          <button
            type="button"
            onClick={onClose}
            className="sentry-btn-lime text-xs cursor-pointer"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  )
}
