'use client'

import { Bell, CheckCircle, XCircle, Info } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export function NotificationsBell({ notifications }: { notifications: any[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [hasUnread, setHasUnread] = useState(notifications.length > 0)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleOpen = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      setHasUnread(false)
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={handleOpen}
        className="p-2 hover:bg-[var(--canvas-inset)] rounded-full relative transition-colors shadow-sm bg-[var(--canvas-elevated)] border border-[var(--hairline)]"
      >
        <Bell className="w-5 h-5 text-[var(--ink)]" />
        {hasUnread && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-rose-500 rounded-full border-2 border-[var(--canvas-elevated)]"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-[var(--canvas-elevated)] border border-[var(--hairline)] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-[var(--hairline)] bg-[var(--canvas-inset)]/50 backdrop-blur-sm flex justify-between items-center">
            <h3 className="font-semibold text-[var(--ink)] text-sm">Notifications</h3>
            <span className="text-xs bg-[var(--ink)] text-[var(--canvas)] px-2 py-0.5 rounded-full font-medium">
              {notifications.length}
            </span>
          </div>
          <div className="max-h-[24rem] overflow-y-auto p-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--mute)]">
                <Bell className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-sm font-medium">No new notifications.</p>
                <p className="text-xs opacity-70 mt-1">You're all caught up!</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className="p-3 mb-2 rounded-lg border border-[var(--hairline)] hover:bg-[var(--canvas-inset)] transition-colors flex gap-3 group">
                  <div className="mt-0.5 shrink-0">
                    {notif.type === 'error' ? (
                      <XCircle className="w-5 h-5 text-rose-500" />
                    ) : notif.type === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <Info className="w-5 h-5 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[var(--ink)] mb-1">
                      {notif.title}
                    </p>
                    <p className="text-xs text-[var(--mute)] mb-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <p className="text-[10px] text-[var(--mute)] font-medium uppercase tracking-wider">
                      {new Date(notif.date).toLocaleString(undefined, { 
                        dateStyle: 'medium', 
                        timeStyle: 'short' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
