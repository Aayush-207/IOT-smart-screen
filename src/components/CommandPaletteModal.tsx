import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Tv, 
  Radio, 
  Calendar, 
  ImageIcon, 
  BarChart3, 
  Shield, 
  FileText, 
  ArrowRight
} from 'lucide-react';
import { ViewTab } from './Sidebar';
import { Device, ContentAsset } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: ViewTab) => void;
  onOpenKioskSim: (deviceId?: string) => void;
  devices: Device[];
  contentList: ContentAsset[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onOpenKioskSim,
  devices,
  contentList
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          setQuery('');
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter commands
  const navigationItems = [
    { label: 'Overview & Fleet Metrics', tab: 'overview' as ViewTab, icon: Search },
    { label: 'Fleet Devices & Kiosks', tab: 'devices' as ViewTab, icon: Tv },
    { label: 'Content Upload & Approvals', tab: 'content' as ViewTab, icon: ImageIcon },
    { label: 'Schedules & Manifest Rules', tab: 'schedules' as ViewTab, icon: Calendar },
    { label: 'Telemetry & Analytics', tab: 'telemetry' as ViewTab, icon: BarChart3 },
    { label: 'Security & Audit Logs', tab: 'security' as ViewTab, icon: Shield },
    { label: 'Architecture & System Blueprint', tab: 'architecture' as ViewTab, icon: FileText },
  ].filter(i => i.label.toLowerCase().includes(query.toLowerCase()));

  const filteredDevices = devices.filter(d => 
    d.displayName.toLowerCase().includes(query.toLowerCase()) || 
    d.location.building.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl animate-fade-in">
        {/* Search Header */}
        <div className="relative p-4 border-b border-[var(--border)] flex items-center gap-3">
          <Search className="h-5 w-5 text-[var(--accent)] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command or search devices, schedules, views... (ESC to close)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-[var(--foreground)] text-sm font-sans focus:outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono text-[var(--muted-foreground)] bg-[var(--surface-raised)] rounded border border-[var(--border)]">
            ESC
          </kbd>
        </div>

        {/* Command List */}
        <div className="p-2 max-h-96 overflow-y-auto space-y-4 text-xs">
          {/* Quick System Actions */}
          <div className="space-y-1">
            <div className="px-3 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
              Quick System Actions
            </div>
            <button
              onClick={() => {
                onOpenKioskSim();
                onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-md hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="h-4 w-4 text-[var(--accent)]" />
                <span className="font-medium">Launch Interactive Screen Simulator</span>
              </div>
              <span className="cc-status cc-status-neutral text-[10px]">Action</span>
            </button>
          </div>

          {/* Navigation Commands */}
          {navigationItems.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Module Navigation
              </div>
              {navigationItems.map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    onNavigateTab(item.tab);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 text-[var(--muted-foreground)]" />
                    <span>{item.label}</span>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--muted-foreground)]" />
                </button>
              ))}
            </div>
          )}

          {/* Display Kiosk Search Results */}
          {filteredDevices.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 py-1 text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider">
                Matching Campus Kiosks
              </div>
              {filteredDevices.slice(0, 4).map((dev) => (
                <button
                  key={dev.id}
                  onClick={() => {
                    onOpenKioskSim(dev.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md hover:bg-[var(--surface-raised)] text-[var(--foreground)] transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Tv className="h-4 w-4 text-[var(--accent)]" />
                    <div>
                      <span className="font-semibold">{dev.displayName}</span>
                      <span className="text-[11px] text-[var(--muted-foreground)] ml-2">({dev.location.building})</span>
                    </div>
                  </div>
                  <span className="cc-status cc-status-success text-[10px]">{dev.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[var(--muted)] border-t border-[var(--border)] flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
          <span>Tip: Press <kbd className="px-1.5 py-0.5 bg-[var(--card)] rounded border border-[var(--border)] font-mono text-[10px]">⌘K</kbd> anytime for Command Search</span>
          <span>CampusCast Platform</span>
        </div>
      </div>
    </div>
  );
};
