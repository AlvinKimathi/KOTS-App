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
  calculateGroupStandings,
  calculatePlayerLeaderboards,
} from './standingsCalculator';
import {
  generateKnockoutBracket,
  getRecommendedKnockoutStartStage,
  propagateKnockoutProgression,
} from './knockoutEngine';
import { parseAdminPlayerList } from './adminRosterParser';
import { getEffectiveElapsedSeconds } from './clockHelper';
import {
  generateRandomGroupDrawAndFixtures,
  getRecommendedGroupCount,
} from './drawGenerator';

describe('King of the Streets Cup — Standings & Discipline Engine', () => {
  it('calculates Points, GD, GF, GA, Yellow Cards, and Red Cards accurately for Group A & B', () => {
    const groupA = calculateGroupStandings(
      INITIAL_TEAMS_7ASIDE,
      INITIAL_MATCHES,
      'Group A'
    );

    expect(groupA).toHaveLength(4);
    // Runda Royals FC is leading LIVE match 2-1 -> 3 pts, GF 2, GA 1, GD +1, YC 1
    const runda = groupA.find((r) => r.shortCode === 'RND')!;
    expect(runda.points).toBe(3);
    expect(runda.gf).toBe(2);
    expect(runda.ga).toBe(1);
    expect(runda.gd).toBe(1);
    expect(runda.yellowCards).toBe(1);

    // Kiambu Road Kings & Westlands Athletic drew 1-1, but WST has 0 YC while KRK has 2 YC
    const wst = groupA.find((r) => r.shortCode === 'WST')!;
    const krk = groupA.find((r) => r.shortCode === 'KRK')!;
    expect(wst.points).toBe(1);
    expect(krk.points).toBe(1);
    expect(groupA.indexOf(wst)).toBeLessThan(groupA.indexOf(krk));
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

describe('Automated Random Group Draw & Round-Robin Fixture Generator', () => {
  it('recommends group count dynamically based on registered teams', () => {
    expect(getRecommendedGroupCount(8)).toBe(2);
    expect(getRecommendedGroupCount(12)).toBe(3);
    expect(getRecommendedGroupCount(16)).toBe(4);
  });

  it('randomly draws 8 teams into 2 groups of 4 and generates all 12 round-robin fixtures', () => {
    const { updatedTeams, groupMatches, groupLabels } =
      generateRandomGroupDrawAndFixtures({
        teams: INITIAL_TEAMS_7ASIDE,
        groupCount: 'AUTO',
      });

    expect(groupLabels).toEqual(['Group A', 'Group B']);
    expect(updatedTeams).toHaveLength(8);
    expect(updatedTeams.filter((t) => t.groupId === 'Group A')).toHaveLength(4);
    expect(updatedTeams.filter((t) => t.groupId === 'Group B')).toHaveLength(4);

    // 4 teams per group = 6 matches per group * 2 groups = 12 round-robin fixtures
    expect(groupMatches).toHaveLength(12);
    expect(
      groupMatches.filter((m) => m.groupId === 'Group A' && m.stage === 'GROUP')
    ).toHaveLength(6);
    expect(
      groupMatches.filter((m) => m.groupId === 'Group B' && m.stage === 'GROUP')
    ).toHaveLength(6);
  });
});
