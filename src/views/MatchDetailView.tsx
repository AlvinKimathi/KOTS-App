import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  Play,
  Pause,
  SlidersHorizontal,
  RotateCcw,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  FigmaPinIcon,
  formatMatchClock,
  IconlyBackCircleButton,
  IconlySearchButton,
  IconlySettingsButton,
  SectionTabHeader,
  StatComparisonRow,
  TeamCrestBadge,
  TopographicWavesSvg,
} from '../components/ui/FigmaWidgets';
import {
  AppNavTab,
  MatchEventType,
  MatchStats,
  MatchStatus,
} from '../types/tournament';

type DetailTab = 'statistics' | 'lineup' | 'timeline';

export const MatchDetailView: React.FC<{
  matchId: string;
  onBack: () => void;
  onOpenSearch: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({ matchId, onBack, onOpenSearch, onNavigateTab }) => {
  const {
    session,
    matches,
    teams7Aside,
    toggleClockRunning,
    adjustMatchClock,
    setMatchStatus,
    recordMatchEvent,
    removeMatchEvent,
    updateMatchStat,
    setPenaltyScore,
  } = useTournament();

  const [activeTab, setActiveTab] = useState<DetailTab>('statistics');
  const [showAdminDrawer, setShowAdminDrawer] = useState<boolean>(
    () => session.role === 'ADMIN'
  );
  const [lastLoggedBanner, setLastLoggedBanner] = useState<string | null>(null);

  // Event logger state
  const [eventSide, setEventSide] = useState<'HOME' | 'AWAY'>('HOME');
  const [eventType, setEventType] = useState<MatchEventType>('GOAL');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [selectedAssistId, setSelectedAssistId] = useState<string>('');

  const match = matches.find((m) => m.id === matchId) || matches[0];
  if (!match) return null;

  const isThisMatchClockRunning =
    match.status === 'LIVE' &&
    typeof match.clockStartedAt === 'number' &&
    match.clockStartedAt > 0;

  const homeTeam =
    match.category === '7aside'
      ? teams7Aside.find((t) => t.id === match.homeId)
      : undefined;
  const awayTeam =
    match.category === '7aside'
      ? teams7Aside.find((t) => t.id === match.awayId)
      : undefined;

  const activeSideTeam = eventSide === 'HOME' ? homeTeam : awayTeam;
  const activeSidePlayers = activeSideTeam?.players || [];

  const handleLogEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (match.category === '1v1') {
      const playerName =
        eventSide === 'HOME' ? match.homeName : match.awayName;
      const playerId = eventSide === 'HOME' ? match.homeId : match.awayId;
      recordMatchEvent({
        matchId: match.id,
        type: eventType,
        side: eventSide,
        playerId,
        playerName,
      });
      setLastLoggedBanner(
        `Logged ${eventType.replace('_', ' ')} for ${playerName}`
      );
      return;
    }

    const playerObj =
      activeSidePlayers.find((p) => p.id === selectedPlayerId) ||
      activeSidePlayers[0];
    const assistObj =
      eventType === 'GOAL' && selectedAssistId
        ? activeSidePlayers.find((p) => p.id === selectedAssistId)
        : undefined;

    const finalPlayerName =
      playerObj?.name ||
      (eventSide === 'HOME' ? match.homeName : match.awayName);

    recordMatchEvent({
      matchId: match.id,
      type: eventType,
      side: eventSide,
      playerId: playerObj?.id,
      playerName: finalPlayerName,
      assistPlayerId: assistObj?.id,
      assistPlayerName: assistObj?.name,
    });
    setLastLoggedBanner(
      `Logged ${eventType.replace('_', ' ')}: ${finalPlayerName}${
        assistObj ? ` (Assist: ${assistObj.name})` : ''
      }`
    );
    setSelectedAssistId('');
  };

  const statRows: {
    key: keyof MatchStats;
    label: string;
  }[] = [
    { key: 'shotsOnTarget', label: 'Shots on Target' },
    { key: 'shotsOffTarget', label: 'Shots off Target' },
    { key: 'blockedShots', label: 'Blocked Shots' },
    { key: 'possession', label: 'Possession (%)' },
    { key: 'corners', label: 'Corner Kicks' },
    { key: 'fouls', label: 'Fouls' },
    { key: 'yellowCards', label: 'Yellow Cards' },
    { key: 'redCards', label: 'Red Cards' },
  ];

  const isKnockoutDraw =
    match.stage !== 'GROUP' && match.homeScore === match.awayScore;

  return (
    <div className="space-y-6 pb-28">
      {/* Top Bar matching Match/ Detail/ Default (33:4866) */}
      <header className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-3.5">
          <IconlyBackCircleButton onClick={onBack} />
          <div>
            <h1 className="text-[28px] font-bold text-white leading-none">
              Match
            </h1>
            <p className="font-quicksand text-xs text-[#9E9E9E] font-medium mt-1">
              {match.status === 'LIVE' || match.status === 'HT'
                ? 'Live Matches'
                : match.status === 'FT'
                ? 'Full Time'
                : 'Upcoming Match'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {session.role === 'ADMIN' && (
            <button
              type="button"
              onClick={() => setShowAdminDrawer((prev) => !prev)}
              className={`px-3 h-11 sm:h-12 rounded-full border text-xs font-bold flex items-center gap-1.5 transition-all ${
                showAdminDrawer
                  ? 'bg-[#C8F558] text-[#161616] border-[#C8F558]'
                  : 'bg-[#161616]/70 text-white border-white/10 hover:bg-[#242224]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Referee</span>
            </button>
          )}
          <IconlySearchButton onClick={onOpenSearch} />
          <IconlySettingsButton
            title="Settings"
            onClick={() => onNavigateTab('settings')}
          />
        </div>
      </header>

      {/* Main Match Scoreboard Card matching Match/ Detail/ Default (33:4866) */}
      <section className="relative rounded-[20px] figma-wave-card p-5 overflow-hidden shadow-card">
        <TopographicWavesSvg className="absolute inset-0 w-full h-full opacity-95" />

        {/* Match Title & Competition Subtitle */}
        <div className="relative z-10 text-center space-y-0.5 mb-5">
          <h2 className="text-xs font-bold text-white tracking-tight">
            {match.homeName} VS {match.awayName}
          </h2>
          <p className="font-quicksand text-xs font-semibold text-[#7C9A32]">
            King of the Streets{' '}
            {match.category === '7aside' ? '7-Aside Cup' : '1v1 Showcase'}
          </p>
        </div>

        {/* HOME Box | Score & Timer | AWAY Box */}
        <div className="relative z-10 flex items-center justify-between gap-3 my-2">
          {/* HOME Crest Card (rounded-[18px] bg-[#242224]) */}
          <div className="bg-[#242224]/95 rounded-[18px] w-[86px] h-[98px] flex flex-col items-center justify-center gap-2 shrink-0">
            <TeamCrestBadge
              shortCode={match.homeShort}
              color={match.homeColor}
              size="lg"
            />
            <span className="text-[11px] font-bold tracking-wider uppercase text-white">
              HOME
            </span>
          </div>

          {/* Center Score & Black Clock Pill */}
          <div className="flex flex-col items-center justify-center flex-1">
            <div className="text-4xl font-bold tracking-tight text-white flex items-center gap-2.5">
              <span>{match.homeScore}</span>
              <span>-</span>
              <span>{match.awayScore}</span>
            </div>

            {typeof match.homePenalties === 'number' &&
              typeof match.awayPenalties === 'number' && (
                <div className="mt-1 text-[11px] font-bold text-[#C8F558]">
                  PEN ({match.homePenalties} - {match.awayPenalties})
                </div>
              )}

            <div className="mt-3 px-3.5 py-1 rounded-full bg-[#0A0A0A] flex items-center gap-1.5">
              <span className="text-xs font-bold text-white keep-white-text tracking-wide">
                {formatMatchClock(match)}
              </span>
            </div>
          </div>

          {/* AWAY Crest Card (rounded-[18px] bg-[#242224]) */}
          <div className="bg-[#242224]/95 rounded-[18px] w-[86px] h-[98px] flex flex-col items-center justify-center gap-2 shrink-0">
            <TeamCrestBadge
              shortCode={match.awayShort}
              color={match.awayColor}
              size="lg"
            />
            <span className="text-[11px] font-bold tracking-wider uppercase text-white">
              AWAY
            </span>
          </div>
        </div>

        {/* Bottom Dashed Ticket Line + Venue & Stage Row */}
        <div className="relative z-10 mt-5 pt-3 border-t border-dashed border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-[#7C9A32] font-quicksand font-semibold uppercase tracking-wide">
            <FigmaPinIcon className="w-3.5 h-3.5 text-[#7C9A32]" />
            <span>{match.venue}</span>
          </div>
          <span className="text-white font-medium">
            {match.stage === 'GROUP' ? match.groupId : match.stage}
          </span>
        </div>
      </section>

      {/* Collapsible Live Referee Console (When toggled by Admin) */}
      {session.role === 'ADMIN' && showAdminDrawer && (
        <section className="rounded-[16px] bg-[#161616] border border-[#C8F558]/40 p-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-[#C8F558] uppercase tracking-wider">
                Live Referee & Stat Console
              </div>
              <div className="font-quicksand text-[11px] text-[#8E8E8E]">
                Updates standings, GD, GF, GA, cards, and R16 knockouts in real time
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(['UPCOMING', 'LIVE', 'HT', 'FT'] as MatchStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setMatchStatus(match.id, st)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                    match.status === st
                      ? 'bg-white text-[#161616]'
                      : 'bg-[#242224] text-[#8E8E8E] hover:text-white'
                  }`}
                >
                  {st}
                </button>
              ))}
              {match.status === 'LIVE' && (
                <button
                  type="button"
                  onClick={() => toggleClockRunning(match.id)}
                  className="ml-1 px-2.5 py-1 rounded-lg bg-[#C8F558] text-[#161616] text-[10px] font-bold flex items-center gap-1"
                >
                  {isThisMatchClockRunning ? (
                    <>
                      <Pause className="w-3 h-3" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-3 h-3" /> Resume
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Match Clock Calibration Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#141513] border border-white/[0.06] px-3 py-2 text-[11px]">
            <div className="flex items-center gap-1.5 text-[#9E9E9E] font-quicksand font-semibold">
              <Clock className="w-3.5 h-3.5 text-[#C8F558]" />
              <span>Clock Calibration ({formatMatchClock(match)}):</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => adjustMatchClock(match.id, 'RESET')}
                className="px-2 py-1 rounded-lg bg-[#242224] hover:bg-white/10 text-white text-[10px] font-bold inline-flex items-center gap-1"
                title="Reset Clock to 00:00"
              >
                <RotateCcw className="w-2.5 h-2.5" />
                <span>00:00</span>
              </button>
              <button
                type="button"
                onClick={() => adjustMatchClock(match.id, -60)}
                className="px-2 py-1 rounded-lg bg-[#242224] hover:bg-white/10 text-white text-[10px] font-bold"
              >
                -1 Min
              </button>
              <button
                type="button"
                onClick={() => adjustMatchClock(match.id, 60)}
                className="px-2 py-1 rounded-lg bg-[#242224] hover:bg-white/10 text-white text-[10px] font-bold"
              >
                +1 Min
              </button>
              <button
                type="button"
                onClick={() => adjustMatchClock(match.id, 'SECOND_HALF')}
                className="px-2 py-1 rounded-lg bg-[#242224] hover:bg-white/10 text-[#C8F558] text-[10px] font-bold"
                title="Set Clock to 2nd Half Kickoff"
              >
                2nd Half ({Math.floor(match.durationMinutes / 2)}:00)
              </button>
            </div>
          </div>

          {lastLoggedBanner && (
            <div className="rounded-xl bg-[#C8F558]/15 border border-[#C8F558] px-3 py-2 flex items-center justify-between gap-2 text-xs text-white">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#C8F558] shrink-0" />
                <span className="font-semibold">{lastLoggedBanner}</span>
              </div>
              <button
                type="button"
                onClick={() => setLastLoggedBanner(null)}
                className="text-[10px] font-bold text-[#C8F558]"
              >
                Dismiss
              </button>
            </div>
          )}

          <form onSubmit={handleLogEvent} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div>
                <label className="block text-[10px] text-[#8E8E8E] mb-1 uppercase">
                  Team Side
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#141513] p-1 rounded-xl border border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      setEventSide('HOME');
                      setSelectedPlayerId('');
                      setSelectedAssistId('');
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold ${
                      eventSide === 'HOME'
                        ? 'bg-[#C8F558] text-[#161616]'
                        : 'text-white'
                    }`}
                  >
                    {match.homeShort}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEventSide('AWAY');
                      setSelectedPlayerId('');
                      setSelectedAssistId('');
                    }}
                    className={`py-1.5 rounded-lg text-[11px] font-bold ${
                      eventSide === 'AWAY'
                        ? 'bg-[#C8F558] text-[#161616]'
                        : 'text-white'
                    }`}
                  >
                    {match.awayShort}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-[#8E8E8E] mb-1 uppercase">
                  Event Type
                </label>
                <select
                  value={eventType}
                  onChange={(e) =>
                    setEventType(e.target.value as MatchEventType)
                  }
                  className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                >
                  <option value="GOAL">Goal (+1 Score)</option>
                  <option value="YELLOW_CARD">Yellow Card</option>
                  <option value="RED_CARD">Red Card</option>
                </select>
              </div>

              {match.category === '7aside' && (
                <div>
                  <label className="block text-[10px] text-[#8E8E8E] mb-1 uppercase">
                    Player (10-Man Squad)
                  </label>
                  <select
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                  >
                    {activeSidePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber} {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {match.category === '7aside' && eventType === 'GOAL' && (
                <div>
                  <label className="block text-[10px] text-[#8E8E8E] mb-1 uppercase">
                    Assist (Optional)
                  </label>
                  <select
                    value={selectedAssistId}
                    onChange={(e) => setSelectedAssistId(e.target.value)}
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3 py-2 text-xs text-white focus:border-[#C8F558] focus:outline-none"
                  >
                    <option value="">Unassisted</option>
                    {activeSidePlayers.map((p) => (
                      <option key={p.id} value={p.id}>
                        #{p.jerseyNumber} {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] font-bold text-xs transition-colors"
            >
              Record Live {eventType.replace('_', ' ')} for{' '}
              {eventSide === 'HOME' ? match.homeName : match.awayName}
            </button>
          </form>

          {/* Quick Recent Events & Undo Strip inside Referee Console */}
          {match.events.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#8E8E8E] font-bold">
                <span>Recent Match Events (Tap Trash to Undo)</span>
                <span>{match.events.length} total</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {match.events.slice(0, 4).map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-[#141513] border border-white/[0.05] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded-full bg-[#0A0A0A] text-[#C8F558] keep-lime-text text-[10px] font-bold shrink-0">
                        {ev.minute}&apos;
                      </span>
                      <span className="font-bold text-white truncate">
                        {ev.playerName}
                      </span>
                      <span className="text-[10px] text-[#9E9E9E] shrink-0">
                        ({ev.side === 'HOME' ? match.homeShort : match.awayShort} •{' '}
                        {ev.type.replace('_', ' ')})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMatchEvent(match.id, ev.id)}
                      title="Undo / Remove Event"
                      className="p-1 rounded-lg text-[#8E8E8E] hover:text-red-400 hover:bg-white/5 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isKnockoutDraw && (
            <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-semibold text-[#C8F558]">
                Knockout Tie-Breaker (Penalties):
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white">{match.homeShort}</span>
                <input
                  type="number"
                  min={0}
                  value={match.homePenalties ?? 0}
                  onChange={(e) =>
                    setPenaltyScore(
                      match.id,
                      Number(e.target.value),
                      match.awayPenalties ?? 0
                    )
                  }
                  className="w-14 rounded-lg bg-[#141513] border border-white/15 px-2 py-1 text-center text-xs font-bold text-white"
                />
                <span className="text-xs text-white/50">-</span>
                <input
                  type="number"
                  min={0}
                  value={match.awayPenalties ?? 0}
                  onChange={(e) =>
                    setPenaltyScore(
                      match.id,
                      match.homePenalties ?? 0,
                      Number(e.target.value)
                    )
                  }
                  className="w-14 rounded-lg bg-[#141513] border border-white/15 px-2 py-1 text-center text-xs font-bold text-white"
                />
                <span className="text-xs text-white">{match.awayShort}</span>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Details Section matching Match/ Detail/ Default (33:4866) */}
      <section className="space-y-4">
        <SectionTabHeader title="Details" />

        {/* 3-Tab Pill Switcher (Tabs/ Active/ Only Text 67:8428 & 67:8426) */}
        <div className="grid grid-cols-3 gap-2.5">
          {(['statistics', 'lineup', 'timeline'] as DetailTab[]).map((tab) => {
            const label =
              tab === 'statistics'
                ? 'Statistics'
                : tab === 'lineup'
                ? 'Lineup'
                : 'Timeline';
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`h-[42px] px-4 rounded-full text-xs font-bold border transition-all capitalize ${
                  isActive
                    ? 'bg-white text-[#161616] border-2 border-[#C8F558] shadow-sm'
                    : 'bg-[#161616] text-white border-white/[0.06] hover:border-white/20'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* TAB 1: STATISTICS (Exact Match/ Detail/ Default 33:4866 Layout) */}
        {activeTab === 'statistics' && (
          <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-4 space-y-3">
            {statRows.map((row) => {
              const [homeVal, awayVal] = match.stats[row.key];
              return (
                <div key={row.key} className="space-y-1">
                  <StatComparisonRow
                    label={row.label}
                    homeValue={homeVal}
                    awayValue={awayVal}
                  />
                  {session.role === 'ADMIN' && showAdminDrawer && (
                    <div className="flex items-center justify-between px-2 pt-0.5 text-[10px] text-[#8E8E8E]">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            updateMatchStat(
                              match.id,
                              row.key,
                              'HOME',
                              row.key === 'possession' ? -5 : -1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-[#242224] hover:bg-white/10 flex items-center justify-center text-white"
                          title={`Decrease ${match.homeShort} ${row.label}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMatchStat(
                              match.id,
                              row.key,
                              'HOME',
                              row.key === 'possession' ? 5 : 1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-[#242224] hover:bg-white/10 flex items-center justify-center text-white"
                          title={`Increase ${match.homeShort} ${row.label}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-white/80">
                          {match.homeShort}
                        </span>
                      </div>
                      <span>
                        Adjust {row.label}
                        {row.key === 'possession' ? ' (5% step)' : ''}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-white/80">
                          {match.awayShort}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            updateMatchStat(
                              match.id,
                              row.key,
                              'AWAY',
                              row.key === 'possession' ? -5 : -1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-[#242224] hover:bg-white/10 flex items-center justify-center text-white"
                          title={`Decrease ${match.awayShort} ${row.label}`}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            updateMatchStat(
                              match.id,
                              row.key,
                              'AWAY',
                              row.key === 'possession' ? 5 : 1
                            )
                          }
                          className="w-6 h-6 rounded-lg bg-[#242224] hover:bg-white/10 flex items-center justify-center text-white"
                          title={`Increase ${match.awayShort} ${row.label}`}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: LINEUP (10-Player Squad Lists for Home & Away) */}
        {activeTab === 'lineup' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                side: 'HOME' as const,
                name: match.homeName,
                short: match.homeShort,
                color: match.homeColor,
                team: homeTeam,
              },
              {
                side: 'AWAY' as const,
                name: match.awayName,
                short: match.awayShort,
                color: match.awayColor,
                team: awayTeam,
              },
            ].map((sideInfo) => (
              <div
                key={sideInfo.side}
                className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4 space-y-3"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06]">
                  <div className="flex items-center gap-2.5">
                    <TeamCrestBadge
                      shortCode={sideInfo.short}
                      color={sideInfo.color}
                      size="sm"
                    />
                    <div>
                      <div className="text-xs font-bold text-white">
                        {sideInfo.name}
                      </div>
                      <div className="font-quicksand text-[10px] text-[#8E8E8E]">
                        {match.category === '7aside'
                          ? 'Registered 10-Player Squad'
                          : '1v1 Competitor'}
                      </div>
                    </div>
                  </div>
                </div>

                {match.category === '1v1' ? (
                  <div className="py-3 text-xs text-white font-medium">
                    1v1 Competitor: {sideInfo.name} ({sideInfo.short})
                  </div>
                ) : !sideInfo.team ? (
                  <div className="py-4 text-xs text-[#8E8E8E]">
                    Squad awaiting draw assignment
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {sideInfo.team.players.map((player) => {
                      const matchGoals = match.events.filter(
                        (e) =>
                          e.type === 'GOAL' && e.playerId === player.id
                      ).length;
                      const matchYC = match.events.filter(
                        (e) =>
                          e.type === 'YELLOW_CARD' && e.playerId === player.id
                      ).length;
                      const matchRC = match.events.filter(
                        (e) =>
                          e.type === 'RED_CARD' && e.playerId === player.id
                      ).length;

                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#242224] text-xs"
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 text-[11px] font-bold text-[#8E8E8E]">
                              {player.jerseyNumber}
                            </span>
                            <span className="font-medium text-white">
                              {player.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {matchGoals > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-[#C8F558]/20 text-[#C8F558] text-[10px] font-bold">
                                {matchGoals}G
                              </span>
                            )}
                            {matchYC > 0 && (
                              <span
                                className="w-2.5 h-3.5 rounded-[2px] bg-[#FACC15] inline-block"
                                title="Yellow Card"
                              />
                            )}
                            {matchRC > 0 && (
                              <span
                                className="w-2.5 h-3.5 rounded-[2px] bg-[#EF4444] inline-block"
                                title="Red Card"
                              />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: TIMELINE */}
        {activeTab === 'timeline' && (
          <div className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-4">
            {match.events.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#8E8E8E]">
                No match events recorded yet
              </div>
            ) : (
              <div className="space-y-2.5">
                {match.events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#242224] border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-full bg-[#0A0A0A] text-[#C8F558] keep-lime-text text-[11px] font-bold">
                        {ev.minute}&apos;
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">
                            {ev.playerName}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/5 text-[#9E9E9E]">
                            {ev.side === 'HOME'
                              ? match.homeShort
                              : match.awayShort}
                          </span>
                        </div>
                        <div className="font-quicksand text-[11px] text-[#8E8E8E] mt-0.5">
                          {ev.type === 'GOAL' && (
                            <span className="text-[#C8F558] font-semibold">
                              Goal
                              {ev.assistPlayerName
                                ? ` • Assist: ${ev.assistPlayerName}`
                                : ''}
                            </span>
                          )}
                          {ev.type === 'YELLOW_CARD' && (
                            <span className="text-[#FACC15] font-semibold">
                              Yellow Card
                            </span>
                          )}
                          {ev.type === 'RED_CARD' && (
                            <span className="text-[#EF4444] font-semibold">
                              Red Card
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {session.role === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => removeMatchEvent(match.id, ev.id)}
                        title="Remove Event"
                        className="p-1.5 rounded-lg text-[#8E8E8E] hover:text-red-400 hover:bg-white/5 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};
