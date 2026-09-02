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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[var(--hairline)] flex items-center justify-between bg-[var(--canvas)]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--canvas-inset)] border border-[var(--hairline)]">
              <Monitor className="w-5 h-5 text-[var(--ink)]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--ink)]">Billboard Screen Simulator</h2>
              <p className="text-xs text-[var(--mute)]">Real-time preview of how your announcement renders on campus screens</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Orientation toggles */}
            <div className="flex bg-[var(--canvas-inset)] p-1 rounded-lg border border-[var(--hairline)] text-xs font-medium">
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  orientation === 'landscape'
                    ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" /> 16:9 Landscape
              </button>
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all ${
                  orientation === 'portrait'
                    ? 'bg-[var(--canvas-elevated)] text-[var(--ink)] shadow-sm'
                    : 'text-[var(--mute)] hover:text-[var(--ink)]'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" /> 9:16 Portrait
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-[var(--mute)] hover:text-[var(--ink)] rounded-lg hover:bg-[var(--canvas-inset)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Simulated Hardware Screen */}
        <div className="flex-1 p-6 overflow-auto bg-[var(--canvas-inset)] flex flex-col items-center justify-center relative">
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
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" />
                <span className="font-bold tracking-tight text-neutral-200">CampusCast Signage Pro</span>
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[10px] text-neutral-400">
                <Clock className="w-3 h-3 text-[#38bdf8]" />
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
                <p className="text-xs sm:text-sm text-neutral-300 max-w-md line-clamp-3 whitespace-pre-wrap leading-relaxed px-2">
                  {body}
                </p>
              )}
            </div>

            {/* Bottom Footer Info */}
            <div className="px-4 py-2 bg-neutral-900 border-t border-neutral-800 text-[10px] text-neutral-400 flex justify-between font-mono">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> IoT Connected
              </span>
              <span>Sync Cycle: 5s</span>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-[var(--hairline)] bg-[var(--canvas)] flex justify-between items-center">
          <span className="text-xs text-[var(--mute)]">Simulating direct hardware output at Native Aspect Ratio</span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[var(--ink)] text-[var(--canvas)] text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
          >
            Done Previewing
          </button>
        </div>
      </div>
    </div>
  )
}
