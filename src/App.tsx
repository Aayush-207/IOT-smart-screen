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
import { QRScanAnalyticsView } from './components/QRScanAnalyticsView';
import { ScheduleCalendarView } from './components/ScheduleCalendarView';
import { Sidebar, type ViewTab } from './components/Sidebar';
import { TelemetryAnalyticsView } from './components/TelemetryAnalyticsView';
import {
  CLUBS,
  INITIAL_CONTENT,
  INITIAL_DEVICES,
  INITIAL_EVENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_SCAN_EVENTS,
  INITIAL_SCHEDULES,
  MOCK_AUDIT_LOGS,
  MOCK_TELEMETRY,
} from './mockData';
import type {
  AuditLogRecord,
  ContentAsset,
  Device,
  EventItem,
  Registration,
  ScanEvent,
  ScheduleRule,
  TelemetryEvent,
  UserRole,
} from './types';
import {
  accountForRole,
  advanceApproval,
  canApprove,
  eventDisplayWindow,
  rejectApproval,
} from './workflow';

const workspaceKey = 'campuscast-workspace-v11';
const persistedPosterFallback =
  'https://images.unsplash.com/photo-1562774053-701939374585?w=1600&auto=format&fit=crop&q=85';

interface WorkspaceState {
  events: EventItem[];
  devices: Device[];
  contentList: ContentAsset[];
  registrations: Registration[];
  scanEvents: ScanEvent[];
  schedules: ScheduleRule[];
  telemetry: TelemetryEvent[];
}

function loadWorkspace(): WorkspaceState {
  try {
    const stored = JSON.parse(localStorage.getItem(workspaceKey) ?? 'null') as
      | Partial<WorkspaceState>
      | null;
    if (
      stored &&
      Array.isArray(stored.devices) &&
      Array.isArray(stored.contentList) &&
      Array.isArray(stored.schedules)
    ) {
      return {
        events: Array.isArray(stored.events) ? stored.events : INITIAL_EVENTS,
        devices: stored.devices,
        contentList: stored.contentList,
        registrations: Array.isArray(stored.registrations) ? stored.registrations : INITIAL_REGISTRATIONS,
        scanEvents: Array.isArray(stored.scanEvents) ? stored.scanEvents : INITIAL_SCAN_EVENTS,
        schedules: stored.schedules,
        telemetry: Array.isArray(stored.telemetry) ? stored.telemetry : MOCK_TELEMETRY,
      };
    }
  } catch {
    // Ignore storage issues
  }
  return {
    events: INITIAL_EVENTS,
    devices: INITIAL_DEVICES,
    contentList: INITIAL_CONTENT,
    registrations: INITIAL_REGISTRATIONS,
    scanEvents: INITIAL_SCAN_EVENTS,
    schedules: INITIAL_SCHEDULES,
    telemetry: MOCK_TELEMETRY,
  };
}

function initialTheme(): ThemeOption {
  try {
    return localStorage.getItem('campuscast-theme') === 'dark' ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
}

export function App() {
  const kioskDeviceId = new URLSearchParams(window.location.search).get('kiosk');
  const initialWorkspace = useMemo(loadWorkspace, []);
  const [activeTab, setActiveTab] = useState<ViewTab>('overview');
  const [events, setEvents] = useState<EventItem[]>(initialWorkspace.events);
  const [devices, setDevices] = useState<Device[]>(initialWorkspace.devices);
  const [contentList, setContentList] = useState<ContentAsset[]>(initialWorkspace.contentList);
  const [registrations, setRegistrations] = useState<Registration[]>(initialWorkspace.registrations);
  const [scanEvents, setScanEvents] = useState<ScanEvent[]>(initialWorkspace.scanEvents);
  const [schedules, setSchedules] = useState<ScheduleRule[]>(initialWorkspace.schedules);
  const [telemetry, setTelemetry] = useState<TelemetryEvent[]>(initialWorkspace.telemetry);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(MOCK_AUDIT_LOGS);
  const [theme, setTheme] = useState<ThemeOption>(initialTheme);
  const [simulatingDeviceId, setSimulatingDeviceId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createRequest, setCreateRequest] = useState(0);
  const [serverConnected, setServerConnected] = useState(false);
  const [currentRole, setCurrentRole] = useState<UserRole>('DESIGN_LEAD');
  const [currentClubId, setCurrentClubId] = useState(CLUBS[0].id);
  const restartTimers = useRef<number[]>([]);

  const currentClub = CLUBS.find((club) => club.id === currentClubId) ?? CLUBS[0];
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
    (content) => content.status.startsWith('pending_') || content.status === 'escalated_admin',
  ).length;

  const deviceAttentionCount = devices.filter(
    (device) => device.status !== 'ONLINE',
  ).length;

  const attentionCount = pendingApprovals + deviceAttentionCount;
  const activeSimDevice = devices.find((device) => device.id === simulatingDeviceId) ?? devices[0];

  useEffect(() => {
    const controller = new AbortController();
    void fetch('/v1/bootstrap', {
      headers: { accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
          return;
        }
        const data = (await response.json()) as Partial<WorkspaceState>;
        if (
          Array.isArray(data.events) &&
          Array.isArray(data.devices) &&
          Array.isArray(data.contentList)
        ) {
          setEvents(data.events);
          setDevices(data.devices);
          setContentList(data.contentList);
          if (Array.isArray(data.registrations)) setRegistrations(data.registrations);
          if (Array.isArray(data.scanEvents)) setScanEvents(data.scanEvents);
          if (Array.isArray(data.schedules)) setSchedules(data.schedules);
          setServerConnected(true);
        }
      })
      .catch(() => {
        // Fallback to local state
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem('campuscast-theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem(
        workspaceKey,
        JSON.stringify({ events, devices, contentList, registrations, scanEvents, schedules }),
      );
    } catch {
      // Ignore
    }
  }, [events, devices, contentList, registrations, scanEvents, schedules]);

  useEffect(
    () => () => {
      restartTimers.current.forEach(window.clearTimeout);
    },
    [],
  );

  const openComposer = () => {
    setActiveTab('content');
    if (currentRole === 'DESIGN_LEAD') {
      setCreateRequest((value) => value + 1);
    }
  };

  const syncToServer = (path: string, method: 'POST' | 'PATCH' | 'PUT', body?: unknown) => {
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

    let updated: ContentAsset;
    try {
      updated = advanceApproval(asset, currentRole, currentUserName);
    } catch {
      return;
    }

    setContentList((items) =>
      items.map((content) => (content.id === id ? updated : content)),
    );
    syncToServer(`/v1/content/${encodeURIComponent(id)}/approve`, 'POST', {
      role: currentRole,
      actorName: currentUserName,
    });
  };

  const handleRejectContent = (id: string, reason: string) => {
    const asset = contentList.find((content) => content.id === id);
    if (!asset) return;

    const updated = rejectApproval(asset, currentRole, currentUserName, reason);
    setContentList((items) =>
      items.map((content) => (content.id === id ? updated : content)),
    );
    syncToServer(`/v1/content/${encodeURIComponent(id)}/reject`, 'POST', {
      role: currentRole,
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
                appVersion: 'v2.4.1-kiosk',
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
      // Ignore
    }
    syncToServer('/v1/reset', 'POST');
    setEvents(INITIAL_EVENTS);
    setDevices(INITIAL_DEVICES);
    setContentList(INITIAL_CONTENT);
    setRegistrations(INITIAL_REGISTRATIONS);
    setScanEvents(INITIAL_SCAN_EVENTS);
    setSchedules(INITIAL_SCHEDULES);
    setActiveTab('overview');
    setSimulatingDeviceId(null);
    setCurrentRole('DESIGN_LEAD');
    setCurrentClubId(CLUBS[0].id);
  };

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
        onAttention={() => setActiveTab(pendingApprovals > 0 ? 'content' : 'devices')}
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
                onOpenKioskSim={(id) => setSimulatingDeviceId(id ?? devices[0]?.id ?? null)}
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
                  syncToServer('/v1/content', 'POST', asset);
                }}
                onAdvanceApproval={(id) => advanceContentApproval(id)}
                onRejectContent={(id, reason) => handleRejectContent(id, reason)}
                createRequest={createRequest}
              />
            )}
            {activeTab === 'schedules' && (
              <ScheduleCalendarView
                schedules={schedules}
                contentList={contentList}
                events={events}
                currentRole={currentRole}
                currentUserName={currentUserName}
                onAddSchedule={(schedule) => {
                  setSchedules((items) => [schedule, ...items]);
                  logAuditEvent(
                    'CREATE_SCHEDULE',
                    'SCHEDULE_RULE',
                    schedule.id,
                    `Created broadcast "${schedule.title}".`,
                  );
                  syncToServer('/v1/schedules', 'POST', schedule);
                }}
                onUpdateSchedule={(id, status) => {
                  setSchedules((items) =>
                    items.map((s) => (s.id === id ? { ...s, status } : s)),
                  );
                  syncToServer(`/v1/schedules/${encodeURIComponent(id)}`, 'PATCH', { status });
                }}
              />
            )}
            {activeTab === 'qr_analytics' && (
              <QRScanAnalyticsView
                registrations={registrations}
                scanEvents={scanEvents}
                devices={devices}
              />
            )}
            {activeTab === 'devices' && (
              <DeviceManagementView
                devices={devices}
                contentList={contentList}
                onOpenKioskSim={setSimulatingDeviceId}
                onRestartDevice={restartDevice}
                onUpdateDevice={updateDevice}
                onAddDevice={(device) => {
                  setDevices((items) => [device, ...items]);
                  syncToServer('/v1/devices', 'POST', device);
                }}
              />
            )}
            {activeTab === 'insights' && (
              <TelemetryAnalyticsView telemetry={telemetry} devices={devices} />
            )}
            {activeTab === 'security' && <AuditLogView logs={auditLogs} />}
            {activeTab === 'architecture' && <ArchitectureView />}
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
    </div>
  );
}

export default App;
