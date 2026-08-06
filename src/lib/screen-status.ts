export const ONLINE_THRESHOLD_MS = 15 * 1000; // 15 seconds

/**
 * Determines whether a screen is online based on its lastSeenAt timestamp.
 * A screen is online if its most recent heartbeat was received within the last 15 seconds.
 */
export function isScreenOnline(
  lastSeenAt: Date | string | null | undefined,
  now: Date = new Date()
): boolean {
  if (!lastSeenAt) return false;
  const lastSeenDate = typeof lastSeenAt === 'string' ? new Date(lastSeenAt) : lastSeenAt;
  if (isNaN(lastSeenDate.getTime())) return false;

  const diff = now.getTime() - lastSeenDate.getTime();
  return diff >= 0 && diff <= ONLINE_THRESHOLD_MS;
}
