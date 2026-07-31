import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';

import { ArchitectureView } from './components/ArchitectureView';
import { AuditLogView } from './components/AuditLogView';
import { ContentApprovalView } from './components/ContentApprovalView';
import { DeviceManagementView } from './components/DeviceManagementView';
import { KioskSimulatorModal } from './components/KioskSimulatorModal';
import { KioskPlayer } from './components/KioskPlayer';
import { Navbar, type ThemeOption } from './components/Navbar';
import { OverviewView } from './components/OverviewView';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { Sidebar, type ViewTab } from './components/Sidebar';
import { TelemetryAnalyticsView } from './components/TelemetryAnalyticsView';
import {
  CLUBS,
  INITIAL_CONTENT,
  INITIAL_DEVICES,
  INITIAL_SCHEDULES,
  MOCK_AUDIT_LOGS,
  MOCK_TELEMETRY,
} from './mockData';
import type {
  AuditLogRecord,
  ContentAsset,
  Device,
  ScheduleRule,
  TelemetryEvent,
  UserRole,
} from './types';
import {
  accountForRole,
  advanceApproval,
  canApprove,
  eventDisplayWindow,
} from './workflow';

const workspaceKey = 'campuscast-workspace-v10';
const persistedPosterFallback =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

interface WorkspaceState {
  devices: Device[];
  contentList: ContentAsset[];
  schedules: ScheduleRule[];
  telemetry: TelemetryEvent[];
}

const legacyMockIds = new Set([
  'dev_tech_f1_01',
  'dev_lib_f2_02',
  'dev_hostel_b_01',
  'dev_auditorium_01',
  'cnt_techfest_2026',
  'cnt_convocation_2026',
  'cnt_lib_schedule_q3',
  'cnt_cyber_sec_workshop',
  'cnt_emergency_heatwave',
  'sch_techfest_01',
  'sch_convocation_02',
  'sch_emergency_alert',
]);

function loadWorkspace(): WorkspaceState {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('campuscast-workspace') && key !== workspaceKey) {
        localStorage.removeItem(key);
      }
    }
    const stored = JSON.parse(localStorage.getItem(workspaceKey) ?? 'null') as
      | Partial<WorkspaceState>
      | null;
    if (
      stored &&
      Array.isArray(stored.devices) &&
      Array.isArray(stored.contentList) &&
      Array.isArray(stored.schedules)
    ) {
      const cleanDevices = stored.devices.filter((d) => !legacyMockIds.has(d.id));
      const cleanContent = stored.contentList.filter((c) => !legacyMockIds.has(c.id));
      const cleanSchedules = stored.schedules.filter((s) => !legacyMockIds.has(s.id));
      const cleanTelemetry = Array.isArray(stored.telemetry) ? stored.telemetry : [];
      return {
        devices: cleanDevices,
        contentList: cleanContent,
        schedules: cleanSchedules,
        telemetry: cleanTelemetry,
      };
    }
  } catch {
    try {
      localStorage.removeItem(workspaceKey);
    } catch {
      // Ignore unavailable browser storage and use the built-in workspace.
    }
  }
  return {
    devices: [],
    contentList: [],
    schedules: [],
    telemetry: [],
  };
}

function initialTheme(): ThemeOption {
  try {
    return localStorage.getItem('campuscast-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function App() {
  const kioskDeviceId = new URLSearchParams(window.location.search).get('kiosk');
  const initialWorkspace = useMemo(loadWorkspace, []);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [devices, setDevices] = useState<Device[]>(initialWorkspace.devices);
  const [contentList, setContentList] = useState<ContentAsset[]>(
    initialWorkspace.contentList,
  );
  const [schedules, setSchedules] = useState<ScheduleRule[]>(
    initialWorkspace.schedules,
  );
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>(
    initialWorkspace.telemetry,
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(MOCK_AUDIT_LOGS);
  const [theme, setTheme] = useState<ThemeOption>(initialTheme);
  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | null>(
    null,
  );
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createRequest, setCreateRequest] = useState(0);
  const [serverConnected, setServerConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('DESIGN_LEAD');
  const [currentClubId, setCurrentClubId] = useState(CLUBS[0].id);
  const restartTimers = useRef<number[]>([]);

  const currentClub =
    CLUBS.find((club) => club.id === currentClubId) ?? CLUBS[0];
  const currentUserName = accountForRole(currentClub, currentRole);

  const logAuditEvent = (
    action: string,
    resource: string,
    resourceId: string,
    details: string,
  ) => {
    const record: AuditLogRecord = {
      id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      organizationId: 'org_mit_adt',
      actor: currentUserName,
      action,
      resource,
      resourceId,
      timestamp: new Date().toISOString(),
      ipAddress: '192.168.1.100',
      details,
    };
    setAuditLogs((items) => [record, ...items]);
  };
  const pendingApprovals = contentList.filter(
    (content) => content.status === 'PENDING_APPROVAL',
  ).length;
  const deviceAttentionCount = devices.filter(
    (device) => device.status !== 'ONLINE',
  ).length;
  const attentionCount = pendingApprovals + deviceAttentionCount;
  const activeSimDevice =
    devices.find((device) => device.id === simulatingDeviceId) ?? devices[0];

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/v1/bootstrap', {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (
          !response.ok ||
          !response.headers.get('content-type')?.includes('application/json')
        ) {
          return;
        }
        const data = (await response.json()) as Partial<WorkspaceState>;
        if (
          Array.isArray(data.devices) &&
          Array.isArray(data.contentList) &&
          Array.isArray(data.schedules)
        ) {
          setDevices(data.devices);
          setContentList(data.contentList);
          setSchedules(data.schedules);
          setServerConnected(true);
        }
      })
      .catch(() => {
        // The standalone dashboard intentionally falls back to browser storage.
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('campuscast-theme', theme);
    } catch {
      // Theme persistence is optional when browser storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    const safeContent = contentList.map((content) =>
      content.mediaUrl.startsWith('blob:')
        ? { ...content, mediaUrl: persistedPosterFallback }
        : content,
    );
    try {
      localStorage.setItem(
        workspaceKey,
        JSON.stringify({ devices, contentList: safeContent, schedules }),
      );
    } catch {
      // The active session remains usable if storage is full or blocked.
    }
  }, [contentList, devices, schedules]);

  useEffect(
    () => () => {
      restartTimers.current.forEach(window.clearTimeout);
    },
    [],
  );

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', openSearch);
    return () => window.removeEventListener('keydown', openSearch);
  }, []);

  const searchResults = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];
    return [
      ...contentList
        .filter(
          (content) =>
            content.title.toLowerCase().includes(query) ||
            content.category.toLowerCase().includes(query),
        )
        .slice(0, 4)
        .map((content) => ({
          id: content.id,
          title: content.title,
          description: 'Content',
          action: () => setActiveTab('content' as const),
        })),
      ...devices
        .filter(
          (device) =>
            device.displayName.toLowerCase().includes(query) ||
            device.location.building.toLowerCase().includes(query),
        )
        .slice(0, 4)
        .map((device) => ({
          id: device.id,
          title: device.displayName,
          description: `Screen · ${device.location.building}`,
          action: () => {
            setActiveTab('devices');
            setSimulatingDeviceId(device.id);
          },
        })),
    ];
  }, [contentList, devices, search]);

  const openComposer = () => {
    setActiveTab('content');
    if (currentRole === 'DESIGN_LEAD') {
      setCreateRequest((value) => value + 1);
    }
  };

  const syncToServer = (path: string, method: 'POST' | 'PATCH', body?: unknown) => {
    if (!serverConnected) return;
    void fetch(path, {
      method,
      headers: { 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }).catch(() => setServerConnected(false));
  };

  const advanceContentApproval = (id: string) => {
    const asset = contentList.find((content) => content.id === id);
    if (!asset) return;

    let approved: ContentAsset;
    try {
      approved = advanceApproval(
        asset,
        currentRole,
        currentClubId,
        currentUserName,
      );
    } catch {
      return;
    }

    setContentList((items) =>
      items.map((content) => (content.id === id ? approved : content)),
    );
    syncToServer(`/v1/content/${encodeURIComponent(id)}/approve`, 'POST', {
      role: currentRole,
      clubId: currentClubId,
      actorName: currentUserName,
    });

    if (approved.status !== 'APPROVED' || !approved.eventDate) return;
    const window = eventDisplayWindow(approved.eventDate);
    const active = new Date(window.effectiveStart) <= new Date();
    const schedule: ScheduleRule = {
      id: `sch_event_${approved.id}`,
      organizationId: 'org_mit_adt',
      title: `${approved.title} · 21-day event campaign`,
      contentId: approved.id,
      targetType: 'CAMPUS',
      targetId: 'mit_adt_main',
      targetName: 'All campus screens',
      startTime: window.effectiveStart,
      endTime: window.endTime,
      priority: 10,
      createdBy: currentUserName,
      status: active ? 'ACTIVE' : 'SCHEDULED',
    };
    setSchedules((items) => [
      schedule,
      ...items.filter((item) => item.id !== schedule.id),
    ]);
    syncToServer('/v1/schedules', 'POST', schedule);
    if (active) {
      setDevices((items) =>
        items.map((device) =>
          device.status === 'ONLINE'
            ? { ...device, activeContentId: approved.id }
            : device,
        ),
      );
    }
  };

  const rejectContent = (id: string, reason: string) => {
    const asset = contentList.find((content) => content.id === id);
    if (!asset || !canApprove(asset, currentRole, currentClubId)) return;
    const rejected: ContentAsset = {
      ...asset,
      status: 'REJECTED',
      approvalStage: 'REJECTED',
      rejectionReason: reason,
      approvalHistory: [
        ...(asset.approvalHistory ?? []),
        {
          stage: currentRole,
          actorName: currentUserName,
          action: 'REJECTED',
          timestamp: new Date().toISOString(),
          note: reason,
        },
      ],
    };
    setContentList((items) =>
      items.map((content) => (content.id === id ? rejected : content)),
    );
    syncToServer(`/v1/content/${encodeURIComponent(id)}/reject`, 'POST', {
      role: currentRole,
      clubId: currentClubId,
      actorName: currentUserName,
      reason,
    });
  };

  const restartDevice = (id: string) => {
    setDevices((items) =>
      items.map((device) =>
        device.id === id ? { ...device, status: 'MAINTENANCE' } : device,
      ),
    );
    syncToServer(`/v1/devices/${encodeURIComponent(id)}/restart`, 'POST');
    const timer = window.setTimeout(() => {
      setDevices((items) =>
        items.map((device) =>
          device.id === id
            ? {
              ...device,
              status: 'ONLINE',
              lastHeartbeatAt: new Date().toISOString(),
            }
            : device,
        ),
      );
    }, 1_500);
    restartTimers.current.push(timer);
  };

  const updateDevice = (id: string) => {
    setDevices((items) =>
      items.map((device) =>
        device.id === id ? { ...device, status: 'MAINTENANCE' } : device,
      ),
    );
    syncToServer(`/v1/devices/${encodeURIComponent(id)}/update`, 'POST');
    const timer = window.setTimeout(() => {
      setDevices((items) =>
        items.map((device) =>
          device.id === id
            ? {
              ...device,
              status: 'ONLINE',
              appVersion: 'v2.1.0-kiosk',
              lastHeartbeatAt: new Date().toISOString(),
            }
            : device,
        ),
      );
    }, 1_500);
    restartTimers.current.push(timer);
  };

  const resetWorkspace = () => {
    try {
      localStorage.removeItem(workspaceKey);
    } catch {
      // Resetting the active session does not depend on browser storage.
    }
    syncToServer('/v1/reset', 'POST');
    setDevices(INITIAL_DEVICES);
    setContentList(INITIAL_CONTENT);
    setSchedules(INITIAL_SCHEDULES);
    setActiveTab('overview');
    setSimulatingDeviceId(null);
    setCurrentRole('DESIGN_LEAD');
    setCurrentClubId(CLUBS[0].id);
  };

  const openAttention = () =>
    setActiveTab(pendingApprovals > 0 ? 'content' : 'devices');

  if (kioskDeviceId) {
    return <KioskPlayer deviceId={kioskDeviceId} />;
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <Navbar
        activeNotificationCount={attentionCount}
        currentTheme={theme}
        onThemeChange={setTheme}
        onCreate={openComposer}
        onSearch={() => setSearchOpen(true)}
        onAttention={openAttention}
        onResetWorkspace={resetWorkspace}
        clubs={CLUBS}
        currentRole={currentRole}
        currentClubId={currentClubId}
        currentUserName={currentUserName}
        onRoleChange={setCurrentRole}
        onClubChange={setCurrentClubId}
      />
      <div className="flex min-h-[calc(100vh-64px)]">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingApprovalCount={pendingApprovals}
          deviceAttentionCount={deviceAttentionCount}
        />
        <main className="min-w-0 flex-1 overflow-y-auto px-4 pb-24 pt-6 sm:px-6 lg:px-8 md:pb-8">
          <div className="mx-auto max-w-[1240px]">
            {activeTab === 'overview' && (
              <OverviewView
                devices={devices}
                contentList={contentList}
                schedules={schedules}
                telemetry={telemetry}
                onOpenKioskSim={(id) =>
                  setSimulatingDeviceId(id ?? devices[0]?.id ?? null)
                }
                onNavigateTab={setActiveTab}
                onCreateContent={openComposer}
                currentUserName={currentUserName}
                canCreateContent={currentRole === 'DESIGN_LEAD'}
              />
            )}
            {activeTab === 'content' && (
              <ContentApprovalView
                contentList={contentList}
                clubs={CLUBS}
                currentRole={currentRole}
                currentClubId={currentClubId}
                currentUserName={currentUserName}
                onAddContent={(asset) => {
                  setContentList((items) => [asset, ...items]);
                  logAuditEvent(
                    'SUBMIT_CONTENT',
                    'CONTENT_ASSET',
                    asset.id,
                    `Submitted poster "${asset.title}" for club approval.`,
                  );
                  syncToServer('/v1/content', 'POST', {
                    ...asset,
                    mediaUrl: asset.mediaUrl.startsWith('blob:')
                      ? persistedPosterFallback
                      : asset.mediaUrl,
                  });
                }}
                onAdvanceApproval={(id) => {
                  const asset = contentList.find((c) => c.id === id);
                  advanceContentApproval(id);
                  if (asset) {
                    logAuditEvent(
                      'APPROVE_CONTENT',
                      'CONTENT_ASSET',
                      id,
                      `Approved poster "${asset.title}" as ${currentRole}.`,
                    );
                  }
                }}
                onRejectContent={(id, reason) => {
                  const asset = contentList.find((c) => c.id === id);
                  rejectContent(id, reason);
                  if (asset) {
                    logAuditEvent(
                      'REJECT_CONTENT',
                      'CONTENT_ASSET',
                      id,
                      `Requested changes on "${asset.title}": ${reason}`,
                    );
                  }
                }}
                createRequest={createRequest}
              />
            )}
            {activeTab === 'schedules' && (
              <ScheduleCalendarView
                schedules={schedules}
                contentList={contentList}
                currentRole={currentRole}
                currentUserName={currentUserName}
                onAddSchedule={(schedule) => {
                  setSchedules((items) => [schedule, ...items]);
                  logAuditEvent(
                    'CREATE_SCHEDULE',
                    'SCHEDULE_RULE',
                    schedule.id,
                    `Created broadcast "${schedule.title}" for ${schedule.targetName}.`,
                  );
                  syncToServer('/v1/schedules', 'POST', schedule);
                }}
                onUpdateSchedule={(id, status) => {
                  setSchedules((items) =>
                    items.map((schedule) =>
                      schedule.id === id ? { ...schedule, status } : schedule,
                    ),
                  );
                  logAuditEvent(
                    'UPDATE_SCHEDULE',
                    'SCHEDULE_RULE',
                    id,
                    `Updated broadcast status to ${status}.`,
                  );
                  syncToServer(
                    `/v1/schedules/${encodeURIComponent(id)}`,
                    'PATCH',
                    { status },
                  );
                }}
              />
            )}
            {activeTab === 'devices' && (
              <DeviceManagementView
                devices={devices}
                contentList={contentList}
                onOpenKioskSim={setSimulatingDeviceId}
                onRestartDevice={(id) => {
                  restartDevice(id);
                  logAuditEvent(
                    'RESTART_DEVICE',
                    'IOT_THING',
                    id,
                    `Requested app restart on smart screen ${id}.`,
                  );
                }}
                onUpdateDevice={(id) => {
                  updateDevice(id);
                  logAuditEvent(
                    'UPDATE_DEVICE',
                    'IOT_THING',
                    id,
                    `Dispatched OTA software update to screen ${id}.`,
                  );
                }}
                onAddDevice={(device) => {
                  setDevices((items) => [device, ...items]);
                  logAuditEvent(
                    'REGISTER_DEVICE',
                    'IOT_THING',
                    device.id,
                    `Enrolled new smart screen "${device.displayName}" in ${device.location.building}.`,
                  );
                  syncToServer('/v1/devices', 'POST', device);
                }}
              />
            )}
            {activeTab === 'insights' && (
              <TelemetryAnalyticsView
                telemetry={telemetry}
                devices={devices}
              />
            )}
            {activeTab === 'security' && (
              <AuditLogView logs={auditLogs} />
            )}
            {activeTab === 'architecture' && (
              <ArchitectureView />
            )}
          </div>
        </main>
      </div>

      {simulatingDeviceId && activeSimDevice && (
        <KioskSimulatorModal
          device={activeSimDevice}
          contentList={contentList}
          onClose={() => setSimulatingDeviceId(null)}
        />
      )}

      {searchOpen && (
        <div
          className="cc-overlay items-start pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Search CampusCast"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSearchOpen(false);
          }}
        >
          <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
            <label className="flex h-14 items-center gap-3 border-b border-[var(--border)] px-4">
              <Search className="h-4 w-4 text-[var(--muted-foreground)]" />
              <span className="sr-only">Search</span>
              <input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search content or screens"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--muted-foreground)]"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="cc-icon-button"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </label>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {search.trim() && searchResults.length === 0 && (
                <p className="px-3 py-8 text-center text-sm text-[var(--muted-foreground)]">
                  No matching content or screens.
                </p>
              )}
              {!search.trim() && (
                <div className="px-3 py-6 text-center">
                  <p className="text-sm font-medium">Find anything quickly</p>
                  <p className="mt-1 text-xs text-[var(--muted-foreground)]">
                    Try a poster title, category, building, or screen name.
                  </p>
                </div>
              )}
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.id}
                  onClick={() => {
                    result.action();
                    setSearchOpen(false);
                    setSearch('');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left hover:bg-[var(--surface-raised)]"
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--surface-raised)]">
                    <Search className="h-3.5 w-3.5" />
                  </span>
                  <span>
                    <strong className="block text-sm font-medium">{result.title}</strong>
                    <small className="text-xs text-[var(--muted-foreground)]">
                      {result.description}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
