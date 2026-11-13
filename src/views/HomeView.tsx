import React, { useEffect, useState } from 'react';
import { Swords, Trophy } from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  EmptyMatchesCard,
  IconlySearchButton,
  IconlySettingsButton,
  IconlyThemeToggleButton,
  KotsCrownEmblem,
  LiveScoreHeroCard,
  LiveScoreSmallCard,
  SectionTabHeader,
  UpcomingMatchCard,
} from '../components/ui/FigmaWidgets';
import { AppNavTab } from '../types/tournament';

type FilterPill = '7aside' | 'knockouts' | '1v1' | 'all';

const FEED_1_PHOTOS = [
  '/feed/feed-turf-circle.jpg',
  '/feed/feed-squad.jpg',
  '/feed/feed-pitch.jpg',
];

const FEED_2_PHOTOS = [
  '/feed/feed-1v1.jpg',
  '/feed/feed-team-yellow.jpg',
  '/feed/feed-winners-cheque.jpg',
  '/feed/feed-prize-handover.jpg',
];

export const HomeView: React.FC<{
  onSelectMatch: (matchId: string) => void;
  onOpenSearch: () => void;
  onOpenUserModal: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({ onSelectMatch, onOpenSearch, onOpenUserModal, onNavigateTab }) => {
  const { session, theme, toggleTheme, matches } = useTournament();
  const [activeFilter, setActiveFilter] = useState<FilterPill>('7aside');
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);
  const [feed1PhotoIdx, setFeed1PhotoIdx] = useState(0);
  const [feed2PhotoIdx, setFeed2PhotoIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFeed1PhotoIdx((prev) => (prev + 1) % FEED_1_PHOTOS.length);
      setFeed2PhotoIdx((prev) => (prev + 1) % FEED_2_PHOTOS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const isAdmin = session.role === 'ADMIN';

  const filterMatches = matches.filter((m) => {
    if (activeFilter === '7aside') return m.category === '7aside';
    if (activeFilter === 'knockouts')
      return m.stage !== 'GROUP' && m.stage !== 'LEAGUE';
    if (activeFilter === '1v1') return m.category === '1v1';
    return true;
  });

  const liveMatches = filterMatches.filter(
    (m) => m.status === 'LIVE' || m.status === 'HT'
  );
  const upcomingMatches = filterMatches.filter(
    (m) =>
      m.status === 'UPCOMING' &&
      !(m.homeId === 'TBD' && m.awayId === 'TBD')
  );

  const displayedUpcoming = showAllUpcoming
    ? upcomingMatches
    : upcomingMatches.slice(0, 2);

  const pillItems: {
    id: FilterPill;
    line1: string;
    line2: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: '7aside',
      line1: 'King of the Streets',
      line2: 'Group Phase',
      icon: <KotsCrownEmblem size={34} dark={activeFilter === '7aside'} />,
    },
    {
      id: 'knockouts',
      line1: 'Top 8 Championship',
      line2: 'QF • SF • Final',
      icon: <Trophy className="w-6 h-6" />,
    },
    {
      id: '1v1',
      line1: 'Street Showcase',
      line2: '1v1 Arena',
      icon: <Swords className="w-6 h-6" />,
    },
    {
      id: 'all',
      line1: 'All Categories',
      line2: 'All Fixtures',
      icon: <Trophy className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-6 pb-28">
      {/* Top Header matching Homepage/ Default (24:2823) */}
      <header className="flex items-center justify-between gap-2 pt-3">
        <button
          type="button"
          onClick={onOpenUserModal}
          className="text-left group flex items-center gap-2 min-w-0"
        >
          <img
            src="/kots-logo.png?v=2"
            alt="King of the Streets Cup"
            className="w-9 h-9 object-contain shrink-0 drop-shadow"
          />
          <h1 className="text-[22px] sm:text-[26px] font-bold tracking-tight text-white group-hover:text-[#C8F558] transition-colors leading-none truncate">
            Hi {session.username},
          </h1>
          {isAdmin && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-normal uppercase tracking-wider bg-[#161616]/80 text-[#C8F558] border border-[#C8F558]/40 shrink-0">
              ADMIN
            </span>
          )}
        </button>

        <div className="flex items-center gap-2 shrink-0">
          <IconlyThemeToggleButton theme={theme} onToggle={toggleTheme} />
          <IconlySearchButton onClick={onOpenSearch} />
          <IconlySettingsButton
            title="Settings"
            onClick={() => onNavigateTab('settings')}
          />
        </div>
      </header>

      {/* Fixtures Section Header (Header 57:7911) */}
      <section className="space-y-4">
        <SectionTabHeader title="Fixtures" />

        {/* Competition Selector Bar (Tabs/ Active 61:7950 + Tabs/ Incactive 62:7970) */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          {pillItems.map((item) => {
            const isActive = activeFilter === item.id;
            return isActive ? (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFilter(item.id)}
                className="h-[56px] rounded-full bg-white text-[#161616] border-2 border-[#C8F558] px-4 flex items-center gap-3 shrink-0 shadow-md transition-all"
              >
                {item.icon}
                <div className="text-left leading-tight pr-1">
                  <div className="text-xs font-normal text-[#161616]">
                    {item.line1}
                  </div>
                  <div className="text-xs font-bold text-[#161616]">
                    {item.line2}
                  </div>
                </div>
              </button>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveFilter(item.id)}
                title={`${item.line1} — ${item.line2}`}
                className="w-[56px] h-[56px] rounded-full bg-[#161616] hover:bg-[#242224] border border-white/[0.06] text-white flex items-center justify-center shrink-0 transition-all"
              >
                {item.icon}
              </button>
            );
          })}
        </div>

        {/* LIVE FIXTURES Sub-Section */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between">
            <span className="font-quicksand text-xs font-normal tracking-wider uppercase text-[#BDBDBD]">
              LIVE FIXTURES
            </span>
          </div>

          {liveMatches.length === 0 ? (
            <EmptyMatchesCard label="No Live Fixtures" />
          ) : liveMatches.length === 1 ? (
            <LiveScoreHeroCard
              match={liveMatches[0]}
              onSelect={onSelectMatch}
            />
          ) : (
            /* When multiple fixtures are live (e.g. All Fixtures filter), show the 2-column Cards/ Small layout from Homepage/ English PL (24:2956) */
            <div className="grid grid-cols-2 gap-3">
              {liveMatches.map((match) => (
                <LiveScoreSmallCard
                  key={match.id}
                  match={match}
                  onSelect={onSelectMatch}
                />
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING FIXTURES Sub-Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <span className="font-quicksand text-xs font-normal tracking-wider uppercase text-[#BDBDBD]">
              UPCOMING FIXTURES
            </span>
            <button
              type="button"
              onClick={() => setShowAllUpcoming((prev) => !prev)}
              className="text-xs font-normal tracking-wider uppercase text-[#7C9A32] hover:text-[#C8F558] transition-colors"
            >
              {showAllUpcoming ? 'SHOW LESS' : 'VIEW ALL'}
            </button>
          </div>

          {displayedUpcoming.length === 0 ? (
            <EmptyMatchesCard label="No Upcoming Fixtures" />
          ) : (
            <div className="space-y-3">
              {displayedUpcoming.map((match) => (
                <UpcomingMatchCard
                  key={match.id}
                  match={match}
                  onSelect={onSelectMatch}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Feed Section matching Banner/ Large (61:7913) in Homepage/ Default */}
      <section className="space-y-4">
        <SectionTabHeader title="Feed" />

        {/* Feed Banner 1 — Rotates every 10 seconds across turf circle, squad, and pitch photos */}
        <div
          onClick={() => onNavigateTab(isAdmin ? 'register' : 'teams')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onNavigateTab(isAdmin ? 'register' : 'teams');
            }
          }}
          className="keep-white-scope relative h-[228px] rounded-[14px] overflow-hidden bg-[#161616] p-4 flex flex-col justify-end cursor-pointer group shadow-card"
        >
          {FEED_1_PHOTOS.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover object-[center_28%] group-hover:scale-105 transition-all duration-700 ${
                idx === feed1PhotoIdx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          <div className="relative z-10 space-y-1">
            <h3 className="keep-white-text text-sm font-bold text-white">
              Cash on the Line, Pride on the Pitch!
            </h3>
            <p className="font-quicksand text-xs font-normal text-[#D4D4D4] line-clamp-2 leading-snug">
              Kings of the Streets is back bigger and better. Think you&apos;re
              good enough, Prove it Get Paid!!
            </p>
          </div>
        </div>

        {/* Feed Banner 2 — Rotates every 10 seconds across 1v1, team yellow, winners cheque, and prize handover photos */}
        <div
          onClick={() => onNavigateTab('1v1')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onNavigateTab('1v1');
          }}
          className="keep-white-scope relative h-[228px] rounded-[14px] overflow-hidden bg-[#161616] p-4 flex flex-col justify-end cursor-pointer group shadow-card"
        >
          {FEED_2_PHOTOS.map((src, idx) => (
            <img
              key={src}
              src={src}
              alt=""
              className={`absolute inset-0 w-full h-full object-cover object-[center_22%] group-hover:scale-105 transition-all duration-700 ${
                idx === feed2PhotoIdx ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/10" />

          <div className="relative z-10 space-y-1">
            <h3 className="keep-white-text text-sm font-bold text-white">
              Tournament Proceedings Set & Match
            </h3>
            <p className="font-quicksand text-xs font-normal text-[#D4D4D4] line-clamp-2 leading-snug">
              Follow Live updates and stats across the tournament
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
