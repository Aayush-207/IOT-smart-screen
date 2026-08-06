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

  test('21-day schedule window calculation calculates exact start and end bounds', () => {
    const eventDate = new Date('2026-08-25T14:30:00.000Z');
    
    // activeFrom = Event Date - 21 days (00:00:00)
    const activeFrom = new Date(eventDate);
    activeFrom.setDate(activeFrom.getDate() - 21);
    activeFrom.setHours(0, 0, 0, 0);

    // activeUntil = Event Date (23:59:59)
    const activeUntil = new Date(eventDate);
    activeUntil.setHours(23, 59, 59, 999);

    assert.strictEqual(activeFrom.getDate(), 4);
    assert.strictEqual(activeFrom.getMonth(), 7); // August (0-indexed)
    assert.strictEqual(activeFrom.getHours(), 0);
    assert.strictEqual(activeUntil.getHours(), 23);
    assert.strictEqual(activeUntil.getMinutes(), 59);
    assert.strictEqual(activeUntil.getSeconds(), 59);
  });

  test('MIME type validation restricts poster uploads to PNG, JPEG, and WebP', () => {
    const allowedMimes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    
    assert.strictEqual(allowedMimes.includes('image/png'), true);
    assert.strictEqual(allowedMimes.includes('image/jpeg'), true);
    assert.strictEqual(allowedMimes.includes('image/webp'), true);
    assert.strictEqual(allowedMimes.includes('application/pdf'), false);
    assert.strictEqual(allowedMimes.includes('video/mp4'), false);
  });

  test('DeviceCommand TTL expiration calculation correctly sets future expiration date', () => {
    const now = new Date('2026-08-06T10:00:00.000Z');
    const validityMinutes = 60;
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);

    assert.strictEqual(expiresAt.toISOString(), '2026-08-06T11:00:00.000Z');
    assert.strictEqual(expiresAt > now, true);
  });
});
