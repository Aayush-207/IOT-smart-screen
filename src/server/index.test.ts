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
    assert.ok(workspace.contentList.length > 0);
    assert.ok(workspace.schedules.length > 0);

    const pending = workspace.contentList.find(
      (content) => content.approvalStage === 'PRESIDENT',
    );
    assert.ok(pending);
    const wrongClubApproval = await fetch(
      `${baseUrl}/v1/content/${pending.id}/approve`,
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
      `${baseUrl}/v1/content/${pending.id}/approve`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          role: 'PRESIDENT',
          clubId: pending.clubId,
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
      `${baseUrl}/v1/content/${pending.id}`,
      {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      },
    );
    assert.equal(skippedApproval.status, 403);

    const asset: ContentAsset = {
      ...workspace.contentList[0]!,
      id: 'cnt_test_lifecycle',
      title: 'Lifecycle test poster',
    };
    const createdContent = await fetch(`${baseUrl}/v1/content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(asset),
    });
    assert.equal(createdContent.status, 201);

    const schedule: ScheduleRule = {
      ...workspace.schedules[0]!,
      id: 'sch_test_lifecycle',
      contentId: asset.id,
      title: asset.title,
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
