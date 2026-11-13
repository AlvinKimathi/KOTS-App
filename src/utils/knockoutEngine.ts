import {
  KnockoutStage,
  Match,
  MatchStats,
  TournamentCategory,
} from '../types/tournament';
import { formatMinutesClock, parseStartTimeMinutes } from './drawGenerator';

export interface BracketParticipant {
  id: string;
  name: string;
  shortCode: string;
  color: string;
}

const EMPTY_STATS = (): MatchStats => ({
  shotsOnTarget: [0, 0],
  shotsOffTarget: [0, 0],
  blockedShots: [0, 0],
  possession: [50, 50],
  corners: [0, 0],
  fouls: [0, 0],
  yellowCards: [0, 0],
  redCards: [0, 0],
});

/**
 * Arranges seeded Top-8 qualifiers so #1 and #2 sit on opposite sides of the bracket:
 * QF1: #1 vs #8, QF2: #4 vs #5, QF3: #2 vs #7, QF4: #3 vs #6.
 */
export function orderChampionshipQuarterFinalSeeds(
  participants: BracketParticipant[]
): BracketParticipant[] {
  if (participants.length < 8) return participants;
  const top8 = participants.slice(0, 8);
  return [
    top8[0],
    top8[7],
    top8[3],
    top8[4],
    top8[1],
    top8[6],
    top8[2],
    top8[5],
  ];
}

/**
 * Determines the recommended starting knockout stage based on how many teams/players
 * have registered or qualified, while always supporting R16 -> QF -> SF -> FINAL.
 */
export function getRecommendedKnockoutStartStage(
  participantCount: number
): 'R16' | 'QF' | 'SF' {
  if (participantCount >= 9) return 'R16';
  if (participantCount >= 5) return 'QF';
  return 'SF';
}

/**
 * Generates a complete linked Knockout Bracket tree starting from R16, QF, or SF
 * (R16 -> QF -> SF -> FINAL), with configurable tiered durations (e.g. 10 min QFs,
 * 15 min Semis & Final) and consecutive cooldown gaps.
 */
export function generateKnockoutBracket(params: {
  category: TournamentCategory;
  participants: BracketParticipant[];
  startStage?: 'R16' | 'QF' | 'SF';
  venue?: string;
  dateLabel?: string;
  startTime?: string;
  durationMinutes?: number;
  qfDurationMinutes?: number;
  sfFinalDurationMinutes?: number;
  cooldownMinutes?: number;
  seedChampionshipOrder?: boolean;
}): Match[] {
  const {
    category,
    participants,
    startStage = 'R16',
    venue = 'BALLMANIA RUNDA',
    dateLabel = '14 Nov',
    startTime = category === '7aside' ? '17:15' : '13:00',
    durationMinutes,
    qfDurationMinutes = durationMinutes ?? (category === '7aside' ? 10 : 4),
    sfFinalDurationMinutes = durationMinutes ?? (category === '7aside' ? 15 : 4),
    cooldownMinutes = 5,
    seedChampionshipOrder = false,
  } = params;

  const prefix = `${category}-ko`;
  const finalId = `${prefix}-final-1`;
  const sfIds = [`${prefix}-sf-1`, `${prefix}-sf-2`];
  const qfIds = [
    `${prefix}-qf-1`,
    `${prefix}-qf-2`,
    `${prefix}-qf-3`,
    `${prefix}-qf-4`,
  ];
  const r16Ids = Array.from({ length: 8 }, (_, i) => `${prefix}-r16-${i + 1}`);

  const createEmptyMatch = (
    id: string,
    stage: KnockoutStage,
    order: number,
    scheduledTime: string,
    matchDuration: number,
    nextMatchId?: string,
    nextMatchSlot?: 'HOME' | 'AWAY'
  ): Match => ({
    id,
    category,
    stage,
    groupId: stage,
    bracketOrder: order,
    nextMatchId,
    nextMatchSlot,
    venue,
    scheduledTime,
    status: 'UPCOMING',
    elapsedSeconds: 0,
    durationMinutes: matchDuration,
    homeId: 'TBD',
    awayId: 'TBD',
    homeName: 'TBD',
    awayName: 'TBD',
    homeShort: 'TBD',
    awayShort: 'TBD',
    homeColor: '#32382D',
    awayColor: '#32382D',
    homeScore: 0,
    awayScore: 0,
    stats: EMPTY_STATS(),
    events: [],
  });

  const matches: Match[] = [];
  let cursorMinutes = parseStartTimeMinutes(startTime);
  const safeCooldown = Math.max(0, Number(cooldownMinutes) || 0);
  const qfMins = Math.max(4, Number(qfDurationMinutes) || 10);
  const sfFinalMins = Math.max(4, Number(sfFinalDurationMinutes) || 15);

  const allocateSlot = (stageDuration: number): string => {
    const label = formatMinutesClock(cursorMinutes, dateLabel);
    cursorMinutes += stageDuration + safeCooldown;
    return label;
  };

  // 1. R16 (8 matches) if starting at R16
  if (startStage === 'R16') {
    for (let i = 0; i < 8; i++) {
      const targetQfId = qfIds[Math.floor(i / 2)];
      const slot: 'HOME' | 'AWAY' = i % 2 === 0 ? 'HOME' : 'AWAY';
      matches.push(
        createEmptyMatch(
          r16Ids[i],
          'R16',
          i + 1,
          allocateSlot(qfMins),
          qfMins,
          targetQfId,
          slot
        )
      );
    }
  }

  // 2. Quarter-Finals (4 matches) if starting at R16 or QF
  if (startStage === 'R16' || startStage === 'QF') {
    for (let i = 0; i < 4; i++) {
      const targetSfId = sfIds[Math.floor(i / 2)];
      const slot: 'HOME' | 'AWAY' = i % 2 === 0 ? 'HOME' : 'AWAY';
      matches.push(
        createEmptyMatch(
          qfIds[i],
          'QF',
          i + 1,
          allocateSlot(qfMins),
          qfMins,
          targetSfId,
          slot
        )
      );
    }
  }

  // 3. Semi-Finals (2 matches)
  for (let i = 0; i < 2; i++) {
    const slot: 'HOME' | 'AWAY' = i === 0 ? 'HOME' : 'AWAY';
    matches.push(
      createEmptyMatch(
        sfIds[i],
        'SF',
        i + 1,
        allocateSlot(sfFinalMins),
        sfFinalMins,
        finalId,
        slot
      )
    );
  }

  // 4. Grand Final (1 match)
  matches.push(
    createEmptyMatch(
      finalId,
      'FINAL',
      1,
      allocateSlot(sfFinalMins),
      sfFinalMins,
      undefined,
      undefined
    )
  );

  // Seed participants into the starting stage
  const orderedParticipants =
    seedChampionshipOrder && startStage === 'QF'
      ? orderChampionshipQuarterFinalSeeds(participants)
      : participants;
  const entryStageMatches = matches.filter((m) => m.stage === startStage);
  const totalSlots = entryStageMatches.length * 2;
  const padded: (BracketParticipant | null)[] = Array.from(
    { length: totalSlots },
    (_, i) => orderedParticipants[i] ?? null
  );

  // Pair top seeds with bottom slots or sequential pairs
  for (let i = 0; i < entryStageMatches.length; i++) {
    const match = entryStageMatches[i];
    const home = padded[i * 2];
    const away = padded[i * 2 + 1];

    if (home) {
      match.homeId = home.id;
      match.homeName = home.name;
      match.homeShort = home.shortCode;
      match.homeColor = home.color;
    }
    if (away) {
      match.awayId = away.id;
      match.awayName = away.name;
      match.awayShort = away.shortCode;
      match.awayColor = away.color;
    }

    // If a team is paired with an empty slot (BYE) when fewer teams registered,
    // keep the slot open as "Awaiting Qualifier / Draw" so new registrations can fill it,
    // or allow the Admin to advance them with 1 click.
  }

  return matches;
}

/**
 * Determines the winner of a knockout match (by regular score or penalties)
 * and advances them into the next round match slot (R16 -> QF -> SF -> FINAL).
 */
export function resolveMatchWinnerSide(
  match: Match
): 'HOME' | 'AWAY' | null {
  if (match.status !== 'FT') return null;
  if (match.homeScore > match.awayScore) return 'HOME';
  if (match.awayScore > match.homeScore) return 'AWAY';
  if (
    typeof match.homePenalties === 'number' &&
    typeof match.awayPenalties === 'number' &&
    match.homePenalties !== match.awayPenalties
  ) {
    return match.homePenalties > match.awayPenalties ? 'HOME' : 'AWAY';
  }
  return null;
}

export function propagateKnockoutProgression(matches: Match[]): Match[] {
  const cloned = matches.map((m) => ({ ...m }));
  const byId = new Map<string, Match>();
  for (const m of cloned) {
    byId.set(m.id, m);
  }

  const stageOrder: KnockoutStage[] = ['R16', 'QF', 'SF'];

  for (const stage of stageOrder) {
    const stageMatches = cloned.filter((m) => m.stage === stage);
    for (const m of stageMatches) {
      if (!m.nextMatchId || !m.nextMatchSlot) continue;
      const nextMatch = byId.get(m.nextMatchId);
      if (!nextMatch) continue;

      const winnerSide = resolveMatchWinnerSide(m);
      if (winnerSide === 'HOME') {
        if (m.nextMatchSlot === 'HOME') {
          nextMatch.homeId = m.homeId;
          nextMatch.homeName = m.homeName;
          nextMatch.homeShort = m.homeShort;
          nextMatch.homeColor = m.homeColor;
        } else {
          nextMatch.awayId = m.homeId;
          nextMatch.awayName = m.homeName;
          nextMatch.awayShort = m.homeShort;
          nextMatch.awayColor = m.homeColor;
        }
      } else if (winnerSide === 'AWAY') {
        if (m.nextMatchSlot === 'HOME') {
          nextMatch.homeId = m.awayId;
          nextMatch.homeName = m.awayName;
          nextMatch.homeShort = m.awayShort;
          nextMatch.homeColor = m.awayColor;
        } else {
          nextMatch.awayId = m.awayId;
          nextMatch.awayName = m.awayName;
          nextMatch.awayShort = m.awayShort;
          nextMatch.awayColor = m.awayColor;
        }
      }
    }
  }

  return cloned;
}
