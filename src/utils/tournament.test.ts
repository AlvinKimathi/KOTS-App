import { describe, expect, it } from 'vitest';
import {
  DEFAULT_ADMIN_ACCOUNTS,
  INITIAL_MATCHES,
  INITIAL_TEAMS_7ASIDE,
  INITIAL_USER_SESSION,
} from '../data/initialTournamentData';
import {
  authenticateAccount,
  createSpectatorAccount,
} from './authHelper';
import {
  calculateLeagueStandings,
  calculatePlayerLeaderboards,
} from './standingsCalculator';
import {
  generateKnockoutBracket,
  getRecommendedKnockoutStartStage,
  propagateKnockoutProgression,
} from './knockoutEngine';
import { parseAdminPlayerList } from './adminRosterParser';
import { getEffectiveElapsedSeconds } from './clockHelper';
import { generateLeagueFixturesForTeams } from './drawGenerator';

describe('King of the Streets Cup — Standings & Discipline Engine', () => {
  it('calculates Points, GD, GF, GA, Yellow Cards, and Red Cards accurately for the 7-Aside League', () => {
    const league = calculateLeagueStandings(
      INITIAL_TEAMS_7ASIDE,
      INITIAL_MATCHES
    );

    expect(league).toHaveLength(8);
    // Runda Royals FC is leading LIVE match 2-1 -> 3 pts, GF 2, GA 1, GD +1, YC 1
    const runda = league.find((r) => r.shortCode === 'RND')!;
    expect(runda.points).toBe(3);
    expect(runda.gf).toBe(2);
    expect(runda.ga).toBe(1);
    expect(runda.gd).toBe(1);
    expect(runda.yellowCards).toBe(1);

    // Kiambu Road Kings & Westlands Athletic drew 1-1, but WST has 0 YC while KRK has 2 YC
    const wst = league.find((r) => r.shortCode === 'WST')!;
    const krk = league.find((r) => r.shortCode === 'KRK')!;
    expect(wst.points).toBe(1);
    expect(krk.points).toBe(1);
    expect(league.indexOf(wst)).toBeLessThan(league.indexOf(krk));
  });

  it('calculates player goals, assists, and cards across active matches', () => {
    const leaders = calculatePlayerLeaderboards(
      INITIAL_TEAMS_7ASIDE,
      INITIAL_MATCHES
    );
    const sean = leaders.find((p) => p.playerName === 'Sean Masika')!;
    expect(sean.goals).toBe(2);
    expect(sean.assists).toBe(1);
  });
});

describe('King of the Streets Cup — Dynamic R16 Knockout Engine', () => {
  it('recommends starting knockout round dynamically based on registered teams', () => {
    expect(getRecommendedKnockoutStartStage(16)).toBe('R16');
    expect(getRecommendedKnockoutStartStage(10)).toBe('R16');
    expect(getRecommendedKnockoutStartStage(8)).toBe('QF');
    expect(getRecommendedKnockoutStartStage(4)).toBe('SF');
  });

  it('generates R16 -> QF -> SF -> FINAL tree and advances winners automatically', () => {
    const bracket = generateKnockoutBracket({
      category: '7aside',
      startStage: 'R16',
      participants: INITIAL_TEAMS_7ASIDE.map((t) => ({
        id: t.id,
        name: t.name,
        shortCode: t.shortCode,
        color: t.badgeColor,
      })),
    });

    const r16Matches = bracket.filter((m) => m.stage === 'R16');
    const qfMatches = bracket.filter((m) => m.stage === 'QF');
    const sfMatches = bracket.filter((m) => m.stage === 'SF');
    const finalMatches = bracket.filter((m) => m.stage === 'FINAL');

    expect(r16Matches).toHaveLength(8);
    expect(qfMatches).toHaveLength(4);
    expect(sfMatches).toHaveLength(2);
    expect(finalMatches).toHaveLength(1);

    // Finish R16 #1 with Home win (2-0) and R16 #2 with Away win via penalties (1-1, 3-4 pens)
    bracket[0].status = 'FT';
    bracket[0].homeScore = 2;
    bracket[0].awayScore = 0;

    bracket[1].status = 'FT';
    bracket[1].homeScore = 1;
    bracket[1].awayScore = 1;
    bracket[1].homePenalties = 3;
    bracket[1].awayPenalties = 4;

    const progressed = propagateKnockoutProgression(bracket);
    const updatedQf1 = progressed.find((m) => m.id === '7aside-ko-qf-1')!;

    expect(updatedQf1.homeId).toBe(bracket[0].homeId);
    expect(updatedQf1.awayId).toBe(bracket[1].awayId);
  });
});

describe('Admin Player List Parser', () => {
  it('extracts up to 10 clean player names from numbered lines', () => {
    const raw = `
      1. Brian Ochieng (GK)
      2) Kevin Mwangi
      3 - Dennis Kiprop
      4. Ian Kamau
    `;
    expect(parseAdminPlayerList(raw)).toEqual([
      'Brian Ochieng',
      'Kevin Mwangi',
      'Dennis Kiprop',
      'Ian Kamau',
    ]);
  });
});

describe('Authentication & Strict Role Separation', () => {
  it('starts unauthenticated on the landing page by default', () => {
    expect(INITIAL_USER_SESSION.isAuthenticated).toBe(false);
    expect(INITIAL_USER_SESSION.role).toBe('SPECTATOR');
  });

  it('authenticates Kim as ADMIN only with valid organizer password', () => {
    const failRes = authenticateAccount({
      identifier: 'Kim',
      password: 'wrong-password',
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts: [],
    });
    expect(failRes.ok).toBe(false);

    const okRes = authenticateAccount({
      identifier: 'kim',
      password: 'KOTS2026',
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts: [],
    });
    expect(okRes.ok).toBe(true);
    if (okRes.ok) {
      expect(okRes.session.isAuthenticated).toBe(true);
      expect(okRes.session.username).toBe('Kim');
      expect(okRes.session.role).toBe('ADMIN');
    }
  });

  it('locks self-created accounts to SPECTATOR and blocks reserved Admin usernames', () => {
    const reservedAttempt = createSpectatorAccount({
      username: 'Kim',
      contact: '0700000000',
      password: 'password123',
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts: [],
    });
    expect(reservedAttempt.ok).toBe(false);

    const specCreated = createSpectatorAccount({
      username: 'Alex',
      contact: '0711223344',
      password: 'pass1234',
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts: [],
    });
    expect(specCreated.ok).toBe(true);
    if (specCreated.ok) {
      expect(specCreated.session.role).toBe('SPECTATOR');
      expect(specCreated.createdAccount?.role).toBe('SPECTATOR');

      const loginBack = authenticateAccount({
        identifier: '0711223344',
        password: 'pass1234',
        adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
        spectatorAccounts: [specCreated.createdAccount!],
      });
      expect(loginBack.ok).toBe(true);
      if (loginBack.ok) {
        expect(loginBack.session.role).toBe('SPECTATOR');
      }
    }
  });
});

describe('Drift-Free UTC Timestamped Match Clock', () => {
  it('computes identical elapsed seconds across devices from clockStartedAt without client-tick drift', () => {
    const baseMatch = {
      ...INITIAL_MATCHES[0],
      status: 'LIVE' as const,
      isClockRunning: true,
      elapsedSeconds: 120,
      clockStartedAt: 1_700_000_000_000,
    };

    // 45 seconds after clockStartedAt -> 120 + 45 = 165 seconds
    expect(getEffectiveElapsedSeconds(baseMatch, 1_700_000_045_000)).toBe(165);

    // Paused match returns accumulated elapsedSeconds directly
    const pausedMatch = {
      ...baseMatch,
      isClockRunning: false,
      clockStartedAt: null,
    };
    expect(getEffectiveElapsedSeconds(pausedMatch, 1_700_000_099_000)).toBe(
      120
    );
  });
});

describe('Automated League Fixtures Generator (Single Round-Robin)', () => {
  it('generates 7 matchdays and 28 unique fixtures for 8 league teams with custom kickoff & duration', () => {
    const { leagueMatches, matchdayCount } = generateLeagueFixturesForTeams({
      teams: INITIAL_TEAMS_7ASIDE,
      dateLabel: '14 Nov',
      startTime: '10:30',
      durationMinutes: 15,
      slotIntervalMinutes: 20,
      venue: 'Pitch 1 (Kasarani)',
      shuffleTeams: false,
    });

    expect(matchdayCount).toBe(7);
    expect(leagueMatches).toHaveLength(28);
    expect(leagueMatches.every((m) => m.stage === 'LEAGUE')).toBe(true);
    expect(leagueMatches.every((m) => m.groupId === 'League')).toBe(true);
    expect(leagueMatches.every((m) => m.durationMinutes === 15)).toBe(true);
    expect(leagueMatches.every((m) => m.venue === 'Pitch 1 (Kasarani)')).toBe(
      true
    );
    expect(leagueMatches[0].scheduledTime).toBe('14 Nov • 10:30');
    expect(leagueMatches[1].scheduledTime).toBe('14 Nov • 10:50');
    expect(leagueMatches[0].matchday).toBe(1);

    // Ensure every pair plays exactly once
    const pairKeys = new Set(
      leagueMatches.map((m) => [m.homeId, m.awayId].sort().join('__'))
    );
    expect(pairKeys.size).toBe(28);
  });
});

describe('Top-8 Championship Knockout Tiered Timing & Seeding', () => {
  it('seeds Top 8 as 1v8, 4v5, 2v7, 3v6 and schedules 10m QFs + 15m Semis & Final with 5m cooldowns', () => {
    const participants = INITIAL_TEAMS_7ASIDE.slice(0, 8).map((t) => ({
      id: t.id,
      name: t.name,
      shortCode: t.shortCode,
      color: t.badgeColor,
    }));

    const ko = generateKnockoutBracket({
      category: '7aside',
      participants,
      startStage: 'QF',
      dateLabel: '14 Nov',
      startTime: '17:15',
      qfDurationMinutes: 10,
      sfFinalDurationMinutes: 15,
      cooldownMinutes: 5,
      seedChampionshipOrder: true,
    });

    expect(ko).toHaveLength(7);

    const qfs = ko.filter((m) => m.stage === 'QF');
    const sfs = ko.filter((m) => m.stage === 'SF');
    const finals = ko.filter((m) => m.stage === 'FINAL');

    expect(qfs).toHaveLength(4);
    expect(sfs).toHaveLength(2);
    expect(finals).toHaveLength(1);

    // Championship seeding pairings: 1v8, 4v5, 2v7, 3v6
    expect(qfs[0].homeId).toBe(participants[0].id);
    expect(qfs[0].awayId).toBe(participants[7].id);
    expect(qfs[1].homeId).toBe(participants[3].id);
    expect(qfs[1].awayId).toBe(participants[4].id);
    expect(qfs[2].homeId).toBe(participants[1].id);
    expect(qfs[2].awayId).toBe(participants[6].id);
    expect(qfs[3].homeId).toBe(participants[2].id);
    expect(qfs[3].awayId).toBe(participants[5].id);

    // Consecutive timings with 5m cooldowns
    expect(qfs.map((m) => m.scheduledTime)).toEqual([
      '14 Nov • 17:15',
      '14 Nov • 17:30',
      '14 Nov • 17:45',
      '14 Nov • 18:00',
    ]);
    expect(qfs.every((m) => m.durationMinutes === 10)).toBe(true);

    expect(sfs.map((m) => m.scheduledTime)).toEqual([
      '14 Nov • 18:15',
      '14 Nov • 18:35',
    ]);
    expect(sfs.every((m) => m.durationMinutes === 15)).toBe(true);

    expect(finals[0].scheduledTime).toBe('14 Nov • 18:55');
    expect(finals[0].durationMinutes).toBe(15);
  });
});
