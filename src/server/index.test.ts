import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

import type { ContentAsset, Device, ScheduleRule } from '../types';
import { eventDisplayWindow } from '../workflow';
import { createCampusCastServer, resetLocalState } from './index';

test('local full-stack API supports the dashboard lifecycle from a clean state', async () => {
  resetLocalState();
  const server = createCampusCastServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json() as { status: string }).status, 'ok');

    // 1. Initial bootstrap should be empty
    const bootstrap = await fetch(`${baseUrl}/v1/bootstrap`);
    const workspace = (await bootstrap.json()) as {
      devices: Device[];
      contentList: ContentAsset[];
      schedules: ScheduleRule[];
    };
    assert.equal(bootstrap.status, 200);
    assert.equal(workspace.devices.length, 0);
    assert.equal(workspace.contentList.length, 0);
    assert.equal(workspace.schedules.length, 0);

    // 2. Register a device dynamically
    const testDevice: Device = {
      id: 'dev_test_01',
      organizationId: 'org_mit_adt',
      thingName: 'mit_adt_test_01',
      displayName: 'Test Screen Lobby',
      location: {
        campus: 'MIT ADT',
        building: 'Tech Block A',
        floor: '1',
        zone: 'Foyer',
        locationName: 'Lobby Mount',
      },
      ipAddress: '10.0.0.1',
      macAddress: 'AA:BB:CC:DD:EE:FF',
      certificateArn: 'arn:aws:iot:test',
      status: 'ONLINE',
      lastHeartbeatAt: new Date().toISOString(),
      currentManifestVersion: 'v1.0.0',
      appVersion: 'v1.0.0',
      storageUsagePct: 10,
      temperatureC: 35,
      orientation: 'LANDSCAPE',
      activeContentId: undefined,
      isKioskLocked: true,
    };
    const regRes = await fetch(`${baseUrl}/v1/devices`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(testDevice),
    });
    assert.equal(regRes.status, 201);

    // 3. Create a pending poster with valid event dates
    const eventDate = '2026-08-28';
    const window = eventDisplayWindow(eventDate);
    const pendingAsset: ContentAsset = {
      id: 'cnt_pending_01',
      organizationId: 'org_mit_adt',
      title: 'Cyber Security Workshop',
      description: 'Test workshop poster',
      category: 'EVENT',
      submitterName: 'Aditi Deshmukh',
      submitterRole: 'Design Lead',
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1000,
      dimensions: '1920x1080',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      durationSeconds: 15,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      clubId: 'club_acm',
      clubName: 'ACM Student Chapter',
      eventDate,
      displayStartDate: window.plannedStart,
      approvalStage: 'PRESIDENT',
      approvalHistory: [],
    };
    const contentRes = await fetch(`${baseUrl}/v1/content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pendingAsset),
    });
    assert.equal(contentRes.status, 201);

    // 4. Test RBAC permissions on content approval
    const wrongClubApproval = await fetch(
      `${baseUrl}/v1/content/${pendingAsset.id}/approve`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'PRESIDENT',
          clubId: 'club_robotics',
          actorName: 'Wrong President',
        }),
      },
    );
    assert.equal(wrongClubApproval.status, 403);

    const presidentApproval = await fetch(
      `${baseUrl}/v1/content/${pendingAsset.id}/approve`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'PRESIDENT',
          clubId: pendingAsset.clubId,
          actorName: 'Aditya Patil',
        }),
      },
    );
    assert.equal(presidentApproval.status, 200);
    assert.equal(
      ((await presidentApproval.json()) as ContentAsset).approvalStage,
      'CLUB_HOD',
    );

    // 5. Schedule creation & status patch
    const schedule: ScheduleRule = {
      id: 'sch_test_01',
      organizationId: 'org_mit_adt',
      title: pendingAsset.title,
      contentId: pendingAsset.id,
      targetType: 'CAMPUS',
      targetId: 'all',
      targetName: 'All Campus Screens',
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 86400000).toISOString(),
      priority: 10,
      createdBy: 'Aditi Deshmukh',
      status: 'ACTIVE',
    };
    const createdSchedule = await fetch(`${baseUrl}/v1/schedules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    assert.equal(createdSchedule.status, 201);

    const paused = await fetch(`${baseUrl}/v1/schedules/${schedule.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'PAUSED' }),
    });
    assert.equal(paused.status, 200);
    assert.equal((await paused.json() as ScheduleRule).status, 'PAUSED');

    // 6. Device Heartbeat
    const heartbeat = await fetch(
      `${baseUrl}/v1/devices/${testDevice.id}/heartbeat`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appVersion: 'v2.1.0-kiosk' }),
      },
    );
    assert.equal(heartbeat.status, 202);
    const refreshed = (await heartbeat.json()) as { device: { status: string } };
    assert.equal(refreshed.device.status, 'ONLINE');

    // 7. Manifest Compilation
    const manifest = await fetch(`${baseUrl}/v1/manifests/${testDevice.id}`);
    assert.equal(manifest.status, 200);
    assert.ok(Array.isArray(((await manifest.json()) as { playlist: unknown[] }).playlist));
  } finally {
    resetLocalState();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
