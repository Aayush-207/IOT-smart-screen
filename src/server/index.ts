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
  INITIAL_SCHEDULES,
  MOCK_TELEMETRY,
  SAMPLE_COMPILED_MANIFEST,
} from '../mockData';
import type {
  ContentAsset,
  Device,
  ScheduleRule,
  TelemetryEvent,
  UserRole,
} from '../types';
import {
  advanceApproval,
  canApprove,
  eventDisplayWindow,
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
]);

interface PersistentState {
  devices: Device[];
  contentList: ContentAsset[];
  schedules: ScheduleRule[];
  telemetry: TelemetryEvent[];
}

function initialState(): PersistentState {
  return {
    devices: [],
    contentList: [],
    schedules: [],
    telemetry: [],
  };
}

function loadState(): PersistentState {
  try {
    const value = JSON.parse(readFileSync(dataFile, 'utf8')) as Partial<PersistentState>;
    if (
      Array.isArray(value.devices) &&
      Array.isArray(value.contentList) &&
      Array.isArray(value.schedules) &&
      Array.isArray(value.telemetry)
    ) {
      return value as PersistentState;
    }
  } catch {
    // First run or invalid local data: start from the verified demo workspace.
  }
  return initialState();
}

let state = loadState();
let { devices, contentList, schedules, telemetry } = state;

function persistState(): void {
  state = { devices, contentList, schedules, telemetry };
  mkdirSync(path.dirname(dataFile), { recursive: true });
  writeFileSync(dataFile, JSON.stringify(state, null, 2), 'utf8');
}

export function resetLocalState(): void {
  ({ devices, contentList, schedules, telemetry } = initialState());
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

function isContentAsset(value: unknown): value is ContentAsset {
  if (!value || typeof value !== 'object') return false;
  const asset = value as Partial<ContentAsset>;
  const basic =
    typeof asset.id === 'string' &&
    typeof asset.title === 'string' &&
    asset.title.trim().length > 0 &&
    typeof asset.mediaUrl === 'string';
  if (!basic) return false;
  if (asset.status !== 'PENDING_APPROVAL') return true;
  if (
    typeof asset.clubId !== 'string' ||
    typeof asset.clubName !== 'string' ||
    typeof asset.eventDate !== 'string' ||
    typeof asset.displayStartDate !== 'string' ||
    asset.approvalStage !== 'PRESIDENT' ||
    !Array.isArray(asset.approvalHistory)
  ) {
    return false;
  }
  try {
    return (
      eventDisplayWindow(asset.eventDate).plannedStart === asset.displayStartDate
    );
  } catch {
    return false;
  }
}

function isSchedule(value: unknown): value is ScheduleRule {
  if (!value || typeof value !== 'object') return false;
  const schedule = value as Partial<ScheduleRule>;
  return (
    typeof schedule.id === 'string' &&
    typeof schedule.contentId === 'string' &&
    typeof schedule.startTime === 'string' &&
    typeof schedule.endTime === 'string' &&
    new Date(schedule.endTime).getTime() > new Date(schedule.startTime).getTime()
  );
}

async function handleApi(
  request: IncomingMessage,
  response: ServerResponse,
  url: URL,
): Promise<boolean> {
  if (!url.pathname.startsWith('/v1/') && url.pathname !== '/health') return false;

  if (
    request.method === 'GET' &&
    (url.pathname === '/health' || url.pathname === '/v1/health')
  ) {
    sendJson(response, 200, {
      status: 'ok',
      service: 'campuscast-local',
      timestamp: new Date().toISOString(),
    });
    return true;
  }

  if (request.method === 'GET' && url.pathname === '/v1/bootstrap') {
    sendJson(response, 200, {
      devices,
      contentList,
      schedules,
      telemetry,
    });
    return true;
  }

  const collections = new Map<string, unknown[]>([
    ['/v1/devices', devices],
    ['/v1/content', contentList],
    ['/v1/schedules', schedules],
    ['/v1/telemetry', telemetry],
  ]);
  if (request.method === 'GET' && collections.has(url.pathname)) {
    sendJson(response, 200, { items: collections.get(url.pathname) });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/content') {
    const input = await readJson(request);
    if (!isContentAsset(input)) {
      sendJson(response, 422, { error: 'A valid content asset is required.' });
      return true;
    }
    contentList = [input, ...contentList.filter((item) => item.id !== input.id)];
    persistState();
    sendJson(response, 201, input);
    return true;
  }

  const approvalMatch = url.pathname.match(
    /^\/v1\/content\/([^/]+)\/(approve|reject)$/,
  );
  if (request.method === 'POST' && approvalMatch) {
    const id = decodeURIComponent(approvalMatch[1]!);
    const action = approvalMatch[2]!;
    const input = (await readJson(request)) as {
      role?: UserRole;
      clubId?: string;
      actorName?: string;
      reason?: string;
    };
    const index = contentList.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Content not found.' });
      return true;
    }
    if (
      !input.role ||
      !allowedRoles.has(input.role) ||
      typeof input.clubId !== 'string' ||
      typeof input.actorName !== 'string' ||
      !input.actorName.trim()
    ) {
      sendJson(response, 422, { error: 'A valid approval identity is required.' });
      return true;
    }

    const asset = contentList[index]!;
    if (!canApprove(asset, input.role, input.clubId)) {
      sendJson(response, 403, {
        error: 'This role cannot act on the current approval stage.',
      });
      return true;
    }

    if (action === 'approve') {
      contentList[index] = advanceApproval(
        asset,
        input.role,
        input.clubId,
        input.actorName,
      );
      const approved = contentList[index]!;
      if (approved.status === 'APPROVED' && approved.eventDate) {
        const window = eventDisplayWindow(approved.eventDate);
        const schedule: ScheduleRule = {
          id: `sch_event_${approved.id}`,
          organizationId: approved.organizationId,
          title: `${approved.title} · 21-day event campaign`,
          contentId: approved.id,
          targetType: 'CAMPUS',
          targetId: 'mit_adt_main',
          targetName: 'All campus screens',
          startTime: window.effectiveStart,
          endTime: window.endTime,
          priority: 10,
          createdBy: input.actorName,
          status: new Date(window.effectiveStart) <= new Date() ? 'ACTIVE' : 'SCHEDULED',
        };
        schedules = [schedule, ...schedules.filter((item) => item.id !== schedule.id)];
      }
    } else {
      const reason =
        typeof input.reason === 'string' && input.reason.trim()
          ? input.reason.trim()
          : 'Changes requested.';
      contentList[index] = {
        ...asset,
        status: 'REJECTED',
        approvalStage: 'REJECTED',
        rejectionReason: reason,
        approvalHistory: [
          ...(asset.approvalHistory ?? []),
          {
            stage: input.role,
            actorName: input.actorName,
            action: 'REJECTED',
            timestamp: new Date().toISOString(),
            note: reason,
          },
        ],
      };
    }
    persistState();
    sendJson(response, 200, contentList[index]);
    return true;
  }

  if (request.method === 'PATCH' && url.pathname.startsWith('/v1/content/')) {
    const id = decodeURIComponent(url.pathname.slice('/v1/content/'.length));
    const input = (await readJson(request)) as Partial<ContentAsset>;
    if (
      [
        'status',
        'approvalStage',
        'approvalHistory',
        'approvedAt',
        'approvedBy',
      ].some((field) => Object.prototype.hasOwnProperty.call(input, field))
    ) {
      sendJson(response, 403, {
        error: 'Approval state can only change through the approval workflow.',
      });
      return true;
    }
    const index = contentList.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Content not found.' });
      return true;
    }
    contentList[index] = { ...contentList[index]!, ...input, id };
    persistState();
    sendJson(response, 200, contentList[index]);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/schedules') {
    const input = await readJson(request);
    if (!isSchedule(input)) {
      sendJson(response, 422, { error: 'A valid schedule is required.' });
      return true;
    }
    schedules = [input, ...schedules.filter((item) => item.id !== input.id)];
    persistState();
    sendJson(response, 201, input);
    return true;
  }

  if (request.method === 'PATCH' && url.pathname.startsWith('/v1/schedules/')) {
    const id = decodeURIComponent(url.pathname.slice('/v1/schedules/'.length));
    const input = (await readJson(request)) as { status?: ScheduleRule['status'] };
    const index = schedules.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Schedule not found.' });
      return true;
    }
    if (!input.status || !allowedScheduleStatuses.has(input.status)) {
      sendJson(response, 422, { error: 'A valid schedule status is required.' });
      return true;
    }
    schedules[index] = { ...schedules[index]!, status: input.status };
    persistState();
    sendJson(response, 200, schedules[index]);
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/devices') {
    const input = (await readJson(request)) as Device;
    if (!input || typeof input.id !== 'string' || typeof input.displayName !== 'string') {
      sendJson(response, 422, { error: 'A valid device configuration is required.' });
      return true;
    }
    devices = [input, ...devices.filter((item) => item.id !== input.id)];
    persistState();
    sendJson(response, 201, input);
    return true;
  }

  const restartMatch = url.pathname.match(/^\/v1\/devices\/([^/]+)\/restart$/);
  if (request.method === 'POST' && restartMatch) {
    const id = decodeURIComponent(restartMatch[1]!);
    const index = devices.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Screen not found.' });
      return true;
    }
    devices[index] = { ...devices[index]!, status: 'MAINTENANCE' };
    persistState();
    setTimeout(() => {
      const current = devices.findIndex((item) => item.id === id);
      if (current >= 0) {
        devices[current] = {
          ...devices[current]!,
          status: 'ONLINE',
          lastHeartbeatAt: new Date().toISOString(),
        };
        persistState();
      }
    }, 1_500);
    sendJson(response, 202, { status: 'restart_requested', deviceId: id });
    return true;
  }

  const heartbeatMatch = url.pathname.match(/^\/v1\/devices\/([^/]+)\/heartbeat$/);
  if (request.method === 'POST' && heartbeatMatch) {
    const id = decodeURIComponent(heartbeatMatch[1]!);
    const index = devices.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Screen not found.' });
      return true;
    }
    const input = (await readJson(request)) as {
      appVersion?: string;
      storageUsagePct?: number;
      temperatureC?: number;
    };
    devices[index] = {
      ...devices[index]!,
      status: 'ONLINE',
      lastHeartbeatAt: new Date().toISOString(),
      ...(typeof input.appVersion === 'string' ? { appVersion: input.appVersion } : {}),
      ...(typeof input.storageUsagePct === 'number'
        ? { storageUsagePct: Math.min(100, Math.max(0, input.storageUsagePct)) }
        : {}),
      ...(typeof input.temperatureC === 'number'
        ? { temperatureC: input.temperatureC }
        : {}),
    };
    persistState();
    sendJson(response, 202, { status: 'heartbeat_accepted', device: devices[index] });
    return true;
  }

  const playbackMatch = url.pathname.match(/^\/v1\/devices\/([^/]+)\/playback$/);
  if (request.method === 'POST' && playbackMatch) {
    const id = decodeURIComponent(playbackMatch[1]!);
    const device = devices.find((item) => item.id === id);
    const input = (await readJson(request)) as {
      contentId?: string;
      result?: TelemetryEvent['result'];
      latencyMs?: number;
    };
    const content = contentList.find((item) => item.id === input.contentId);
    const allowedResults = new Set<TelemetryEvent['result']>([
      'PLAY_SUCCESS',
      'DOWNLOAD_FAILED',
      'CHECKSUM_MISMATCH',
      'CACHE_HIT',
    ]);
    if (!device || !content || !input.result || !allowedResults.has(input.result)) {
      sendJson(response, 422, { error: 'A valid device playback event is required.' });
      return true;
    }
    const event: TelemetryEvent = {
      id: `tel_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      deviceId: device.id,
      deviceName: device.displayName,
      contentId: content.id,
      contentTitle: content.title,
      timestamp: new Date().toISOString(),
      result: input.result,
      latencyMs:
        typeof input.latencyMs === 'number' && input.latencyMs >= 0
          ? Math.round(input.latencyMs)
          : 0,
    };
    telemetry = [event, ...telemetry].slice(0, 500);
    persistState();
    sendJson(response, 202, event);
    return true;
  }

  const updateMatch = url.pathname.match(/^\/v1\/devices\/([^/]+)\/update$/);
  if (request.method === 'POST' && updateMatch) {
    const id = decodeURIComponent(updateMatch[1]!);
    const index = devices.findIndex((item) => item.id === id);
    if (index < 0) {
      sendJson(response, 404, { error: 'Screen not found.' });
      return true;
    }
    devices[index] = { ...devices[index]!, status: 'MAINTENANCE' };
    persistState();
    setTimeout(() => {
      const current = devices.findIndex((item) => item.id === id);
      if (current >= 0) {
        devices[current] = {
          ...devices[current]!,
          appVersion: 'v2.1.0-kiosk',
          status: 'ONLINE',
          lastHeartbeatAt: new Date().toISOString(),
        };
        persistState();
      }
    }, 1_500);
    sendJson(response, 202, {
      status: 'update_requested',
      deviceId: id,
      targetVersion: 'v2.1.0-kiosk',
    });
    return true;
  }

  if (request.method === 'POST' && url.pathname === '/v1/reset') {
    resetLocalState();
    sendJson(response, 200, { status: 'reset' });
    return true;
  }

  if (
    request.method === 'GET' &&
    url.pathname.startsWith('/v1/manifests/')
  ) {
    const deviceId = url.pathname.split('/')[3] || devices[0]?.id;
    const now = Date.now();
    const playlist = schedules
      .filter(
        (schedule) =>
          schedule.status !== 'CANCELLED' &&
          schedule.status !== 'PAUSED' &&
          new Date(schedule.startTime).getTime() <= now &&
          new Date(schedule.endTime).getTime() >= now,
      )
      .sort((left, right) => right.priority - left.priority)
      .flatMap((schedule) => {
        const content = contentList.find(
          (item) => item.id === schedule.contentId && item.status === 'APPROVED',
        );
        return content
          ? [{
              contentId: content.id,
              version: 1,
              title: content.title,
              mediaUrl: content.mediaUrl,
              mimeType: content.mimeType,
              sha256: content.sha256,
              durationSeconds: content.durationSeconds,
              priority: schedule.priority,
              displaySchedule: {
                startTime: schedule.startTime,
                endTime: schedule.endTime,
              },
            }]
          : [];
      });
    sendJson(response, 200, {
      ...SAMPLE_COMPILED_MANIFEST,
      manifestVersion: `local-${Date.now()}`,
      deviceId,
      generatedAt: new Date().toISOString(),
      playlist,
    });
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
    console.log(`CampusCast is running at http://127.0.0.1:${port}`);
  });
}
