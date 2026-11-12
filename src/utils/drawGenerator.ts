import { Match, MatchStats, Team7Aside } from '../types/tournament';

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
 * Determines the recommended number of groups based on the number of registered 7-Aside teams.
 * - Up to 9 teams -> 2 Groups (Group A, Group B)
 * - 10 to 12 teams -> 3 Groups (Group A, Group B, Group C)
 * - 13+ teams -> 4 Groups (Group A, Group B, Group C, Group D)
 */
export function getRecommendedGroupCount(teamCount: number): 2 | 3 | 4 {
  if (teamCount >= 13) return 4;
  if (teamCount >= 10) return 3;
  return 2;
}

/**
 * Formats a scheduled kickoff timestamp starting at 09:00 on 14 Nov and advancing by 25 minutes per slot.
 */
function formatGroupKickoffTime(slotIndex: number): string {
  const startMinutes = 9 * 60 + slotIndex * 25;
  const hours24 = Math.floor(startMinutes / 60) % 24;
  const mins = startMinutes % 60;
  return `14 Nov • ${String(hours24).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0'
  )}`;
}

/**
 * Generates round-robin pairings for a single group of teams using the circle method
 * so teams get balanced rest between fixtures.
 */
function buildGroupRoundRobinPairs(
  groupTeams: Team7Aside[]
): Array<[Team7Aside, Team7Aside]> {
  if (groupTeams.length < 2) return [];

  const list: Array<Team7Aside | null> = [...groupTeams];
  if (list.length % 2 !== 0) {
    list.push(null); // dummy bye slot for odd-sized group
  }

  const n = list.length;
  const rounds = n - 1;
  const half = n / 2;
  const pairs: Array<[Team7Aside, Team7Aside]> = [];

  const rotating = [...list];

  for (let r = 0; r < rounds; r++) {
    for (let i = 0; i < half; i++) {
      const home = rotating[i];
      const away = rotating[n - 1 - i];
      if (home && away) {
        pairs.push(r % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    // Rotate all elements except index 0
    const last = rotating.pop() ?? null;
    rotating.splice(1, 0, last);
  }

  return pairs;
}

/**
 * Generates all Group Stage round-robin fixtures across all active groups,
 * interleaved across groups (Group A Match 1, Group B Match 1, etc.) so groups alternate on the pitch.
 */
export function generateRoundRobinFixturesForTeams(
  teams: Team7Aside[],
  venue: string = 'BALLMANIA RUNDA'
): Match[] {
  const assignedTeams = teams.filter(
    (t) => t.groupId && t.groupId.startsWith('Group ')
  );
  const groupLabels = Array.from(
    new Set(assignedTeams.map((t) => t.groupId))
  ).sort();

  const pairsByGroup = new Map<string, Array<[Team7Aside, Team7Aside]>>();
  let maxPairsInAnyGroup = 0;

  for (const groupId of groupLabels) {
    const groupTeams = assignedTeams.filter((t) => t.groupId === groupId);
    const pairs = buildGroupRoundRobinPairs(groupTeams);
    pairsByGroup.set(groupId, pairs);
    if (pairs.length > maxPairsInAnyGroup) {
      maxPairsInAnyGroup = pairs.length;
    }
  }

  const matches: Match[] = [];
  let matchCounter = 0;

  for (let pairIdx = 0; pairIdx < maxPairsInAnyGroup; pairIdx++) {
    for (const groupId of groupLabels) {
      const pairs = pairsByGroup.get(groupId);
      if (!pairs || !pairs[pairIdx]) continue;
      const [home, away] = pairs[pairIdx];
      const groupLetter = groupId.replace('Group ', '').trim().toLowerCase();

      matches.push({
        id: `7a-grp-${groupLetter}-${pairIdx + 1}-${home.shortCode.toLowerCase()}-${away.shortCode.toLowerCase()}`,
        category: '7aside',
        stage: 'GROUP',
        groupId,
        venue,
        scheduledTime: formatGroupKickoffTime(matchCounter),
        status: 'UPCOMING',
        elapsedSeconds: 0,
        clockStartedAt: null,
        durationMinutes: 20,
        homeId: home.id,
        awayId: away.id,
        homeName: home.name,
        awayName: away.name,
        homeShort: home.shortCode,
        awayShort: away.shortCode,
        homeColor: home.badgeColor,
        awayColor: away.badgeColor,
        homeScore: 0,
        awayScore: 0,
        stats: EMPTY_STATS(),
        events: [],
      });

      matchCounter += 1;
    }
  }

  return matches;
}

/**
 * Randomly shuffles all registered 7-Aside teams into evenly balanced groups
 * (Group A, Group B, Group C, Group D) and automatically generates the complete
 * round-robin Group Stage fixture schedule.
 */
export function generateRandomGroupDrawAndFixtures(params: {
  teams: Team7Aside[];
  groupCount?: 'AUTO' | 2 | 3 | 4;
  venue?: string;
}): {
  updatedTeams: Team7Aside[];
  groupMatches: Match[];
  groupLabels: string[];
} {
  const { teams, groupCount = 'AUTO', venue = 'BALLMANIA RUNDA' } = params;

  const resolvedCount =
    groupCount === 'AUTO' ? getRecommendedGroupCount(teams.length) : groupCount;

  const groupLabels = ['Group A', 'Group B', 'Group C', 'Group D'].slice(
    0,
    resolvedCount
  );

  // Fisher-Yates random shuffle
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }

  // Assign each shuffled team to a group in round-robin order for balanced group sizes
  const groupByTeamId = new Map<string, string>();
  shuffled.forEach((team, index) => {
    const targetGroup = groupLabels[index % resolvedCount];
    groupByTeamId.set(team.id, targetGroup);
  });

  // Sort updated teams by group then order of draw so Group A, Group B tables look tidy
  const updatedTeams = teams.map((team) => ({
    ...team,
    groupId: groupByTeamId.get(team.id) || 'Group A',
  }));

  // Use the shuffled order inside each group so match pairings are also randomized
  const shuffledUpdatedTeams = shuffled.map((team) => ({
    ...team,
    groupId: groupByTeamId.get(team.id) || 'Group A',
  }));

  const groupMatches = generateRoundRobinFixturesForTeams(
    shuffledUpdatedTeams,
    venue
  );

  return {
    updatedTeams,
    groupMatches,
    groupLabels,
  };
}
