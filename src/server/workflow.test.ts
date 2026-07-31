import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentAsset } from '../types';
import { advanceApproval, eventDisplayWindow } from '../workflow';

const poster: ContentAsset = {
  id: 'cnt_workflow',
  organizationId: 'org_mit_adt',
  title: 'Workflow poster',
  description: '',
  category: 'EVENT',
  submitterName: 'Design Lead',
  submitterRole: 'Design Lead',
  mediaUrl: 'https://example.com/poster.jpg',
  mimeType: 'image/jpeg',
  fileSizeBytes: 1,
  dimensions: '1920x1080',
  sha256: 'a'.repeat(64),
  durationSeconds: 15,
  status: 'PENDING_APPROVAL',
  createdAt: '2026-07-30T00:00:00.000Z',
  clubId: 'club_acm',
  clubName: 'ACM Student Chapter',
  eventDate: '2026-09-01',
  displayStartDate: '2026-08-11T00:00:00.000Z',
  approvalStage: 'PRESIDENT',
  approvalHistory: [],
};

test('club poster follows president, HOD, and admin approval in order', () => {
  const presidentApproved = advanceApproval(
    poster,
    'PRESIDENT',
    'club_acm',
    'President',
  );
  assert.equal(presidentApproved.approvalStage, 'CLUB_HOD');

  const hodApproved = advanceApproval(
    presidentApproved,
    'CLUB_HOD',
    'club_acm',
    'HOD',
  );
  assert.equal(hodApproved.approvalStage, 'ADMIN');

  const adminApproved = advanceApproval(
    hodApproved,
    'ADMIN',
    'another_club',
    'Admin',
  );
  assert.equal(adminApproved.status, 'APPROVED');
  assert.equal(adminApproved.approvalStage, 'APPROVED');
  assert.equal(adminApproved.approvalHistory?.length, 3);
});

test('event poster display begins exactly 21 days before the event', () => {
  const window = eventDisplayWindow(
    '2026-09-01',
    new Date('2026-07-30T00:00:00.000Z'),
  );
  assert.equal(window.plannedStart, '2026-08-11T00:00:00.000Z');
  assert.equal(window.effectiveStart, window.plannedStart);
  assert.equal(window.endTime, '2026-09-01T23:59:59.999Z');
});

test('a club cannot approve another club poster', () => {
  assert.throws(
    () => advanceApproval(poster, 'PRESIDENT', 'club_robotics', 'Wrong user'),
    /cannot approve/,
  );
});
