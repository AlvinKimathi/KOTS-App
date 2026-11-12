import { Match, StandingRow, Team7Aside } from '../types/tournament';

/**
 * Calculates live and completed group standings for 7-Aside teams,
 * including Points (PTS), Goal Difference (GD), Goals For (GF), Goals Against (GA),
 * Yellow Cards (YC), Red Cards (RC), and Head-to-Head / Discipline tie-breakers.
 */
export function calculateGroupStandings(
  teams: Team7Aside[],
  matches: Match[],
  groupId?: string
): StandingRow[] {
  const filteredTeams = groupId
    ? teams.filter((t) => t.groupId === groupId)
    : teams;

  const rowsMap = new Map<string, StandingRow>();

  for (const team of filteredTeams) {
    rowsMap.set(team.id, {
      teamId: team.id,
      teamName: team.name,
      shortCode: team.shortCode,
      badgeColor: team.badgeColor,
      groupId: team.groupId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      gf: 0,
      ga: 0,
      gd: 0,
      points: 0,
      yellowCards: 0,
      redCards: 0,
      disciplineScore: 0,
      form: [],
    });
  }

  // Filter relevant group stage matches that have started (LIVE, HT, or FT)
  const relevantMatches = matches.filter(
    (m) =>
      m.category === '7aside' &&
      m.stage === 'GROUP' &&
      (m.status === 'LIVE' || m.status === 'HT' || m.status === 'FT') &&
      (!groupId || m.groupId === groupId)
  );

  for (const match of relevantMatches) {
    const homeRow = rowsMap.get(match.homeId);
    const awayRow = rowsMap.get(match.awayId);

    if (homeRow) {
      homeRow.played += 1;
      homeRow.gf += match.homeScore;
      homeRow.ga += match.awayScore;
      homeRow.gd = homeRow.gf - homeRow.ga;
      homeRow.yellowCards += match.stats.yellowCards[0];
      homeRow.redCards += match.stats.redCards[0];
      homeRow.disciplineScore = homeRow.yellowCards + homeRow.redCards * 3;

      if (match.homeScore > match.awayScore) {
        homeRow.won += 1;
        homeRow.points += 3;
        homeRow.form.push('W');
      } else if (match.homeScore === match.awayScore) {
        homeRow.drawn += 1;
        homeRow.points += 1;
        homeRow.form.push('D');
      } else {
        homeRow.lost += 1;
        homeRow.form.push('L');
      }
    }

    if (awayRow) {
      awayRow.played += 1;
      awayRow.gf += match.awayScore;
      awayRow.ga += match.homeScore;
      awayRow.gd = awayRow.gf - awayRow.ga;
      awayRow.yellowCards += match.stats.yellowCards[1];
      awayRow.redCards += match.stats.redCards[1];
      awayRow.disciplineScore = awayRow.yellowCards + awayRow.redCards * 3;

      if (match.awayScore > match.homeScore) {
        awayRow.won += 1;
        awayRow.points += 3;
        awayRow.form.push('W');
      } else if (match.awayScore === match.homeScore) {
        awayRow.drawn += 1;
        awayRow.points += 1;
        awayRow.form.push('D');
      } else {
        awayRow.lost += 1;
        awayRow.form.push('L');
      }
    }
  }

  const rows = Array.from(rowsMap.values()).map((r) => ({
    ...r,
    form: r.form.slice(-5),
  }));

  // Tie-breaker sorting:
  // 1. Points (descending)
  // 2. Goal Difference (descending)
  // 3. Goals For (descending)
  // 4. Head-to-Head points between the two teams
  // 5. Discipline Score (ascending: fewer cards wins)
  // 6. Alphabetical Team Name
  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.gd !== a.gd) return b.gd - a.gd;
    if (b.gf !== a.gf) return b.gf - a.gf;

    const h2hDiff = compareHeadToHead(a.teamId, b.teamId, relevantMatches);
    if (h2hDiff !== 0) return h2hDiff;

    if (a.disciplineScore !== b.disciplineScore) {
      return a.disciplineScore - b.disciplineScore;
    }

    return a.teamName.localeCompare(b.teamName);
  });

  return rows;
}

function compareHeadToHead(
  teamAId: string,
  teamBId: string,
  matches: Match[]
): number {
  let pointsA = 0;
  let pointsB = 0;

  for (const m of matches) {
    if (m.homeId === teamAId && m.awayId === teamBId) {
      if (m.homeScore > m.awayScore) pointsA += 3;
      else if (m.homeScore < m.awayScore) pointsB += 3;
      else {
        pointsA += 1;
        pointsB += 1;
      }
    } else if (m.homeId === teamBId && m.awayId === teamAId) {
      if (m.homeScore > m.awayScore) pointsB += 3;
      else if (m.homeScore < m.awayScore) pointsA += 3;
      else {
        pointsA += 1;
        pointsB += 1;
      }
    }
  }

  return pointsB - pointsA;
}

export interface PlayerLeaderboardItem {
  playerId: string;
  playerName: string;
  jerseyNumber: number;
  teamId: string;
  teamName: string;
  teamShort: string;
  teamColor: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

/**
 * Aggregates player goals, assists, yellow cards, and red cards across all 7-Aside matches
 * combined with base squad stats.
 */
export function calculatePlayerLeaderboards(
  teams: Team7Aside[],
  matches: Match[]
): PlayerLeaderboardItem[] {
  const playerMap = new Map<string, PlayerLeaderboardItem>();

  for (const team of teams) {
    for (const p of team.players) {
      playerMap.set(p.id, {
        playerId: p.id,
        playerName: p.name,
        jerseyNumber: p.jerseyNumber,
        teamId: team.id,
        teamName: team.name,
        teamShort: team.shortCode,
        teamColor: team.badgeColor,
        goals: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
      });
    }
  }

  const activeMatches = matches.filter(
    (m) =>
      m.category === '7aside' &&
      (m.status === 'LIVE' || m.status === 'HT' || m.status === 'FT')
  );

  for (const match of activeMatches) {
    for (const ev of match.events) {
      if (ev.playerId && playerMap.has(ev.playerId)) {
        const item = playerMap.get(ev.playerId)!;
        if (ev.type === 'GOAL') item.goals += 1;
        if (ev.type === 'YELLOW_CARD') item.yellowCards += 1;
        if (ev.type === 'RED_CARD') item.redCards += 1;
      }
      if (ev.type === 'GOAL' && ev.assistPlayerId && playerMap.has(ev.assistPlayerId)) {
        const assister = playerMap.get(ev.assistPlayerId)!;
        assister.assists += 1;
      }
    }
  }

  return Array.from(playerMap.values());
}
