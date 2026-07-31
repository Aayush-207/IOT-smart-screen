import assert from 'node:assert/strict';
import test from 'node:test';

import type { ContentAsset } from '../types';
import {
  advanceApproval,
  evaluateWorkflowDeadlineStatus,
  eventDisplayWindow,
  handlePostApprovalEdit,
  rejectApproval,
} from '../workflow';

const poster: ContentAsset = {
  id: 'cnt_workflow',
  organizationId: 'org_mit_adt',
  eventId: 'evt_001',
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
  status: 'pending_president_approval',
  createdAt: '2026-07-30T00:00:00.000Z',
  clubId: 'club_acm',
  clubName: 'ACM Student Chapter',
  eventDate: '2026-09-01',
  venue: 'Tech Block A Auditorium',
  approvalStage: 'PRESIDENT',
  rejectionCount: 0,
  selfCertified: true,
  posterDueAt: '2026-08-04',
  designProgress: 100,
  version: 1,
  approvalHistory: [],
};

test('club poster follows president, HOD, and admin approval in order', () => {
  const presidentApproved = advanceApproval(poster, 'PRESIDENT', 'President');
  assert.equal(presidentApproved.status, 'pending_hod_approval');

  const hodApproved = advanceApproval(presidentApproved, 'CLUB_HOD', 'HOD');
  assert.equal(hodApproved.status, 'pending_admin_approval');

  const adminApproved = advanceApproval(hodApproved, 'ADMIN', 'Admin');
  assert.equal(adminApproved.status, 'approved');
  assert.equal(adminApproved.approvalHistory?.length, 3);
});

test('rejection loop ceiling auto-escalates to Admin on 2nd rejection', () => {
  const rej1 = rejectApproval(poster, 'PRESIDENT', 'President', 'Rejection #1');
  assert.equal(rej1.status, 'rejected');
  assert.equal(rej1.rejectionCount, 1);

  // Submit again after fixing
  const resubmitted: ContentAsset = {
    ...rej1,
    status: 'pending_president_approval',
  };

  const rej2 = rejectApproval(resubmitted, 'CLUB_HOD', 'HOD', 'Rejection #2');
  assert.equal(rej2.status, 'escalated_admin');
  assert.equal(rej2.rejectionCount, 2);
});

test('event poster display begins exactly 21 days before the event', () => {
  const window = eventDisplayWindow('2026-09-01');
  assert.equal(window.plannedStart, '2026-08-11');
  assert.equal(window.hardCutoffDate, '2026-08-25');
});

test('post-approval date edit triggers fast admin re-check', () => {
  const approvedPoster: ContentAsset = { ...poster, status: 'approved' };
  const rechecked = handlePostApprovalEdit(
    approvedPoster,
    '2026-09-05',
    'Grand Dome Auditorium',
    'Club President',
  );
  assert.equal(rechecked.status, 'pending_admin_approval');
  assert.equal(rechecked.isPostApprovalRecheck, true);
  assert.equal(rechecked.eventDate, '2026-09-05');
});
