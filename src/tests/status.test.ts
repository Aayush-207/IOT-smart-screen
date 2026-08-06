import assert from 'node:assert';
import test, { describe } from 'node:test';
import { isScreenOnline, ONLINE_THRESHOLD_MS } from '../lib/screen-status.js';

describe('IoT Billboard Logic Tests', () => {
  test('isScreenOnline returns true for heartbeats within 15 seconds', () => {
    const now = new Date('2026-08-06T12:00:00.000Z');
    const recentHeartbeat = new Date(now.getTime() - 5000); // 5 seconds ago

    assert.strictEqual(isScreenOnline(recentHeartbeat, now), true);
  });

  test('isScreenOnline returns false for heartbeats older than 15 seconds', () => {
    const now = new Date('2026-08-06T12:00:00.000Z');
    const staleHeartbeat = new Date(now.getTime() - (ONLINE_THRESHOLD_MS + 1000)); // 16 seconds ago

    assert.strictEqual(isScreenOnline(staleHeartbeat, now), false);
  });

  test('isScreenOnline returns false when lastSeenAt is null or undefined', () => {
    const now = new Date();
    assert.strictEqual(isScreenOnline(null, now), false);
    assert.strictEqual(isScreenOnline(undefined, now), false);
  });

  test('deduplication logic removes duplicate screen IDs correctly', () => {
    const screenIds = ['screen-1', 'screen-2', 'screen-1', 'screen-3', 'screen-2'];
    const uniqueIds = Array.from(new Set(screenIds));
    assert.deepStrictEqual(uniqueIds, ['screen-1', 'screen-2', 'screen-3']);
  });

  test('playlist items sort correctly by displayOrder', () => {
    const items = [
      { id: '1', displayOrder: 2, title: 'B' },
      { id: '2', displayOrder: 0, title: 'A' },
      { id: '3', displayOrder: 1, title: 'C' },
    ];
    const sorted = [...items].sort((a, b) => a.displayOrder - b.displayOrder);
    assert.deepStrictEqual(
      sorted.map((i) => i.id),
      ['2', '3', '1']
    );
  });
});
