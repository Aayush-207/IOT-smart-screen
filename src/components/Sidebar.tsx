import {
  Activity,
  CalendarDays,
  FileText,
  Home,
  Images,
  Monitor,
  QrCode,
  Radio,
  Shield,
} from 'lucide-react';

export type ViewTab =
  | 'overview'
  | 'content'
  | 'schedules'
  | 'devices'
  | 'qr_analytics'
  | 'insights'
  | 'security'
  | 'architecture';

interface SidebarProps {
  activeTab: ViewTab;
  setActiveTab: (tab: ViewTab) => void;
  pendingApprovalCount: number;
  deviceAttentionCount: number;
}

const items = [
  { id: 'overview', label: 'Home', mobileLabel: 'Home', icon: Home },
  { id: 'content', label: 'Posters', mobileLabel: 'Posters', icon: Images },
  { id: 'schedules', label: 'Schedule', mobileLabel: 'Plan', icon: CalendarDays },
  { id: 'devices', label: 'Screens', mobileLabel: 'Screens', icon: Monitor },
  { id: 'qr_analytics', label: 'QR Analytics', mobileLabel: 'QRs', icon: QrCode },
  { id: 'insights', label: 'Health', mobileLabel: 'Health', icon: Activity },
  { id: 'security', label: 'Audit Log', mobileLabel: 'Audit', icon: Shield },
  { id: 'architecture', label: 'Blueprint', mobileLabel: 'Docs', icon: FileText },
] as const;

export function Sidebar({
  activeTab,
  setActiveTab,
  pendingApprovalCount,
  deviceAttentionCount,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] px-3 py-5 md:flex md:flex-col">
        <nav aria-label="Primary navigation" className="space-y-1">
          {items.map(({ id, label, icon: Icon }) => {
            const active = activeTab === id;
            const badge = id === 'content' ? pendingApprovalCount : 0;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as ViewTab)}
                aria-current={active ? 'page' : undefined}
                className={`cc-nav-item ${active ? 'cc-nav-item-active' : ''}`}
              >
                <Icon className="h-[18px] w-[18px]" />
                <span>{label}</span>
                {badge > 0 && (
                  <span className="ml-auto min-w-5 rounded-full bg-[var(--warning-soft)] px-1.5 text-center text-[11px] font-semibold text-[var(--warning)]">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Radio className="h-4 w-4 text-[var(--success)]" />
            Screen Network
          </div>
          <p className="mt-1.5 text-xs leading-5 text-[var(--muted-foreground)]">
            {deviceAttentionCount === 0
              ? 'Delivery is healthy across every enrolled screen.'
              : `${deviceAttentionCount} screen${deviceAttentionCount === 1 ? '' : 's'} need${deviceAttentionCount === 1 ? 's' : ''} attention.`}
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('devices')}
            className="mt-3 text-xs font-semibold text-[var(--accent)] hover:underline"
          >
            View Screen Health
          </button>
        </div>
      </aside>

      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)]/95 p-1.5 shadow-xl backdrop-blur md:hidden"
      >
        {items.map(({ id, mobileLabel, icon: Icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id as ViewTab)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-12 min-w-0 flex-col items-center justify-center gap-1 overflow-hidden rounded-xl text-[9px] font-medium tracking-[-0.02em] ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                  : 'text-[var(--muted-foreground)]'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {mobileLabel}
            </button>
          );
        })}
      </nav>
    </>
  );
}
