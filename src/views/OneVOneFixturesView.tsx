import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Swords } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  EmptyMatchesCard,
  formatMatchClock,
  IconlySearchButton,
  IconlySettingsButton,
  LiveScoreHeroCard,
  LiveScoreSmallCard,
  SectionTabHeader,
  TeamCrestBadge,
  UpcomingMatchCard,
} from '../components/ui/FigmaWidgets';
import { resolveMatchWinnerSide } from '../utils/knockoutEngine';
import { AppNavTab } from '../types/tournament';

type FixtureFilter = 'ALL' | 'LIVE' | 'UPCOMING' | 'FT';

export const OneVOneFixturesView: React.FC<{
  onSelectMatch: (matchId: string) => void;
  onOpenSearch: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
  onOpen1v1Standings: () => void;
}> = ({ onSelectMatch, onOpenSearch, onNavigateTab, onOpen1v1Standings }) => {
  const { matches } = useTournament();
  const [filter, setFilter] = useState<FixtureFilter>('ALL');

  const all1v1Matches = matches.filter(
    (m) => m.category === '1v1' && !(m.homeId === 'TBD' && m.awayId === 'TBD')
  );

  const liveMatches = all1v1Matches.filter(
    (m) => m.status === 'LIVE' || m.status === 'HT'
  );
  const upcomingMatches = all1v1Matches.filter((m) => m.status === 'UPCOMING');
  const finishedMatches = all1v1Matches.filter((m) => m.status === 'FT');

  const showLive = filter === 'ALL' || filter === 'LIVE';
  const showUpcoming = filter === 'ALL' || filter === 'UPCOMING';
  const showFinished = filter === 'ALL' || filter === 'FT';

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[24px] font-bold text-white leading-tight">
            1v1 Arena
          </h1>
          <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
            {all1v1Matches.length} Active Arena Ties • Ballmania 1v1 Showcase
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

      {/* Filter Pills */}
      <div className="grid grid-cols-4 gap-1.5 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
        {(
          [
            { id: 'ALL', label: `All (${all1v1Matches.length})` },
            { id: 'LIVE', label: `Live (${liveMatches.length})` },
            { id: 'UPCOMING', label: `Next (${upcomingMatches.length})` },
            { id: 'FT', label: `FT (${finishedMatches.length})` },
          ] as const
        ).map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`h-[38px] rounded-full text-[11px] font-normal transition-all ${
                active
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
                  : 'text-[#8E8E8E] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* 1. LIVE 1v1 MATCHES */}
      {showLive && (
        <section className="space-y-3">
          <SectionTabHeader title="Live 1v1" />

          {liveMatches.length === 0 ? (
            <EmptyMatchesCard label="No Live 1v1 Fixtures Right Now" />
          ) : liveMatches.length === 1 ? (
            <LiveScoreHeroCard
              match={liveMatches[0]}
              onSelect={onSelectMatch}
            />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {liveMatches.map((m) => (
                <LiveScoreSmallCard
                  key={m.id}
                  match={m}
                  onSelect={onSelectMatch}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. UPCOMING 1v1 FIXTURES */}
      {showUpcoming && (
        <section className="space-y-3">
          <SectionTabHeader title="Upcoming" />

          {upcomingMatches.length === 0 ? (
            <EmptyMatchesCard label="No Upcoming 1v1 Fixtures" />
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((m) => (
                <UpcomingMatchCard
                  key={m.id}
                  match={m}
                  showRightArrow
                  onSelect={onSelectMatch}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. COMPLETED (FT) 1v1 FIXTURES */}
      {showFinished && (
        <section className="space-y-3">
          <SectionTabHeader title="Results" />

          {finishedMatches.length === 0 ? (
            <EmptyMatchesCard label="No Completed 1v1 Results Yet" />
          ) : (
            <div className="space-y-2.5">
              {finishedMatches.map((m) => {
                const winnerSide = resolveMatchWinnerSide(m);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => onSelectMatch(m.id)}
                    className="w-full text-left rounded-[16px] bg-[#161616] border border-white/[0.06] hover:border-[#C8F558]/40 p-3.5 flex items-center justify-between gap-3 transition-all shadow-card"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center -space-x-1.5 shrink-0">
                        <div className="w-9 h-9 rounded-full bg-[#242224] flex items-center justify-center">
                          <TeamCrestBadge
                            shortCode={m.homeShort}
                            color={m.homeColor}
                            size="xs"
                          />
                        </div>
                        <div className="w-9 h-9 rounded-full bg-[#242224] flex items-center justify-center border-l border-[#161616]">
                          <TeamCrestBadge
                            shortCode={m.awayShort}
                            color={m.awayColor}
                            size="xs"
                          />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                          <span
                            className={
                              winnerSide === 'HOME' ? 'text-[#C8F558]' : ''
                            }
                          >
                            {m.homeName}
                          </span>
                          <span className="text-[#8E8E8E]">vs</span>
                          <span
                            className={
                              winnerSide === 'AWAY' ? 'text-[#C8F558]' : ''
                            }
                          >
                            {m.awayName}
                          </span>
                        </div>
                        <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E] flex items-center gap-1.5 mt-0.5">
                          <span>{m.stage}</span>
                          <span>•</span>
                          <span>{formatMatchClock(m)}</span>
                          {winnerSide && (
                            <>
                              <span>•</span>
                              <span className="inline-flex items-center gap-1 text-[#C8F558] font-normal">
                                <CheckCircle2 className="w-3 h-3" />
                                {winnerSide === 'HOME'
                                  ? m.homeShort
                                  : m.awayShort}{' '}
                                Won
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="px-3 py-1 rounded-full bg-[#242224] text-xs font-bold text-white">
                        {m.homeScore} - {m.awayScore}
                      </div>
                      <ArrowRight className="w-4 h-4 text-[#8E8E8E]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Quick Link to 1v1 Standings */}
      <button
        type="button"
        onClick={onOpen1v1Standings}
        className="w-full py-3 px-4 rounded-2xl bg-[#161616] border border-white/[0.06] hover:border-[#C8F558]/40 flex items-center justify-between text-xs font-bold text-white transition-all shadow-card"
      >
        <div className="flex items-center gap-2.5">
          <Swords className="w-4 h-4 text-[#C8F558]" />
          <span>View 1v1 Standings & Knockout Bracket</span>
        </div>
        <ArrowRight className="w-4 h-4 text-[#C8F558]" />
      </button>
    </div>
  );
};
