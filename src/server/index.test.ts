import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

import type { ContentAsset, ScheduleRule } from '../types';
import { createCampusCastServer, resetLocalState } from './index';

test('local full-stack API supports the dashboard lifecycle', async () => {
  resetLocalState();
  const server = createCampusCastServer();
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const health = await fetch(`${baseUrl}/health`);
    assert.equal(health.status, 200);
    assert.equal((await health.json() as { status: string }).status, 'ok');

    const bootstrap = await fetch(`${baseUrl}/v1/bootstrap`);
    const workspace = (await bootstrap.json()) as {
      contentList: ContentAsset[];
      schedules: ScheduleRule[];
    };
    assert.equal(bootstrap.status, 200);
    assert.equal(workspace.contentList.length, 0);
    assert.equal(workspace.schedules.length, 0);

    const newPoster: ContentAsset = {
      id: 'cnt_test_lifecycle',
      organizationId: 'org_mit_adt',
      title: 'Lifecycle test poster',
      description: 'Test poster details',
      category: 'EVENT',
      submitterName: 'Aditi Deshmukh',
      submitterRole: 'Design Lead',
      mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
      mimeType: 'image/jpeg',
      fileSizeBytes: 2400000,
      dimensions: '1920x1080',
      sha256: 'a'.repeat(64),
      durationSeconds: 15,
      status: 'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      clubId: 'club_acm',
      clubName: 'ACM Student Chapter',
      eventDate: '2026-09-01',
      displayStartDate: '2026-08-11T00:00:00.000Z',
      approvalStage: 'PRESIDENT',
      approvalHistory: [],
    };

    const createdContent = await fetch(`${baseUrl}/v1/content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(newPoster),
    });
    assert.equal(createdContent.status, 201);

    const wrongClubApproval = await fetch(
      `${baseUrl}/v1/content/${newPoster.id}/approve`,
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
      `${baseUrl}/v1/content/${newPoster.id}/approve`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'PRESIDENT',
          clubId: newPoster.clubId,
          actorName: 'Aditya Patil',
        }),
      },
    );
    assert.equal(presidentApproval.status, 200);
    assert.equal(
      ((await presidentApproval.json()) as ContentAsset).approvalStage,
      'CLUB_HOD',
    );

    const skippedApproval = await fetch(
      `${baseUrl}/v1/content/${newPoster.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      },
    );
    assert.equal(skippedApproval.status, 403);

    const schedule: ScheduleRule = {
      id: 'sch_test_lifecycle',
      organizationId: 'org_mit_adt',
      title: newPoster.title,
      contentId: newPoster.id,
      targetType: 'CAMPUS',
      targetId: 'mit_adt_main',
      targetName: 'All Campus Screens',
      startTime: '2026-08-11T00:00:00Z',
      endTime: '2026-09-01T23:59:59Z',
      priority: 10,
      createdBy: 'Aditya Patil',
      status: 'ACTIVE',
    };
    const createdSchedule = await fetch(`${baseUrl}/v1/schedules`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    assert.equal(createdSchedule.status, 201);

    const paused = await fetch(
      `${baseUrl}/v1/schedules/${schedule.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'PAUSED' }),
      },
    );
    assert.equal(paused.status, 200);
    assert.equal((await paused.json() as ScheduleRule).status, 'PAUSED');

    const invalidContent = await fetch(`${baseUrl}/v1/content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    });
    assert.equal(invalidContent.status, 422);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
