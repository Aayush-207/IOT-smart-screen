import { createReadStream, existsSync, statSync } from 'node:fs';
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

let devices: Device[] = structuredClone(INITIAL_DEVICES);
let contentList: ContentAsset[] = structuredClone(INITIAL_CONTENT);
let schedules: ScheduleRule[] = structuredClone(INITIAL_SCHEDULES);

export function resetLocalState(): void {
  devices = structuredClone(INITIAL_DEVICES);
  contentList = structuredClone(INITIAL_CONTENT);
  schedules = structuredClone(INITIAL_SCHEDULES);
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
      telemetry: MOCK_TELEMETRY,
    });
    return true;
  }

  const collections = new Map<string, unknown[]>([
    ['/v1/devices', devices],
    ['/v1/content', contentList],
    ['/v1/schedules', schedules],
    ['/v1/telemetry', MOCK_TELEMETRY],
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
    sendJson(response, 200, schedules[index]);
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
    setTimeout(() => {
      const current = devices.findIndex((item) => item.id === id);
      if (current >= 0) {
        devices[current] = {
          ...devices[current]!,
          status: 'ONLINE',
          lastHeartbeatAt: new Date().toISOString(),
        };
      }
    }, 1_500);
    sendJson(response, 202, { status: 'restart_requested', deviceId: id });
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
    sendJson(response, 200, { ...SAMPLE_COMPILED_MANIFEST, deviceId });
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
