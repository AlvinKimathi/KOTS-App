import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  GitBranch,
  Shuffle,
  CheckCircle2,
  Trash2,
  Layers,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  formatMatchClock,
  IconlySearchButton,
  IconlySettingsButton,
  SectionTabHeader,
  TeamCrestBadge,
} from '../components/ui/FigmaWidgets';
import {
  getRecommendedKnockoutStartStage,
  resolveMatchWinnerSide,
} from '../utils/knockoutEngine';
import { getRecommendedGroupCount } from '../utils/drawGenerator';
import {
  AppNavTab,
  KnockoutStage,
  MatchStatus,
  TournamentCategory,
} from '../types/tournament';

type AdminMode = 'fixtures' | 'standings';

export const AdminConsoleView: React.FC<{
  onSelectMatch: (matchId: string) => void;
  onOpenSearch: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({ onSelectMatch, onOpenSearch, onNavigateTab }) => {
  const {
    session,
    matches,
    teams7Aside,
    players1v1,
    setMatchStatus,
    deleteCustomMatch,
    runAutomatedGroupDrawAndFixtures,
    assignTeamGroupAndSyncFixtures,
    regenerateKnockoutDraw,
    assignSlotParticipant,
  } = useTournament();

  if (session.role !== 'ADMIN') {
    return null;
  }

  // Fixtures come first before Standings on the Admin side
  const [adminMode, setAdminMode] = useState<AdminMode>('fixtures');
  const [fixtureCategoryFilter, setFixtureCategoryFilter] = useState<
    'ALL' | TournamentCategory
  >('ALL');
  const [fixtureFilter, setFixtureFilter] = useState<
    'ALL' | 'LIVE' | 'UPCOMING' | 'FT'
  >('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Automated Draw Engine state
  const [drawCategory, setDrawCategory] =
    useState<TournamentCategory>('7aside');
  const [groupCountMode, setGroupCountMode] = useState<'AUTO' | 2 | 3 | 4>(
    'AUTO'
  );
  const [drawStartStage, setDrawStartStage] = useState<
    'R16' | 'QF' | 'SF' | 'AUTO'
  >('AUTO');
  const [showGroupIntervention, setShowGroupIntervention] = useState(false);

  const activeFixtures = matches.filter(
    (m) => !(m.homeId === 'TBD' && m.awayId === 'TBD')
  );

  const filteredFixtures = activeFixtures.filter((m) => {
    if (fixtureCategoryFilter !== 'ALL' && m.category !== fixtureCategoryFilter)
      return false;
    if (fixtureFilter === 'LIVE')
      return m.status === 'LIVE' || m.status === 'HT';
    if (fixtureFilter === 'UPCOMING') return m.status === 'UPCOMING';
    if (fixtureFilter === 'FT') return m.status === 'FT';
    return true;
  });

  const recommendedGroupCount = getRecommendedGroupCount(teams7Aside.length);

  const drawParticipantCount =
    drawCategory === '7aside' ? teams7Aside.length : players1v1.length;
  const recommendedStage =
    getRecommendedKnockoutStartStage(drawParticipantCount);

  const knockoutMatches = matches.filter(
    (m) => m.category === drawCategory && m.stage !== 'GROUP'
  );
  const stagesOrder: KnockoutStage[] = ['R16', 'QF', 'SF', 'FINAL'];
  const activeKnockoutStages = stagesOrder.filter((st) =>
    knockoutMatches.some((m) => m.stage === st)
  );

  const groupMatchesCount = matches.filter(
    (m) => m.category === '7aside' && m.stage === 'GROUP'
  ).length;

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3 gap-2">
        <div>
          <h1 className="text-[24px] font-bold text-white leading-tight">
            Admin Console
          </h1>
          <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
            Automated Fixture Schedule • Live Referee Control • Random Draws
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

      {/* Top 2-Tab Switcher: 1. Fixtures & Live Control (First) | 2. Standings & Draws (Second) */}
      <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
        <button
          type="button"
          onClick={() => setAdminMode('fixtures')}
          className={`h-[42px] px-4 rounded-full text-xs transition-all ${
            adminMode === 'fixtures'
              ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
              : 'text-[#8E8E8E] hover:text-white font-normal'
          }`}
        >
          1. Fixtures & Live ({activeFixtures.length})
        </button>
        <button
          type="button"
          onClick={() => setAdminMode('standings')}
          className={`h-[42px] px-4 rounded-full text-xs transition-all ${
            adminMode === 'standings'
              ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
              : 'text-[#8E8E8E] hover:text-white font-normal'
          }`}
        >
          2. Standings & Draws
        </button>
      </div>

      {notice && (
        <div className="rounded-[14px] bg-[#C8F558]/15 border border-[#C8F558] p-3.5 flex items-center justify-between gap-2 text-xs text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C8F558] shrink-0" />
            <span className="font-normal">{notice}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] font-bold text-[#C8F558] shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: FIXTURES & LIVE REFEREE CONTROL (COMES FIRST) */}
      {adminMode === 'fixtures' && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTabHeader
              title={`Fixtures (${filteredFixtures.length})`}
            />

            {/* Category Filter (All / 7-Aside / 1v1) */}
            <div className="flex items-center gap-1 bg-[#161616] p-1 rounded-full border border-white/[0.06]">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: '7aside', label: '7-Aside' },
                  { id: '1v1', label: '1v1' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setFixtureCategoryFilter(cat.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] transition-colors ${
                    fixtureCategoryFilter === cat.id
                      ? 'bg-[#C8F558] text-[#161616] font-bold'
                      : 'text-[#8E8E8E] hover:text-white font-normal'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter Pills */}
          <div className="grid grid-cols-4 gap-1.5 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
            {(
              [
                { id: 'ALL', label: 'All States' },
                { id: 'LIVE', label: 'Live / HT' },
                { id: 'UPCOMING', label: 'Upcoming' },
                { id: 'FT', label: 'Full Time' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFixtureFilter(f.id)}
                className={`h-[34px] rounded-full text-[10px] transition-colors ${
                  fixtureFilter === f.id
                    ? 'bg-white text-[#161616] border border-[#C8F558] font-bold'
                    : 'text-[#8E8E8E] hover:text-white font-normal'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredFixtures.map((m) => (
              <div
                key={m.id}
                className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex items-center -space-x-1.5">
                    <div className="w-8 h-8 rounded-full bg-[#242224] flex items-center justify-center">
                      <TeamCrestBadge
                        shortCode={m.homeShort}
                        color={m.homeColor}
                        size="xs"
                      />
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#242224] flex items-center justify-center border-l border-[#161616]">
                      <TeamCrestBadge
                        shortCode={m.awayShort}
                        color={m.awayColor}
                        size="xs"
                      />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">
                      {m.homeName} ({m.homeScore}) - ({m.awayScore}){' '}
                      {m.awayName}
                    </div>
                    <div className="font-quicksand text-[10px] font-normal text-[#8E8E8E]">
                      {m.category === '7aside' ? '7-Aside' : '1v1'} •{' '}
                      {m.stage === 'GROUP' ? m.groupId : m.stage} •{' '}
                      {formatMatchClock(m)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {(['UPCOMING', 'LIVE', 'HT', 'FT'] as MatchStatus[]).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setMatchStatus(m.id, st)}
                        className={`px-2 py-1 rounded-lg text-[10px] transition-colors ${
                          m.status === st
                            ? 'bg-white text-[#161616] font-bold'
                            : 'bg-[#242224] text-[#8E8E8E] hover:text-white font-normal'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectMatch(m.id)}
                    className="ml-1 px-3 py-1 rounded-full bg-[#C8F558] text-[#161616] text-[10px] font-bold inline-flex items-center gap-1"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Log Events</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                  {m.stage === 'GROUP' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove fixture "${m.homeName} vs ${m.awayName}" from the schedule?`
                          )
                        ) {
                          deleteCustomMatch(m.id);
                        }
                      }}
                      title="Delete Fixture"
                      className="p-1.5 rounded-lg text-[#8E8E8E] hover:text-red-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 2: AUTOMATED DRAWS, FIXTURE GENERATION & SLOT INTERVENTION */}
      {adminMode === 'standings' && (
        <section className="space-y-5">
          {/* Category Switcher for Draw Management */}
          <div className="grid grid-cols-2 gap-2 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
            <button
              type="button"
              onClick={() => setDrawCategory('7aside')}
              className={`h-[38px] rounded-full text-xs transition-all ${
                drawCategory === '7aside'
                  ? 'bg-[#C8F558] text-[#161616] font-bold'
                  : 'text-[#8E8E8E] hover:text-white font-normal'
              }`}
            >
              7-Aside Draws ({teams7Aside.length} Teams)
            </button>
            <button
              type="button"
              onClick={() => setDrawCategory('1v1')}
              className={`h-[38px] rounded-full text-xs transition-all ${
                drawCategory === '1v1'
                  ? 'bg-[#C8F558] text-[#161616] font-bold'
                  : 'text-[#8E8E8E] hover:text-white font-normal'
              }`}
            >
              1v1 Arena Draw ({players1v1.length} Players)
            </button>
          </div>

          {/* 1. 7-ASIDE AUTOMATED GROUP STAGE DRAW & ROUND-ROBIN FIXTURES */}
          {drawCategory === '7aside' && (
            <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4 space-y-3.5 shadow-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-[#C8F558] shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Step 1: Automated Group Stage Draw & Fixtures
                    </h3>
                    <p className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                      Randomly draws all {teams7Aside.length} registered teams
                      into balanced groups and creates all round-robin Group
                      Stage fixtures ({groupMatchesCount} active group
                      fixtures).
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <select
                  value={String(groupCountMode)}
                  onChange={(e) => {
                    const val = e.target.value;
                    setGroupCountMode(
                      val === 'AUTO' ? 'AUTO' : (Number(val) as 2 | 3 | 4)
                    );
                  }}
                  className="rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                >
                  <option value="AUTO">
                    Auto-Scale ({recommendedGroupCount} Groups for{' '}
                    {teams7Aside.length} Teams)
                  </option>
                  <option value="2">2 Groups (Group A & Group B)</option>
                  <option value="3">3 Groups (Group A, B & C)</option>
                  <option value="4">4 Groups (Group A, B, C & D)</option>
                </select>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        `Randomly draw all ${teams7Aside.length} teams into groups and automatically generate all Group Stage fixtures?`
                      )
                    ) {
                      const res =
                        runAutomatedGroupDrawAndFixtures(groupCountMode);
                      setNotice(
                        `Automated Group Draw complete: ${teams7Aside.length} teams assigned across ${res.groupCount} groups and ${res.matchCount} round-robin fixtures generated.`
                      );
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Run Random Group Draw & Generate Fixtures</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGroupIntervention((prev) => !prev)}
                  className="px-3 py-1.5 rounded-full bg-[#242224] text-white text-xs font-normal border border-white/10 hover:border-[#C8F558]/40"
                >
                  {showGroupIntervention
                    ? 'Hide Manual Group Override'
                    : 'Manual Group Intervention'}
                </button>
              </div>

              {showGroupIntervention && (
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                    Optional Admin Intervention: Reassigning a team&apos;s group
                    below automatically updates the Group Stage fixtures.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {teams7Aside.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between gap-2 rounded-xl bg-[#242224] px-3 py-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <TeamCrestBadge
                            shortCode={team.shortCode}
                            color={team.badgeColor}
                            size="xs"
                          />
                          <span className="text-xs font-bold text-white truncate">
                            {team.name}
                          </span>
                        </div>
                        <select
                          value={
                            team.groupId && team.groupId.startsWith('Group ')
                              ? team.groupId
                              : 'Group A'
                          }
                          onChange={(e) => {
                            assignTeamGroupAndSyncFixtures(
                              team.id,
                              e.target.value
                            );
                            setNotice(
                              `Moved "${team.name}" to ${e.target.value} and updated Group Stage fixtures.`
                            );
                          }}
                          className="rounded-lg bg-[#161616] border border-white/10 px-2 py-1 text-[11px] font-normal text-[#C8F558] focus:border-[#C8F558] focus:outline-none"
                        >
                          <option value="Group A">Group A</option>
                          <option value="Group B">Group B</option>
                          <option value="Group C">Group C</option>
                          <option value="Group D">Group D</option>
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. AUTOMATED KNOCKOUT DRAW & FIXTURE GENERATOR (7-ASIDE & DIRECT 1V1) */}
          <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4 space-y-3 shadow-card">
            <div className="flex items-center gap-2.5">
              <GitBranch className="w-4 h-4 text-[#C8F558] shrink-0" />
              <div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {drawCategory === '7aside'
                    ? 'Step 2: Automated Knockout Draw & Fixtures (R16 to Final)'
                    : 'Direct 1v1 Automated Knockout Draw & Fixtures (No Group Stage)'}
                </h3>
                <p className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                  {drawParticipantCount} registered{' '}
                  {drawCategory === '7aside' ? 'teams' : '1v1 players'} •
                  Recommended entry stage:{' '}
                  <span className="text-[#C8F558] font-bold">
                    {recommendedStage}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <select
                value={drawStartStage}
                onChange={(e) =>
                  setDrawStartStage(
                    e.target.value as 'R16' | 'QF' | 'SF' | 'AUTO'
                  )
                }
                className="rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
              >
                <option value="AUTO">
                  Auto-Scale ({recommendedStage} for {drawParticipantCount})
                </option>
                <option value="R16">Start at Round of 16 (R16)</option>
                <option value="QF">Start at Quarter-Finals (QF)</option>
                <option value="SF">Start at Semi-Finals (SF)</option>
              </select>

              {drawCategory === '7aside' && (
                <button
                  type="button"
                  onClick={() => {
                    if (
                      window.confirm(
                        'Automatically generate 7-Aside knockout fixtures seeded from the current Group Standings?'
                      )
                    ) {
                      regenerateKnockoutDraw({
                        category: '7aside',
                        startStage: drawStartStage,
                        source: 'GROUP_STANDINGS',
                      });
                      setNotice(
                        '7-Aside Knockout Bracket & fixtures automatically generated from Group Standings.'
                      );
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white text-[#161616] text-xs font-bold hover:bg-[#C8F558] transition-colors"
                >
                  Seed Fixtures from Group Standings
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Run a randomized knockout draw and generate fixtures for ${
                        drawCategory === '7aside'
                          ? '7-Aside Cup'
                          : '1v1 Arena'
                      }?`
                    )
                  ) {
                    regenerateKnockoutDraw({
                      category: drawCategory,
                      startStage: drawStartStage,
                      source: 'RANDOM_DRAW',
                    });
                    setNotice(
                      `Automated random knockout draw & fixtures generated for ${
                        drawCategory === '7aside' ? '7-Aside Cup' : '1v1 Arena'
                      }.`
                    );
                  }
                }}
                className="px-3.5 py-1.5 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>
                  {drawCategory === '7aside'
                    ? 'Run Random Knockout Draw'
                    : 'Run 1v1 Random Draw & Generate Fixtures'}
                </span>
              </button>
            </div>
          </div>

          {/* Optional Admin Slot Intervention Cards */}
          <div className="space-y-5">
            {activeKnockoutStages.map((st) => {
              const stageMatches = knockoutMatches
                .filter((m) => m.stage === st)
                .sort((a, b) => (a.bracketOrder || 0) - (b.bracketOrder || 0));
              const drawEntities =
                drawCategory === '7aside' ? teams7Aside : players1v1;

              return (
                <div key={st} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md bg-[#C8F558] text-[#161616] text-[10px] font-bold uppercase">
                      {st} Bracket Fixtures (Optional Admin Intervention)
                    </span>
                    <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                      {stageMatches.length}{' '}
                      {stageMatches.length === 1 ? 'Tie' : 'Ties'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {stageMatches.map((m) => {
                      const winnerSide = resolveMatchWinnerSide(m);
                      return (
                        <div
                          key={m.id}
                          className="rounded-[14px] bg-[#161616] border border-white/[0.06] p-3.5 space-y-2 shadow-card"
                        >
                          <div className="flex items-center justify-between text-[10px] text-[#8E8E8E]">
                            <span className="font-bold text-[#C8F558]">
                              {m.stage} #{m.bracketOrder}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectMatch(m.id)}
                              className="font-normal text-[#C8F558] hover:underline inline-flex items-center gap-1"
                            >
                              <span>Open Referee</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>

                          <div
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl ${
                              winnerSide === 'HOME'
                                ? 'bg-[#C8F558]/15 border border-[#C8F558]/40'
                                : 'bg-[#242224]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <TeamCrestBadge
                                shortCode={m.homeShort}
                                color={m.homeColor}
                                size="xs"
                              />
                              <select
                                value={m.homeId}
                                onChange={(e) =>
                                  assignSlotParticipant(
                                    m.id,
                                    'HOME',
                                    e.target.value
                                  )
                                }
                                className="bg-transparent text-xs font-normal text-white focus:outline-none truncate max-w-[200px]"
                              >
                                <option value="TBD">
                                  TBD / Bye Slot
                                </option>
                                {drawEntities.map((ent) => (
                                  <option key={ent.id} value={ent.id}>
                                    {ent.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <span className="text-xs font-bold text-white">
                              {m.homeScore}
                            </span>
                          </div>

                          <div
                            className={`flex items-center justify-between gap-2 p-2 rounded-xl ${
                              winnerSide === 'AWAY'
                                ? 'bg-[#C8F558]/15 border border-[#C8F558]/40'
                                : 'bg-[#242224]'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <TeamCrestBadge
                                shortCode={m.awayShort}
                                color={m.awayColor}
                                size="xs"
                              />
                              <select
                                value={m.awayId}
                                onChange={(e) =>
                                  assignSlotParticipant(
                                    m.id,
                                    'AWAY',
                                    e.target.value
                                  )
                                }
                                className="bg-transparent text-xs font-normal text-white focus:outline-none truncate max-w-[200px]"
                              >
                                <option value="TBD">
                                  TBD / Bye Slot
                                </option>
                                {drawEntities.map((ent) => (
                                  <option key={ent.id} value={ent.id}>
                                    {ent.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <span className="text-xs font-bold text-white">
                              {m.awayScore}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
};
