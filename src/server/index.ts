import {
  createReadStream,
  existsSync,
  mkdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import http, { type IncomingMessage, type ServerResponse } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  INITIAL_CONTENT,
  INITIAL_DEVICES,
  INITIAL_EVENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_SCAN_EVENTS,
  INITIAL_SCHEDULES,
  MOCK_AUDIT_LOGS,
  MOCK_TELEMETRY,
  SYNCHRONIZED_MASTER_MANIFEST,
} from '../mockData';
import type {
  ApprovalStep,
  AuditLogRecord,
  ContentAsset,
  Device,
  EventItem,
  Registration,
  ScanEvent,
  ScheduleRule,
  SynchronizedMasterManifest,
  TelemetryEvent,
  UserRole,
} from '../types';
import {
  advanceApproval,
  calculateProposedPosterDueDate,
  canApprove,
  evaluateWorkflowDeadlineStatus,
  generateShortRedirectCode,
  handlePostApprovalEdit,
  rejectApproval,
} from '../workflow';

const requestedPort = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(requestedPort) || requestedPort < 1 || requestedPort > 65_535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}
const port = requestedPort;
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const distDirectory = path.join(projectRoot, 'dist');
const dataFile = path.resolve(
  process.env.CAMPUSCAST_DATA_FILE ?? path.join(projectRoot, '.data', 'campuscast.json'),
);
const allowedScheduleStatuses = new Set<ScheduleRule['status']>([
  'ACTIVE',
  'SCHEDULED',
  'PAUSED',
  'CANCELLED',
  'EXPIRED',
  'OVERRIDDEN',
]);
const allowedRoles = new Set<UserRole>([
  'DESIGN_LEAD',
  'PRESIDENT',
  'CLUB_HOD',
  'ADMIN',
  'COLLEGE_REP',
  'VIEWER',
]);

interface PersistentState {
  events: EventItem[];
  contentList: ContentAsset[];
  devices: Device[];
  registrations: Registration[];
  scanEvents: ScanEvent[];
  schedules: ScheduleRule[];
  telemetry: TelemetryEvent[];
  auditLogs: AuditLogRecord[];
}

function initialState(): PersistentState {
  return {
    events: INITIAL_EVENTS,
    contentList: INITIAL_CONTENT,
    devices: INITIAL_DEVICES,
    registrations: INITIAL_REGISTRATIONS,
    scanEvents: INITIAL_SCAN_EVENTS,
    schedules: INITIAL_SCHEDULES,
    telemetry: MOCK_TELEMETRY,
    auditLogs: MOCK_AUDIT_LOGS,
  };
}

function loadState(): PersistentState {
  try {
    const value = JSON.parse(readFileSync(dataFile, 'utf8')) as Partial<PersistentState>;
    if (
      Array.isArray(value.events) &&
      Array.isArray(value.contentList) &&
      Array.isArray(value.devices) &&
      Array.isArray(value.registrations) &&
      Array.isArray(value.scanEvents) &&
      Array.isArray(value.schedules)
    ) {
      return value as PersistentState;
    }
  } catch {
    // First run or invalid data: start from initial state
  }
  return initialState();
}

let state = loadState();
let { events, contentList, devices, registrations, scanEvents, schedules, telemetry, auditLogs } = state;

function persistState(): void {
  state = { events, contentList, devices, registrations, scanEvents, schedules, telemetry, auditLogs };
  mkdirSync(path.dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf8');
}

export function resetLocalState(): void {
  ({ events, contentList, devices, registrations, scanEvents, schedules, telemetry, auditLogs } = initialState());
  persistState();
}

function sendJson(
  response: ServerResponse,
  status: number,
  body: unknown,
): void {
  response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body));
}

async function readJson(request: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > 1_000_000) throw new Error('Request body exceeds 1 MB');
    chunks.push(buffer);
  }
  if (!chunks.length) return {};
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function handleApi(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  // 1. Stateless QR Redirect Endpoint: /r/:shortCode
  if (url.pathname.startsWith('/r/')) {
    const shortCode = url.pathname.slice(3);
    const deviceId = url.searchParams.get('device_id') || undefined;
    const reg = registrations.find((r) => r.shortCode === shortCode);

    if (!reg) {
      sendJson(response, 404, { error: 'Invalid registration redirect code.' });
      return true;
    }

    // Log scan event
    const device = devices.find((d) => d.id === deviceId);
    const newScan: ScanEvent = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      registrationId: reg.id,
      eventId: reg.eventId,
      eventTitle: reg.eventTitle,
      deviceId,
      deviceName: device ? device.displayName : undefined,
      scannedAt: new Date().toISOString(),
      userAgent: request.headers['user-agent'] || 'Unknown User-Agent',
    };
    scanEvents = [newScan, ...scanEvents];
    reg.totalScans = (reg.totalScans || 0) + 1;
    persistState();

    // Perform HTTP 302 Redirect to destination
    response.writeHead(302, { Location: reg.externalUrl });
    response.end();
    return true;
  }

  if (!url.pathname.startsWith('/v1/') && url.pathname !== '/health') return false;

  // Health check
  if (
    request.method === 'GET' &&
    (url.pathname === '/health' || url.pathname === '/v1/health')
  ) {
    sendJson(response, 200, {
      status: 'ok',
      service: 'campuscast-iot-master-backend',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  // Bootstrap data for dashboard client
  if (request.method === 'GET' && url.pathname === '/v1/bootstrap') {
    // Refresh deadline status of all assets
    contentList = contentList.map((item) => evaluateWorkflowDeadlineStatus(item));
    sendJson(response, 200, {
      events,
      contentList,
      devices,
      registrations,
      scanEvents,
      schedules,
      telemetry,
      auditLogs,
      masterManifestVersion: SYNCHRONIZED_MASTER_MANIFEST.manifestVersion,
    });
    return true;
  }

  // Events API
  if (request.method === 'GET' && url.pathname === '/v1/events') {
    sendJson(response, 200, { items: events });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/events') {
    const input = (await readJson(request)) as Partial<EventItem>;
    if (!input.title || !input.eventDate || !input.clubId) {
      sendJson(response, 422, { error: 'Event title, date, and clubId are required.' });
      return true;
    }

    const posterDueAt = calculateProposedPosterDueDate(input.eventDate);
    const newEvent: EventItem = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: 'org_mit_adt',
      clubId: input.clubId,
      clubName: input.clubName || 'Student Club',
      title: input.title,
      description: input.description || '',
      eventDate: input.eventDate,
      venue: input.venue || 'Campus Main Foyer',
      status: 'design_in_progress',
      posterDueAt,
      expectedUploadAt: input.expectedUploadAt || posterDueAt,
      designProgress: input.designProgress || 0,
      dueDateReason: input.dueDateReason,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    events = [newEvent, ...events];
    persistState();
    sendJson(response, 201, newEvent);
    return true;
  }

  // Content Assets API
  if (request.method === 'GET' && url.pathname === '/v1/content') {
    contentList = contentList.map((item) => evaluateWorkflowDeadlineStatus(item));
    sendJson(response, 200, { items: contentList });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/content') {
    const input = (await readJson(request)) as Partial<ContentAsset>;
    if (!input.title || !input.mediaUrl || !input.eventId) {
      sendJson(response, 422, { error: 'Poster title, media URL, and event ID are required.' });
      return true;
    }

    const event = events.find((e) => e.id === input.eventId);
    const eventDate = event ? event.eventDate : input.eventDate || '2026-08-30';
    const posterDueAt = calculateProposedPosterDueDate(eventDate);

    const newAsset: ContentAsset = {
      id: `cnt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      organizationId: 'org_mit_adt',
      eventId: input.eventId,
      title: input.title,
      description: input.description || '',
      category: 'EVENT',
      submitterName: input.submitterName || 'Design Lead',
      submitterRole: 'DESIGN_LEAD',
      mediaUrl: input.mediaUrl,
      mimeType: 'image/png',
      fileSizeBytes: input.fileSizeBytes || 2500000,
      dimensions: '1920x1080',
      sha256: 'a1b2c3d4e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      durationSeconds: 15,
      status: 'pending_president_approval',
      createdAt: new Date().toISOString(),
      clubId: input.clubId || 'club_acm',
      clubName: input.clubName || 'Student Club',
      eventDate,
      venue: event ? event.venue : 'Campus Foyer',
      approvalStage: 'PRESIDENT',
      rejectionCount: 0,
      selfCertified: true,
      posterDueAt,
      designProgress: 100,
      version: 1,
      approvalHistory: [
        {
          id: `step_${Date.now()}`,
          contentId: `cnt_${Date.now()}`,
          approverRole: 'DESIGN_LEAD',
          approverName: input.submitterName || 'Design Lead',
          decision: 'SUBMITTED',
          comment: 'Poster uploaded with self-certified Brand Asset Kit compliance.',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    contentList = [newAsset, ...contentList];

    // Generate short link QR registration automatically
    if (input.mediaUrl && !registrations.some((r) => r.eventId === input.eventId)) {
      const shortCode = generateShortRedirectCode(input.eventId);
      const newReg: Registration = {
        id: `reg_${Date.now()}`,
        eventId: input.eventId,
        eventTitle: input.title,
        externalUrl: 'https://unstop.com/hackathons/campus-event-2026',
        shortCode,
        qrAssetUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://campusiot.app/r/${shortCode}`,
        createdAt: new Date().toISOString(),
        totalScans: 0,
      };
      registrations = [newReg, ...registrations];
    }

    persistState();
    sendJson(response, 201, newAsset);
    return true;
  }

  // Approval endpoint with rejection ceiling & post-approval re-check logic
  const approvalMatch = url.pathname.match(
    /^\/v1\/content\/([^/]+)\/(approve|reject)$/,
  );
  if (request.method === 'POST' && approvalMatch) {
    const id = decodeURIComponent(approvalMatch[1]!);
    const action = approvalMatch[2]!;
    const input = (await readJson(request)) as {
      role?: UserRole;
      actorName?: string;
      reason?: string;
      comment?: string;
    };

    const index = contentList.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Content asset not found.' });
      return true;
    }

    const asset = contentList[index]!;
    const role = input.role || 'ADMIN';
    const actorName = input.actorName || 'Gaurav Khandelwal';

    if (action === 'approve') {
      contentList[index] = advanceApproval(asset, role, actorName, input.comment);
    } else {
      contentList[index] = rejectApproval(
        asset,
        role,
        actorName,
        input.reason || input.comment || 'Changes requested.',
      );
    }

    persistState();
    sendJson(response, 200, contentList[index]);
    return true;
  }

  // Post-approval metadata edit endpoint
  if (request.method === 'PUT' && url.pathname.startsWith('/v1/events/')) {
    const eventId = url.pathname.slice('/v1/events/'.length);
    const input = (await readJson(request)) as {
      eventDate?: string;
      venue?: string;
      actorName?: string;
    };

    const eventIndex = events.findIndex((e) => e.id === eventId);
    if (eventIndex < 0) {
      sendJson(response, 404, { error: 'Event not found.' });
      return true;
    }

    const event = events[eventIndex]!;
    const newDate = input.eventDate || event.eventDate;
    const newVenue = input.venue || event.venue;

    events[eventIndex] = {
      ...event,
      eventDate: newDate,
      venue: newVenue,
      updatedAt: new Date().toISOString(),
    };

    // Recheck associated content asset
    const contentIndex = contentList.findIndex((c) => c.eventId === eventId);
    if (contentIndex >= 0) {
      contentList[contentIndex] = handlePostApprovalEdit(
        contentList[contentIndex]!,
        newDate,
        newVenue,
        input.actorName || 'Club President',
      );
    }

    persistState();
    sendJson(response, 200, events[eventIndex]);
    return true;
  }

  // QR Analytics API
  if (request.method === 'GET' && url.pathname === '/v1/analytics/scans') {
    sendJson(response, 200, {
      totalScans: scanEvents.length,
      registrations,
      scanEvents,
    });
    return true;
  }

  // Synchronized Master Playlist Manifest API
  if (request.method === 'GET' && url.pathname === '/v1/manifest/master') {
    sendJson(response, 200, SYNCHRONIZED_MASTER_MANIFEST);
    return true;
  }

  sendJson(response, 404, { error: 'Endpoint not found.' });
  return true;
}

function serveStatic(response: ServerResponse, pathname: string): void {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const candidate = path.resolve(distDirectory, `.${requested}`);
  const safePath =
    candidate.startsWith(`${distDirectory}${path.sep}`) &&
    existsSync(candidate) &&
    statSync(candidate).isFile()
      ? candidate
      : path.join(distDirectory, 'index.html');

  if (!existsSync(safePath)) {
    sendJson(response, 503, {
      error: 'Web build not found. Run "pnpm build" before "pnpm start".',
    });
    return;
  }

  const contentTypes: Record<string, string> = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
  };
  response.writeHead(200, {
    'Content-Type':
      contentTypes[path.extname(safePath).toLowerCase()] ??
      'application/octet-stream',
    'Cache-Control': safePath.endsWith('index.html')
      ? 'no-cache'
      : 'public, max-age=31536000, immutable',
  });
  createReadStream(safePath).pipe(response);
}

export function createCampusCastServer(): http.Server {
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Referrer-Policy', 'same-origin');
    const url = new URL(request.url ?? '/', `http://localhost:${port}`);

    try {
      if (await handleApi(request, response, url)) return;
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
      }
      serveStatic(response, url.pathname);
    } catch (error) {
      sendJson(response, error instanceof SyntaxError ? 400 : 500, {
        error:
          error instanceof Error ? error.message : 'Unexpected server error.',
      });
    }
  });
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  createCampusCastServer().listen(port, '127.0.0.1', () => {
    console.log(`CampusCast IoT Backend Server running at http://127.0.0.1:${port}`);
  });
}
