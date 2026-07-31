import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import test from 'node:test';

import type { ContentAsset, Device, ScheduleRule, SynchronizedMasterManifest } from '../types';
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

    // 1. Initial bootstrap
    const bootstrap = await fetch(`${baseUrl}/v1/bootstrap`);
    const workspace = (await bootstrap.json()) as {
      devices: Device[];
      contentList: ContentAsset[];
      schedules: ScheduleRule[];
    };
    assert.equal(bootstrap.status, 200);
    assert.ok(Array.isArray(workspace.devices));
    assert.ok(Array.isArray(workspace.contentList));

    // 2. Create a poster with valid event dates
    const pendingAsset: Partial<ContentAsset> = {
      id: 'cnt_pending_01',
      organizationId: 'org_mit_adt',
      eventId: 'evt_hackathon_2026',
      title: 'Cyber Security Workshop',
      description: 'Test workshop poster',
      category: 'EVENT',
      submitterName: 'Aditi Deshmukh',
      submitterRole: 'DESIGN_LEAD',
      mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5',
      mimeType: 'image/jpeg',
      fileSizeBytes: 1000,
      dimensions: '1920x1080',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      durationSeconds: 15,
      status: 'pending_president_approval',
      createdAt: new Date().toISOString(),
      clubId: 'club_acm',
      clubName: 'ACM Student Chapter',
      eventDate: '2026-08-28',
      venue: 'Tech Block A',
      approvalStage: 'PRESIDENT',
      rejectionCount: 0,
      selfCertified: true,
      posterDueAt: '2026-07-31',
      designProgress: 100,
      version: 1,
      approvalHistory: [],
    };
    const contentRes = await fetch(`${baseUrl}/v1/content`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pendingAsset),
    });
    assert.equal(contentRes.status, 201);
    const createdContent = (await contentRes.json()) as ContentAsset;

    // 3. RBAC validation: Unauthorized role cannot approve
    const unauthorizedApproval = await fetch(
      `${baseUrl}/v1/content/${createdContent.id}/approve`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-user-role': 'DESIGN_LEAD',
        },
        body: JSON.stringify({
          role: 'DESIGN_LEAD',
          actorName: 'Design Lead',
        }),
      },
    );
    assert.equal(unauthorizedApproval.status, 403);

    // 4. Sequential approvals: President -> HOD -> Admin
    const presRes = await fetch(`${baseUrl}/v1/content/${createdContent.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-role': 'PRESIDENT' },
      body: JSON.stringify({ role: 'PRESIDENT', actorName: 'President' }),
    });
    assert.equal(presRes.status, 200);

    const hodRes = await fetch(`${baseUrl}/v1/content/${createdContent.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-role': 'CLUB_HOD' },
      body: JSON.stringify({ role: 'CLUB_HOD', actorName: 'HOD' }),
    });
    assert.equal(hodRes.status, 200);

    const adminRes = await fetch(`${baseUrl}/v1/content/${createdContent.id}/approve`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-user-role': 'ADMIN' },
      body: JSON.stringify({ role: 'ADMIN', actorName: 'Campus Admin' }),
    });
    assert.equal(adminRes.status, 200);
    const approvedContent = (await adminRes.json()) as ContentAsset;
    assert.equal(approvedContent.status, 'approved');

    // 5. Verify approved poster is automatically in dynamic Master Manifest
    const manifestRes = await fetch(`${baseUrl}/v1/manifest/master`);
    assert.equal(manifestRes.status, 200);
    const manifest = (await manifestRes.json()) as SynchronizedMasterManifest;
    assert.ok(manifest.playlist.some((p) => p.contentId === createdContent.id));

    // 6. QR Short-link redirect test (stateless HTTP 302)
    const qrRedirect = await fetch(`${baseUrl}/r/r_HACK26`, { redirect: 'manual' });
    assert.equal(qrRedirect.status, 302);
    assert.ok(qrRedirect.headers.get('location'));
  } finally {
    resetLocalState();
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
