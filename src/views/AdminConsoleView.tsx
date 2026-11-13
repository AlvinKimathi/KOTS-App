import React, { useState } from 'react';
import {
  SlidersHorizontal,
  ArrowRight,
  GitBranch,
  Shuffle,
  CheckCircle2,
  Trash2,
  Trophy,
  Clock,
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
import {
  AppNavTab,
  KnockoutStage,
  Match,
  MatchStatus,
  TournamentCategory,
} from '../types/tournament';

type AdminMode = 'fixtures' | 'standings';

/**
 * Shared Knockout Tie Card supporting slot assignment and Referee deep-link
 * across both 7-Aside Top-8 Knockouts and 1v1 Arena brackets.
 */
const KnockoutTieEditorCard: React.FC<{
  match: Match;
  participants: { id: string; name: string }[];
  onAssignSlot: (
    matchId: string,
    slot: 'HOME' | 'AWAY',
    participantId: string
  ) => void;
  onSelectMatch: (matchId: string) => void;
}> = ({ match: m, participants, onAssignSlot, onSelectMatch }) => {
  const winnerSide = resolveMatchWinnerSide(m);
  return (
    <div className="rounded-[14px] bg-[#161616] border border-white/[0.06] p-3.5 space-y-2 shadow-card">
      <div className="flex items-center justify-between text-[10px] text-[#8E8E8E]">
        <span className="font-bold text-[#C8F558]">
          {m.stage} #{m.bracketOrder} • {m.scheduledTime} ({m.durationMinutes}m)
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

      {(['HOME', 'AWAY'] as const).map((slot) => {
        const isHome = slot === 'HOME';
        const entityId = isHome ? m.homeId : m.awayId;
        const shortCode = isHome ? m.homeShort : m.awayShort;
        const color = isHome ? m.homeColor : m.awayColor;
        const score = isHome ? m.homeScore : m.awayScore;
        const isWinner = winnerSide === slot;

        return (
          <div
            key={slot}
            className={`flex items-center justify-between gap-2 p-2 rounded-xl ${
              isWinner
                ? 'bg-[#C8F558]/15 border border-[#C8F558]/40'
                : 'bg-[#242224]'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <TeamCrestBadge
                shortCode={shortCode}
                color={color}
                size="xs"
              />
              <select
                value={entityId}
                onChange={(e) => onAssignSlot(m.id, slot, e.target.value)}
                className="bg-transparent text-xs font-normal text-white focus:outline-none truncate max-w-[200px]"
              >
                <option value="TBD">TBD / Awaiting Seed</option>
                {participants.map((ent) => (
                  <option key={ent.id} value={ent.id}>
                    {ent.name}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-xs font-bold text-white">{score}</span>
          </div>
        );
      })}
    </div>
  );
};

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
    updateMatchDetails,
    runAutomatedLeagueFixtures,
    regenerateKnockoutDraw,
    assignSlotParticipant,
  } = useTournament();

  if (session.role !== 'ADMIN') {
    return null;
  }

  const [adminMode, setAdminMode] = useState<AdminMode>('fixtures');
  const [fixtureCategoryFilter, setFixtureCategoryFilter] = useState<
    'ALL' | TournamentCategory
  >('ALL');
  const [fixtureFilter, setFixtureFilter] = useState<
    'ALL' | 'LIVE' | 'UPCOMING' | 'FT'
  >('ALL');
  const [notice, setNotice] = useState<string | null>(null);

  // Inline fixture schedule editor state
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScheduledTime, setEditScheduledTime] = useState('');
  const [editDurationMinutes, setEditDurationMinutes] = useState<number>(20);
  const [editVenue, setEditVenue] = useState('');

  // Automated League Fixtures config state (configurable on tournament day)
  const [drawCategory, setDrawCategory] =
    useState<TournamentCategory>('7aside');
  const [leagueDateLabel, setLeagueDateLabel] = useState('14 Nov');
  const [leagueStartTime, setLeagueStartTime] = useState('10:00');
  const [leagueDurationMinutes, setLeagueDurationMinutes] = useState<number>(10);
  const [leagueSlotIntervalMinutes, setLeagueSlotIntervalMinutes] =
    useState<number>(15);
  const [leagueVenue, setLeagueVenue] = useState('BALLMANIA RUNDA');

  // Top 8 7-Aside Knockout config state
  const [koStartTime, setKoStartTime] = useState('18:15');
  const [koQfDuration, setKoQfDuration] = useState<number>(10);
  const [koSfFinalDuration, setKoSfFinalDuration] = useState<number>(15);
  const [koCooldown, setKoCooldown] = useState<number>(5);

  // 1v1 Draw state
  const [drawStartStage, setDrawStartStage] = useState<
    'R16' | 'QF' | 'SF' | 'AUTO'
  >('AUTO');

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

  const leagueMatches = matches.filter(
    (m) => m.category === '7aside' && (m.stage === 'LEAGUE' || m.stage === 'GROUP')
  );

  const availableMatchdays = Array.from(
    new Set(
      leagueMatches
        .map((m) => m.matchday)
        .filter((md): md is number => typeof md === 'number' && md > 0)
    )
  ).sort((a, b) => a - b);

  const recommended1v1Stage = getRecommendedKnockoutStartStage(players1v1.length);
  const knockout7AsideMatches = matches.filter(
    (m) => m.category === '7aside' && m.stage !== 'GROUP' && m.stage !== 'LEAGUE'
  );
  const knockout1v1Matches = matches.filter(
    (m) => m.category === '1v1' && m.stage !== 'GROUP' && m.stage !== 'LEAGUE'
  );
  const stagesOrder: KnockoutStage[] = ['R16', 'QF', 'SF', 'FINAL'];
  const active7AsideStages = stagesOrder.filter((st) =>
    knockout7AsideMatches.some((m) => m.stage === st)
  );
  const active1v1Stages = stagesOrder.filter((st) =>
    knockout1v1Matches.some((m) => m.stage === st)
  );

  const openScheduleEditor = (m: (typeof matches)[number]) => {
    if (editingMatchId === m.id) {
      setEditingMatchId(null);
      return;
    }
    setEditingMatchId(m.id);
    setEditScheduledTime(m.scheduledTime);
    setEditDurationMinutes(m.durationMinutes);
    setEditVenue(m.venue);
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3 gap-2">
        <div>
          <h1 className="text-[24px] font-bold text-white leading-tight">
            Admin Console
          </h1>
          <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
            Automated League Schedule • Live Referee Control • 1v1 Draws
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

      {/* Top 2-Tab Switcher */}
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
          2. League & 1v1 Draws
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

      {/* TAB 1: FIXTURES & LIVE REFEREE CONTROL */}
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
            {filteredFixtures.map((m) => {
              const stageTag =
                m.stage === 'LEAGUE'
                  ? m.matchday
                    ? `MD ${m.matchday}`
                    : 'League'
                  : m.stage === 'GROUP'
                  ? m.groupId
                  : m.stage;

              return (
                <div
                  key={m.id}
                  className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-3.5 space-y-3 shadow-card"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
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
                          {stageTag} • {m.scheduledTime} • {m.durationMinutes}{' '}
                          min • {formatMatchClock(m)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
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
                        onClick={() => openScheduleEditor(m)}
                        title="Edit Time & Match Duration"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-colors ${
                          editingMatchId === m.id
                            ? 'bg-white text-[#161616]'
                            : 'bg-[#242224] text-[#C8F558] hover:bg-white/10'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>Time/Min</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onSelectMatch(m.id)}
                        className="px-3 py-1 rounded-full bg-[#C8F558] text-[#161616] text-[10px] font-bold inline-flex items-center gap-1"
                      >
                        <SlidersHorizontal className="w-3 h-3" />
                        <span>Log Events</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                      {(m.stage === 'LEAGUE' || m.stage === 'GROUP') && (
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

                  {/* Inline Kickoff Time, Match Duration & Venue Editor */}
                  {editingMatchId === m.id && (
                    <div className="pt-2.5 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] text-[#8E8E8E] mb-1">
                          Kickoff Time
                        </label>
                        <input
                          type="text"
                          value={editScheduledTime}
                          onChange={(e) => setEditScheduledTime(e.target.value)}
                          placeholder="14 Nov • 10:00"
                          className="w-full rounded-lg bg-[#141513] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#8E8E8E] mb-1">
                          Match Duration (Mins)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={90}
                          value={editDurationMinutes}
                          onChange={(e) =>
                            setEditDurationMinutes(Number(e.target.value))
                          }
                          className="w-full rounded-lg bg-[#141513] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-[#8E8E8E] mb-1">
                          Venue
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={editVenue}
                            onChange={(e) => setEditVenue(e.target.value)}
                            className="w-full rounded-lg bg-[#141513] border border-white/10 px-2.5 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              updateMatchDetails(m.id, {
                                scheduledTime: editScheduledTime,
                                durationMinutes: editDurationMinutes,
                                venue: editVenue,
                              });
                              setEditingMatchId(null);
                              setNotice(
                                `Updated "${m.homeShort} vs ${m.awayShort}": ${editScheduledTime} (${editDurationMinutes} min).`
                              );
                            }}
                            className="px-3 py-1.5 rounded-lg bg-[#C8F558] text-[#161616] text-xs font-bold shrink-0"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* TAB 2: AUTOMATED LEAGUE FIXTURES & 1V1 DRAWS */}
      {adminMode === 'standings' && (
        <section className="space-y-5">
          {/* Category Switcher */}
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
              7-Aside League ({teams7Aside.length} Teams)
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

          {/* 1. 7-ASIDE AUTOMATED LEAGUE FIXTURES GENERATOR */}
          {drawCategory === '7aside' && (
            <div className="space-y-5">
              <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4 space-y-4 shadow-card">
                <div className="flex items-start gap-2.5">
                  <Trophy className="w-4 h-4 text-[#C8F558] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Run Automated League Fixtures
                    </h3>
                    <p className="font-quicksand text-[11px] font-normal text-[#8E8E8E] mt-0.5">
                      Generates a balanced single round-robin League schedule
                      across all currently confirmed teams, grouped by Matchday
                      (team count is completely open — works for any number of
                      teams). Configure match duration and kickoff intervals
                      below before running or edit individual fixtures anytime.
                    </p>
                  </div>
                </div>

                {/* Configurable Matchday Timing Parameters */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      Tournament Date
                    </label>
                    <input
                      type="text"
                      value={leagueDateLabel}
                      onChange={(e) => setLeagueDateLabel(e.target.value)}
                      placeholder="14 Nov"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      First Kickoff (24h)
                    </label>
                    <input
                      type="text"
                      value={leagueStartTime}
                      onChange={(e) => setLeagueStartTime(e.target.value)}
                      placeholder="10:00"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      Match Duration (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={90}
                      value={leagueDurationMinutes}
                      onChange={(e) =>
                        setLeagueDurationMinutes(Number(e.target.value))
                      }
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      Slot Interval (Mins)
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={leagueSlotIntervalMinutes}
                      onChange={(e) =>
                        setLeagueSlotIntervalMinutes(Number(e.target.value))
                      }
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={leagueVenue}
                      onChange={(e) => setLeagueVenue(e.target.value)}
                      placeholder="BALLMANIA RUNDA"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={teams7Aside.length < 2}
                    onClick={() => {
                      if (teams7Aside.length < 2) return;
                      if (
                        window.confirm(
                          `Run Automated League Fixtures for ${teams7Aside.length} teams (${leagueDurationMinutes} min matches, ${leagueSlotIntervalMinutes} min slots starting ${leagueStartTime})?`
                        )
                      ) {
                        const res = runAutomatedLeagueFixtures({
                          dateLabel: leagueDateLabel,
                          startTime: leagueStartTime,
                          durationMinutes: leagueDurationMinutes,
                          slotIntervalMinutes: leagueSlotIntervalMinutes,
                          venue: leagueVenue,
                          shuffleTeams: true,
                        });
                        setNotice(
                          `League Draw complete: ${res.matchCount} fixtures generated across ${res.matchdayCount} Matchdays.`
                        );
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors disabled:opacity-50"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Run Automated League Fixtures</span>
                  </button>
                </div>
              </div>

              {/* TOP 8 KNOCKOUT GENERATOR (QF -> SF -> FINAL) */}
              <div className="rounded-[16px] bg-[#161616] border border-[#C8F558]/25 p-4 space-y-4 shadow-card">
                <div className="flex items-start gap-2.5">
                  <GitBranch className="w-4 h-4 text-[#C8F558] shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Top 8 Knockout Bracket (QF • SF • Final)
                    </h3>
                    <p className="font-quicksand text-[11px] font-normal text-[#8E8E8E] mt-0.5">
                      Top 8 from League Standings advance to Quarter-Finals
                      (#1v#8, #4v#5, #2v#7, #3v#6), then Semi-Finals and Final.
                      Your opening-phase fixtures are preserved untouched.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      KO Start (24h)
                    </label>
                    <input
                      type="text"
                      value={koStartTime}
                      onChange={(e) => setKoStartTime(e.target.value)}
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      QF Mins
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={koQfDuration}
                      onChange={(e) => setKoQfDuration(Number(e.target.value))}
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      SF & Final Mins
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={60}
                      value={koSfFinalDuration}
                      onChange={(e) =>
                        setKoSfFinalDuration(Number(e.target.value))
                      }
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-[#8E8E8E] mb-1">
                      Cooldown (Mins)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={koCooldown}
                      onChange={(e) => setKoCooldown(Number(e.target.value))}
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-1.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    disabled={teams7Aside.length < 8}
                    onClick={() => {
                      if (
                        window.confirm(
                          `Seed Top 8 from current League Standings into QF (#1v#8, #4v#5, #2v#7, #3v#6) -> SF -> Final starting at ${koStartTime}?`
                        )
                      ) {
                        regenerateKnockoutDraw({
                          category: '7aside',
                          startStage: 'QF',
                          source: 'TOP_8_STANDINGS',
                          dateLabel: leagueDateLabel,
                          startTime: koStartTime,
                          qfDurationMinutes: koQfDuration,
                          sfFinalDurationMinutes: koSfFinalDuration,
                          cooldownMinutes: koCooldown,
                          venue: leagueVenue,
                        });
                        setNotice(
                          'Seeded Top 8 teams from Standings into Quarter-Finals -> Semi-Finals -> Final.'
                        );
                      }
                    }}
                    className="px-4 py-2 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors disabled:opacity-50"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Seed Top 8 From Standings</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Reset/create empty QF -> SF -> Final placeholder ties starting ${koStartTime}?`
                        )
                      ) {
                        regenerateKnockoutDraw({
                          category: '7aside',
                          startStage: 'QF',
                          source: 'TBD_EMPTY',
                          dateLabel: leagueDateLabel,
                          startTime: koStartTime,
                          qfDurationMinutes: koQfDuration,
                          sfFinalDurationMinutes: koSfFinalDuration,
                          cooldownMinutes: koCooldown,
                          venue: leagueVenue,
                        });
                        setNotice(
                          'Created empty Top-8 Knockout schedule placeholders (QF -> SF -> Final).'
                        );
                      }
                    }}
                    className="px-3.5 py-2 rounded-full bg-[#242224] text-white border border-white/10 hover:border-[#C8F558] text-xs font-normal"
                  >
                    Create Empty Bracket (TBD)
                  </button>
                </div>
              </div>

              {active7AsideStages.length > 0 && (
                <div className="space-y-4">
                  {active7AsideStages.map((st) => {
                    const stageMatches = knockout7AsideMatches
                      .filter((m) => m.stage === st)
                      .sort(
                        (a, b) => (a.bracketOrder || 0) - (b.bracketOrder || 0)
                      );
                    return (
                      <div key={st} className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md bg-[#C8F558] text-[#161616] text-[10px] font-bold uppercase">
                            {st} 7-Aside Knockouts
                          </span>
                          <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                            {stageMatches.length}{' '}
                            {stageMatches.length === 1 ? 'Tie' : 'Ties'}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2.5">
                          {stageMatches.map((m) => (
                            <KnockoutTieEditorCard
                              key={m.id}
                              match={m}
                              participants={teams7Aside}
                              onAssignSlot={assignSlotParticipant}
                              onSelectMatch={onSelectMatch}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Matchday Overview & Quick Swap / Timing Adjustment */}
              {availableMatchdays.length > 0 && (
                <div className="space-y-4">
                  {availableMatchdays.map((md) => {
                    const mdMatches = leagueMatches.filter(
                      (m) => m.matchday === md
                    );
                    return (
                      <div key={md} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-1 rounded-md bg-[#C8F558] text-[#161616] text-[10px] font-bold uppercase">
                            Matchday {md}
                          </span>
                          <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                            {mdMatches.length}{' '}
                            {mdMatches.length === 1 ? 'Fixture' : 'Fixtures'}
                          </span>
                        </div>
                        <div className="space-y-2">
                          {mdMatches.map((m) => (
                            <div
                              key={m.id}
                              className="rounded-[14px] bg-[#161616] border border-white/[0.06] p-3 flex flex-wrap items-center justify-between gap-2 text-xs shadow-card"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-bold text-white truncate">
                                  {m.homeName}
                                </span>
                                <span className="text-[#8E8E8E]">vs</span>
                                <span className="font-bold text-white truncate">
                                  {m.awayName}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-[#9E9E9E]">
                                <span>
                                  {m.scheduledTime} • {m.durationMinutes} min
                                </span>
                                <button
                                  type="button"
                                  onClick={() => onSelectMatch(m.id)}
                                  className="text-[#C8F558] font-bold hover:underline inline-flex items-center gap-1"
                                >
                                  <span>Referee</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* 2. DIRECT 1V1 ARENA AUTOMATED DRAW & FIXTURES */}
          {drawCategory === '1v1' && (
            <>
              <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4 space-y-3 shadow-card">
                <div className="flex items-center gap-2.5">
                  <GitBranch className="w-4 h-4 text-[#C8F558] shrink-0" />
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      1v1 Arena Automated Draw & Fixtures
                    </h3>
                    <p className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                      {players1v1.length} registered 1v1 players • Recommended
                      entry stage:{' '}
                      <span className="text-[#C8F558] font-bold">
                        {recommended1v1Stage}
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
                      Auto-Scale ({recommended1v1Stage} for {players1v1.length})
                    </option>
                    <option value="R16">Start at Round of 16 (R16)</option>
                    <option value="QF">Start at Quarter-Finals (QF)</option>
                    <option value="SF">Start at Semi-Finals (SF)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          'Run a randomized draw and generate fixtures for 1v1 Arena?'
                        )
                      ) {
                        regenerateKnockoutDraw({
                          category: '1v1',
                          startStage: drawStartStage,
                          source: 'RANDOM_DRAW',
                        });
                        setNotice(
                          'Automated 1v1 Arena draw & fixtures generated.'
                        );
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Run 1v1 Random Draw & Generate Fixtures</span>
                  </button>
                </div>
              </div>

              <div className="space-y-5">
                {active1v1Stages.map((st) => {
                  const stageMatches = knockout1v1Matches
                    .filter((m) => m.stage === st)
                    .sort(
                      (a, b) => (a.bracketOrder || 0) - (b.bracketOrder || 0)
                    );

                  return (
                    <div key={st} className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-1 rounded-md bg-[#C8F558] text-[#161616] text-[10px] font-bold uppercase">
                          {st} 1v1 Fixtures
                        </span>
                        <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                          {stageMatches.length}{' '}
                          {stageMatches.length === 1 ? 'Tie' : 'Ties'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2.5">
                        {stageMatches.map((m) => (
                          <KnockoutTieEditorCard
                            key={m.id}
                            match={m}
                            participants={players1v1}
                            onAssignSlot={assignSlotParticipant}
                            onSelectMatch={onSelectMatch}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
};
