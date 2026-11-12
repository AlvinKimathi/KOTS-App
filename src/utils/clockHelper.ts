import { Match } from '../types/tournament';

/**
 * Computes the drift-free elapsed match seconds from `clockStartedAt` (UTC epoch ms)
 * so all 300-1,000 connected devices display the exact same MM:SS clock without
 * per-second database writes, even if the Referee phone screen is locked.
 */
export function getEffectiveElapsedSeconds(
  match: Pick<
    Match,
    'status' | 'elapsedSeconds' | 'durationMinutes' | 'clockStartedAt'
  >,
  nowMs: number = Date.now()
): number {
  const maxSeconds = match.durationMinutes * 60;
  if (
    match.status === 'LIVE' &&
    typeof match.clockStartedAt === 'number' &&
    match.clockStartedAt > 0
  ) {
    const deltaSeconds = Math.max(
      0,
      Math.floor((nowMs - match.clockStartedAt) / 1000)
    );
    return Math.min(maxSeconds, match.elapsedSeconds + deltaSeconds);
  }
  return Math.min(maxSeconds, Math.max(0, match.elapsedSeconds));
}
