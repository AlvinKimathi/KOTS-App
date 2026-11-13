import React, { useEffect, useState } from 'react';
import { Award, ArrowRight } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  formatMatchClock,
  IconlySearchButton,
  IconlySettingsButton,
  SectionTabHeader,
  TeamCrestBadge,
  UpcomingMatchCard,
} from '../components/ui/FigmaWidgets';
import {
  calculateLeagueStandings,
  calculatePlayerLeaderboards,
} from '../utils/standingsCalculator';
import { resolveMatchWinnerSide } from '../utils/knockoutEngine';
import { AppNavTab, KnockoutStage, Match } from '../types/tournament';

export type StandingsSubTab = 'league' | 'knockout' | 'stats' | '1v1';

/**
 * Shared Knockout Bracket section used by both 7-Aside Knockouts and 1v1 Arena.
 */
const KnockoutBracketSection: React.FC<{
  matches: Match[];
  activeStages: KnockoutStage[];
  finalTitle: string;
  emptyLabel: string;
  onSelectMatch: (matchId: string) => void;
}> = ({ matches, activeStages, finalTitle, emptyLabel, onSelectMatch }) => {
  if (activeStages.length === 0) {
    return (
      <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-6 text-center text-xs text-[#8E8E8E] shadow-card">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {activeStages.map((stage) => {
        const stageMatches = matches
          .filter((m) => m.stage === stage)
          .sort((a, b) => (a.bracketOrder || 0) - (b.bracketOrder || 0));

        const stageTitle = {
          LEAGUE: 'League Stage',
          GROUP: 'Group Stage',
          R16: 'Round of 16 (R16)',
          QF: 'Quarter-Finals (QF)',
          SF: 'Semi-Finals (SF)',
          FINAL: finalTitle,
        }[stage];

        return (
          <div key={stage} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-md bg-[#C8F558] text-[#161616] text-[10px] font-bold uppercase">
                  {stage}
                </span>
                <span className="text-xs font-bold text-white">
                  {stageTitle}
                </span>
              </div>
              <span className="font-quicksand text-[11px] text-[#8E8E8E]">
                {stageMatches.length}{' '}
                {stageMatches.length === 1 ? 'Tie' : 'Ties'}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {stageMatches.map((m) => {
                const winnerSide = resolveMatchWinnerSide(m);
                const hasPens =
                  typeof m.homePenalties === 'number' &&
                  typeof m.awayPenalties === 'number';
                return (
                  <div
                    key={m.id}
                    className="rounded-[14px] bg-[#161616] border border-white/[0.06] p-3.5 space-y-2.5 hover:border-white/15 transition-all shadow-card"
                  >
                    <div className="flex items-center justify-between text-[10px] text-[#8E8E8E]">
                      <span className="font-bold text-[#C8F558]">
                        {m.stage} #{m.bracketOrder}
                      </span>
                      <span className="font-bold text-white">
                        {formatMatchClock(m)}
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ${
                        winnerSide === 'HOME'
                          ? 'bg-[#C8F558]/15 border border-[#C8F558]/40'
                          : 'bg-[#242224]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TeamCrestBadge
                          shortCode={m.homeShort}
                          color={m.homeColor}
                          size="xs"
                        />
                        <span className="text-xs font-bold text-white truncate">
                          {m.homeName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {m.homeScore}
                        {hasPens ? ` (${m.homePenalties})` : ''}
                      </span>
                    </div>

                    <div
                      className={`flex items-center justify-between gap-2 p-2.5 rounded-xl ${
                        winnerSide === 'AWAY'
                          ? 'bg-[#C8F558]/15 border border-[#C8F558]/40'
                          : 'bg-[#242224]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <TeamCrestBadge
                          shortCode={m.awayShort}
                          color={m.awayColor}
                          size="xs"
                        />
                        <span className="text-xs font-bold text-white truncate">
                          {m.awayName}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {m.awayScore}
                        {hasPens ? ` (${m.awayPenalties})` : ''}
                      </span>
                    </div>

                    <div className="pt-1 flex items-center justify-between">
                      <span className="font-quicksand text-[11px] font-semibold text-[#7C9A32]">
                        {m.scheduledTime} • {m.durationMinutes} min
                      </span>
                      <button
                        type="button"
                        onClick={() => onSelectMatch(m.id)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#C8F558] hover:underline"
                      >
                        <span>Fixture Center</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export const TournamentView: React.FC<{
  initialSubTab?: StandingsSubTab;
  onSelectMatch: (matchId: string) => void;
  onOpenSearch: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({
  initialSubTab = 'league',
  onSelectMatch,
  onOpenSearch,
  onNavigateTab,
}) => {
  const { teams7Aside, players1v1, matches } = useTournament();

  const [activeSubTab, setActiveSubTab] =
    useState<StandingsSubTab>(initialSubTab);
  const [selectedMatchday, setSelectedMatchday] = useState<number | 'ALL'>('ALL');

  useEffect(() => {
    setActiveSubTab(initialSubTab);
  }, [initialSubTab]);

  const leagueStandings = calculateLeagueStandings(teams7Aside, matches);

  const leagueFixtures = matches.filter(
    (m) => m.category === '7aside' && (m.stage === 'LEAGUE' || m.stage === 'GROUP')
  );

  const availableMatchdays = Array.from(
    new Set(
      leagueFixtures
        .map((m) => m.matchday)
        .filter((md): md is number => typeof md === 'number' && md > 0)
    )
  ).sort((a, b) => a - b);

  const filteredLeagueFixtures =
    selectedMatchday === 'ALL'
      ? leagueFixtures
      : leagueFixtures.filter((m) => m.matchday === selectedMatchday);

  const stagesOrder: KnockoutStage[] = ['R16', 'QF', 'SF', 'FINAL'];

  const knockout7AsideMatches = matches.filter(
    (m) => m.category === '7aside' && m.stage !== 'GROUP' && m.stage !== 'LEAGUE'
  );
  const active7AsideStages = stagesOrder.filter((st) =>
    knockout7AsideMatches.some((m) => m.stage === st)
  );

  const knockout1v1Matches = matches.filter(
    (m) => m.category === '1v1' && m.stage !== 'GROUP' && m.stage !== 'LEAGUE'
  );
  const active1v1Stages = stagesOrder.filter((st) =>
    knockout1v1Matches.some((m) => m.stage === st)
  );

  const playerStats = calculatePlayerLeaderboards(teams7Aside, matches).sort(
    (a, b) =>
      b.goals - a.goals ||
      b.assists - a.assists ||
      b.yellowCards + b.redCards * 3 - (a.yellowCards + a.redCards * 3)
  );

  // Live 1v1 Standings calculated from 1v1 matches
  const standings1v1 = players1v1
    .map((p) => {
      const playerMatches = matches.filter(
        (m) =>
          m.category === '1v1' &&
          (m.status === 'FT' || m.status === 'LIVE' || m.status === 'HT') &&
          (m.homeId === p.id || m.awayId === p.id)
      );
      let played = 0;
      let won = 0;
      let lost = 0;
      let gf = 0;
      let ga = 0;

      playerMatches.forEach((m) => {
        played += 1;
        const isHome = m.homeId === p.id;
        const myScore = isHome ? m.homeScore : m.awayScore;
        const oppScore = isHome ? m.awayScore : m.homeScore;
        gf += myScore;
        ga += oppScore;
        const winner = resolveMatchWinnerSide(m);
        if ((isHome && winner === 'HOME') || (!isHome && winner === 'AWAY')) {
          won += 1;
        } else if (
          (isHome && winner === 'AWAY') ||
          (!isHome && winner === 'HOME')
        ) {
          lost += 1;
        }
      });

      const gd = gf - ga;
      const points = won * 3;
      return {
        ...p,
        played,
        won,
        lost,
        gf,
        ga,
        gd,
        points,
      };
    })
    .sort((a, b) => b.points - a.points || b.gd - a.gd || b.gf - a.gf);

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[24px] font-bold text-white leading-tight">
            Standings
          </h1>
          <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
            Group Phase • Top 8 Knockouts • Stats • 1v1
          </p>
        </div>

        <div className="flex items-center gap-2">
          <IconlySearchButton onClick={onOpenSearch} />
          <IconlySettingsButton
            title="Settings"
            onClick={() => onNavigateTab('settings')}
          />
        </div>
      </header>

      {/* Clean Single-Row 4-Tab Standings Switcher */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
        {(
          [
            { id: 'league', label: 'Standings' },
            { id: 'knockout', label: 'Knockouts' },
            { id: 'stats', label: 'Top Stats' },
            { id: '1v1', label: '1v1' },
          ] as const
        ).map((tab) => {
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`h-[38px] px-2 rounded-full text-[11px] transition-all truncate ${
                isActive
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
                  : 'text-[#8E8E8E] hover:text-white font-normal'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: UNIFIED 7-ASIDE LEAGUE TABLE & FIXTURES BY MATCHDAY */}
      {activeSubTab === 'league' && (
        <section className="space-y-5">
          <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] overflow-hidden shadow-card">
            <div className="px-4 py-3 bg-[#242224] border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                League Standings
              </span>
            </div>

            {leagueStandings.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8E8E8E]">
                No teams registered in the league yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] font-quicksand text-[10px] font-bold uppercase text-[#8E8E8E]">
                      <th className="py-2.5 pl-3.5 pr-1">#</th>
                      <th className="py-2.5 px-2">Team</th>
                      <th className="py-2.5 px-1.5 text-center" title="Played">
                        P
                      </th>
                      <th className="py-2.5 px-1.5 text-center" title="Won">
                        W
                      </th>
                      <th className="py-2.5 px-1.5 text-center" title="Drawn">
                        D
                      </th>
                      <th className="py-2.5 px-1.5 text-center" title="Lost">
                        L
                      </th>
                      <th
                        className="py-2.5 px-1.5 text-center"
                        title="Goals For"
                      >
                        GF
                      </th>
                      <th
                        className="py-2.5 px-1.5 text-center"
                        title="Goals Against"
                      >
                        GA
                      </th>
                      <th
                        className="py-2.5 px-1.5 text-center"
                        title="Goal Difference"
                      >
                        GD
                      </th>
                      <th
                        className="py-2.5 px-1.5 text-center text-[#FACC15]"
                        title="Yellow Cards"
                      >
                        YC
                      </th>
                      <th
                        className="py-2.5 px-1.5 text-center text-[#EF4444]"
                        title="Red Cards"
                      >
                        RC
                      </th>
                      <th
                        className="py-2.5 pl-1.5 pr-3.5 text-right text-[#C8F558]"
                        title="Points"
                      >
                        PTS
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] text-xs">
                    {leagueStandings.map((row, index) => {
                      const isQuarterFinalZone = index < 8;
                      return (
                        <tr
                          key={row.teamId}
                          className={`hover:bg-[#242224]/60 transition-colors ${
                            index === 7 ? 'border-b-2 border-[#C8F558]/50' : ''
                          }`}
                        >
                          <td className="py-3 pl-3.5 pr-1 font-bold">
                            <span
                              className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                                index === 0
                                  ? 'bg-[#C8F558] text-[#161616]'
                                  : isQuarterFinalZone
                                  ? 'bg-[#C8F558]/25 text-[#C8F558]'
                                  : 'bg-[#242224] text-[#8E8E8E]'
                              }`}
                            >
                              {index + 1}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2 min-w-[130px]">
                              <TeamCrestBadge
                                shortCode={row.shortCode}
                                color={row.badgeColor}
                                size="xs"
                              />
                              <span className="font-bold text-white truncate">
                                {row.teamName}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                            {row.played}
                          </td>
                          <td className="py-3 px-1.5 text-center text-white font-medium">
                            {row.won}
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                            {row.drawn}
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                            {row.lost}
                          </td>
                          <td className="py-3 px-1.5 text-center text-white">
                            {row.gf}
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                            {row.ga}
                          </td>
                          <td className="py-3 px-1.5 text-center font-bold">
                            <span
                              className={
                                row.gd > 0
                                  ? 'text-[#C8F558]'
                                  : row.gd < 0
                                  ? 'text-red-400'
                                  : 'text-[#9E9E9E]'
                              }
                            >
                              {row.gd > 0 ? `+${row.gd}` : row.gd}
                            </span>
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#FACC15] font-medium">
                            {row.yellowCards}
                          </td>
                          <td className="py-3 px-1.5 text-center text-[#EF4444] font-medium">
                            {row.redCards}
                          </td>
                          <td className="py-3 pl-1.5 pr-3.5 text-right font-bold text-[#C8F558] text-sm">
                            {row.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {leagueStandings.length > 8 && (
              <div className="px-4 py-2 bg-[#141513] border-t border-white/[0.05] text-[10px] font-quicksand text-[#8E8E8E]">
                Positions 1–8 qualify for Quarter-Finals (Top 8 Bracket)
              </div>
            )}
          </div>

          {/* League Matchdays & Fixtures Breakdown */}
          {leagueFixtures.length > 0 && (
            <div className="space-y-3 pt-1">
              <SectionTabHeader title="League Fixtures" />

              {availableMatchdays.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setSelectedMatchday('ALL')}
                    className={`px-3.5 py-1.5 rounded-full text-xs border shrink-0 ${
                      selectedMatchday === 'ALL'
                        ? 'bg-[#C8F558] text-[#161616] border-[#C8F558] font-bold'
                        : 'bg-[#161616] text-[#8E8E8E] border-white/10 hover:text-white font-normal'
                    }`}
                  >
                    All Matchdays ({leagueFixtures.length})
                  </button>
                  {availableMatchdays.map((md) => (
                    <button
                      key={md}
                      type="button"
                      onClick={() => setSelectedMatchday(md)}
                      className={`px-3.5 py-1.5 rounded-full text-xs border shrink-0 ${
                        selectedMatchday === md
                          ? 'bg-[#C8F558] text-[#161616] border-[#C8F558] font-bold'
                          : 'bg-[#161616] text-[#8E8E8E] border-white/10 hover:text-white font-normal'
                      }`}
                    >
                      Matchday {md}
                    </button>
                  ))}
                </div>
              )}

              <div className="space-y-2.5">
                {filteredLeagueFixtures.map((fixture) => (
                  <UpcomingMatchCard
                    key={fixture.id}
                    match={fixture}
                    onSelect={onSelectMatch}
                    showRightArrow
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* TAB 2: TOP 8 KNOCKOUT BRACKET (QF -> SF -> FINAL) */}
      {activeSubTab === 'knockout' && (
        <section className="space-y-4">
          <SectionTabHeader title="Top 8 Knockouts" />
          <KnockoutBracketSection
            matches={knockout7AsideMatches}
            activeStages={active7AsideStages}
            finalTitle="Championship Final • 15 Min"
            emptyLabel="Quarter-Finals will populate once the opening phase wraps up or Admin generates the bracket."
            onSelectMatch={onSelectMatch}
          />
        </section>
      )}

      {/* TAB 3: TOP SCORERS, ASSISTS & FAIR PLAY STATS */}
      {activeSubTab === 'stats' && (
        <section className="space-y-4">
          <SectionTabHeader title="League Leaders" />
          <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] overflow-hidden shadow-card">
            <div className="px-4 py-3 bg-[#242224] border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C8F558]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  7-Aside Goals, Assists & Cards
                </span>
              </div>
            </div>

            {playerStats.length === 0 ? (
              <div className="p-6 text-center text-xs text-[#8E8E8E]">
                No player statistics recorded yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.06] font-quicksand text-[10px] font-bold uppercase text-[#8E8E8E]">
                      <th className="py-2.5 pl-4 pr-2">Player</th>
                      <th className="py-2.5 px-2">Team</th>
                      <th className="py-2.5 px-2 text-center text-[#C8F558]">
                        Goals
                      </th>
                      <th className="py-2.5 px-2 text-center">Assists</th>
                      <th className="py-2.5 px-2 text-center text-[#FACC15]">
                        YC
                      </th>
                      <th className="py-2.5 pl-2 pr-4 text-center text-[#EF4444]">
                        RC
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] text-xs">
                    {playerStats.slice(0, 15).map((p) => (
                      <tr
                        key={p.playerId}
                        className="hover:bg-[#242224]/60 transition-colors"
                      >
                        <td className="py-2.5 pl-4 pr-2 font-bold text-white">
                          #{p.jerseyNumber} {p.playerName}
                        </td>
                        <td className="py-2.5 px-2">
                          <div className="flex items-center gap-1.5">
                            <TeamCrestBadge
                              shortCode={p.teamShort}
                              color={p.teamColor}
                              size="xs"
                            />
                            <span className="font-quicksand text-[#9E9E9E] truncate">
                              {p.teamShort}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-2 text-center font-bold text-[#C8F558]">
                          {p.goals}
                        </td>
                        <td className="py-2.5 px-2 text-center text-white">
                          {p.assists}
                        </td>
                        <td className="py-2.5 px-2 text-center text-[#FACC15]">
                          {p.yellowCards}
                        </td>
                        <td className="py-2.5 pl-2 pr-4 text-center text-[#EF4444]">
                          {p.redCards}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: 1V1 STANDINGS TABLE & BRACKET */}
      {activeSubTab === '1v1' && (
        <section className="space-y-6">
          {/* 1v1 Competitor Standings Table */}
          <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] overflow-hidden shadow-card">
            <div className="px-4 py-3 bg-[#242224] border-b border-white/[0.05] flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                1v1 Arena Standings
              </span>
              <span className="font-quicksand text-[11px] text-[#C8F558] font-semibold">
                PTS • GD • GF • GA
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.06] font-quicksand text-[10px] font-bold uppercase text-[#8E8E8E]">
                    <th className="py-2.5 pl-3.5 pr-1">#</th>
                    <th className="py-2.5 px-2">Player</th>
                    <th className="py-2.5 px-1.5 text-center" title="Played">
                      P
                    </th>
                    <th className="py-2.5 px-1.5 text-center" title="Won">
                      W
                    </th>
                    <th className="py-2.5 px-1.5 text-center" title="Lost">
                      L
                    </th>
                    <th className="py-2.5 px-1.5 text-center" title="Goals For">
                      GF
                    </th>
                    <th
                      className="py-2.5 px-1.5 text-center"
                      title="Goals Against"
                    >
                      GA
                    </th>
                    <th
                      className="py-2.5 px-1.5 text-center"
                      title="Goal Difference"
                    >
                      GD
                    </th>
                    <th
                      className="py-2.5 pl-1.5 pr-3.5 text-right text-[#C8F558]"
                      title="Points"
                    >
                      PTS
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05] text-xs">
                  {standings1v1.map((p, index) => (
                    <tr
                      key={p.id}
                      className="hover:bg-[#242224]/60 transition-colors"
                    >
                      <td className="py-3 pl-3.5 pr-1 font-bold">
                        <span
                          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] ${
                            index < 4
                              ? 'bg-[#C8F558] text-[#161616]'
                              : 'bg-[#242224] text-[#8E8E8E]'
                          }`}
                        >
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2 min-w-[130px]">
                          <TeamCrestBadge
                            shortCode={p.shortCode}
                            color={p.badgeColor}
                            size="xs"
                          />
                          <span className="font-bold text-white truncate">
                            {p.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                        {p.played}
                      </td>
                      <td className="py-3 px-1.5 text-center text-white font-medium">
                        {p.won}
                      </td>
                      <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                        {p.lost}
                      </td>
                      <td className="py-3 px-1.5 text-center text-white">
                        {p.gf}
                      </td>
                      <td className="py-3 px-1.5 text-center text-[#9E9E9E]">
                        {p.ga}
                      </td>
                      <td className="py-3 px-1.5 text-center font-bold">
                        <span
                          className={
                            p.gd > 0
                              ? 'text-[#C8F558]'
                              : p.gd < 0
                              ? 'text-red-400'
                              : 'text-[#9E9E9E]'
                          }
                        >
                          {p.gd > 0 ? `+${p.gd}` : p.gd}
                        </span>
                      </td>
                      <td className="py-3 pl-1.5 pr-3.5 text-right font-bold text-[#C8F558] text-sm">
                        {p.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 1v1 Knockout Bracket Progression */}
          <div className="space-y-4">
            <SectionTabHeader title="1v1 Bracket" />
            <KnockoutBracketSection
              matches={knockout1v1Matches}
              activeStages={active1v1Stages}
              finalTitle="1v1 Grand Final • KSh 5,000 Prize"
              emptyLabel="No 1v1 knockout ties scheduled yet."
              onSelectMatch={onSelectMatch}
            />
          </div>
        </section>
      )}
    </div>
  );
};
