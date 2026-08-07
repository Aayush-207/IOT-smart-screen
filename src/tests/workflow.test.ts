import assert from 'node:assert';
import test, { describe } from 'node:test';

describe('Approval State Machine & Workflow Tests', () => {
  type PosterStatus =
    | 'DRAFT'
    | 'PENDING_PRESIDENT'
    | 'PENDING_HOD'
    | 'PENDING_ADMIN'
    | 'APPROVED'
    | 'CHANGES_REQUESTED'
    | 'REJECTED'
    | 'EXPIRED'
    | 'CANCELLED';

  function getNextApprovalState(
    currentStatus: PosterStatus,
    action: 'APPROVE' | 'REQUEST_CHANGES' | 'REJECT',
    userRole: string
  ): { nextStatus: PosterStatus; error?: string } {
    if (currentStatus === 'PENDING_PRESIDENT') {
      if (userRole !== 'PRESIDENT' && userRole !== 'SYSTEM_ADMIN') {
        return { nextStatus: currentStatus, error: 'President role required' };
      }
      if (action === 'APPROVE') return { nextStatus: 'PENDING_HOD' };
      if (action === 'REQUEST_CHANGES') return { nextStatus: 'CHANGES_REQUESTED' };
      if (action === 'REJECT') return { nextStatus: 'REJECTED' };
    }

    if (currentStatus === 'PENDING_HOD') {
      if (userRole !== 'HOD' && userRole !== 'SYSTEM_ADMIN') {
        return { nextStatus: currentStatus, error: 'HOD role required' };
      }
      if (action === 'APPROVE') return { nextStatus: 'PENDING_ADMIN' };
      if (action === 'REQUEST_CHANGES') return { nextStatus: 'CHANGES_REQUESTED' };
      if (action === 'REJECT') return { nextStatus: 'REJECTED' };
    }

    if (currentStatus === 'PENDING_ADMIN') {
      if (userRole !== 'SYSTEM_ADMIN') {
        return { nextStatus: currentStatus, error: 'System Admin role required' };
      }
      if (action === 'APPROVE') return { nextStatus: 'APPROVED' };
      if (action === 'REQUEST_CHANGES') return { nextStatus: 'CHANGES_REQUESTED' };
      if (action === 'REJECT') return { nextStatus: 'REJECTED' };
    }

    return { nextStatus: currentStatus, error: 'Invalid state for review' };
  }

  test('President approval transitions poster from PENDING_PRESIDENT to PENDING_HOD', () => {
    const result = getNextApprovalState('PENDING_PRESIDENT', 'APPROVE', 'PRESIDENT');
    assert.strictEqual(result.nextStatus, 'PENDING_HOD');
    assert.strictEqual(result.error, undefined);
  });

  test('HOD approval transitions poster from PENDING_HOD to PENDING_ADMIN', () => {
    const result = getNextApprovalState('PENDING_HOD', 'APPROVE', 'HOD');
    assert.strictEqual(result.nextStatus, 'PENDING_ADMIN');
    assert.strictEqual(result.error, undefined);
  });

  test('Admin approval transitions poster from PENDING_ADMIN to APPROVED', () => {
    const result = getNextApprovalState('PENDING_ADMIN', 'APPROVE', 'SYSTEM_ADMIN');
    assert.strictEqual(result.nextStatus, 'APPROVED');
    assert.strictEqual(result.error, undefined);
  });

  test('Rejection at any stage sets status to REJECTED', () => {
    const res1 = getNextApprovalState('PENDING_PRESIDENT', 'REJECT', 'PRESIDENT');
    assert.strictEqual(res1.nextStatus, 'REJECTED');

    const res2 = getNextApprovalState('PENDING_HOD', 'REJECT', 'HOD');
    assert.strictEqual(res2.nextStatus, 'REJECTED');

    const res3 = getNextApprovalState('PENDING_ADMIN', 'REJECT', 'SYSTEM_ADMIN');
    assert.strictEqual(res3.nextStatus, 'REJECTED');
  });

  test('Unauthorized role review attempt returns permission error', () => {
    const result = getNextApprovalState('PENDING_PRESIDENT', 'APPROVE', 'DESIGN_LEAD');
    assert.strictEqual(result.nextStatus, 'PENDING_PRESIDENT');
    assert.strictEqual(result.error, 'President role required');
  });
});
