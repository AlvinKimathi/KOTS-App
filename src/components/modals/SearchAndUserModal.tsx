import React, { useEffect, useState } from 'react';
import { LogOut, ShieldCheck, User, X } from 'lucide-react';
import { useTournament } from '../../context/TournamentContext';
import {
  IconlyRightArrowCircle,
  LiveScoreHeroCard,
  TeamCrestBadge,
  UpcomingMatchCard,
} from '../ui/FigmaWidgets';
import { calculatePlayerLeaderboards } from '../../utils/standingsCalculator';
import { AppNavTab } from '../../types/tournament';

/**
 * Exact Search/ Default (51:6022) & Search/ Results (51:6187) screen overlay from Figma.
 */
export const SearchModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectMatch: (matchId: string) => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({ isOpen, onClose, onSelectMatch, onNavigateTab }) => {
  const { matches, teams7Aside, players1v1, pastSearches, addPastSearch } =
    useTournament();
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const q = query.trim().toLowerCase();

  const matchedLive = q
    ? matches.filter(
        (m) =>
          (m.status === 'LIVE' || m.status === 'HT') &&
          (m.homeName.toLowerCase().includes(q) ||
            m.awayName.toLowerCase().includes(q) ||
            m.homeShort.toLowerCase().includes(q) ||
            m.awayShort.toLowerCase().includes(q) ||
            (m.groupId && m.groupId.toLowerCase().includes(q)))
      )
    : [];

  const matchedUpcoming = q
    ? matches.filter(
        (m) =>
          m.status !== 'LIVE' &&
          m.status !== 'HT' &&
          !(m.homeId === 'TBD' && m.awayId === 'TBD') &&
          (m.homeName.toLowerCase().includes(q) ||
            m.awayName.toLowerCase().includes(q) ||
            m.homeShort.toLowerCase().includes(q) ||
            m.awayShort.toLowerCase().includes(q) ||
            (m.groupId && m.groupId.toLowerCase().includes(q)) ||
            m.stage.toLowerCase().includes(q))
      )
    : [];

  const allPlayers = calculatePlayerLeaderboards(teams7Aside, matches);
  const matchedPlayers = q
    ? allPlayers.filter(
        (p) =>
          p.playerName.toLowerCase().includes(q) ||
          p.teamName.toLowerCase().includes(q)
      )
    : [];

  const matchedTeams = q
    ? teams7Aside.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.shortCode.toLowerCase().includes(q) ||
          t.groupId.toLowerCase().includes(q)
      )
    : [];

  const matched1v1 = q
    ? players1v1.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.shortCode.toLowerCase().includes(q)
      )
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      addPastSearch(query.trim());
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 bg-[#141513]/75 backdrop-blur-md flex flex-col items-center px-4 pt-6 pb-28 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-[440px] space-y-5">
        {/* Top Input Pill (Input 67:10755: 358x56, radius 800, #C8F558 stroke) */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="h-[56px] flex items-center gap-3.5 rounded-full bg-[#161616]/90 border border-[#C8F558] px-5 shadow-lg">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0"
            >
              <circle
                cx="11.7666"
                cy="11.7666"
                r="8.98856"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.0183 18.4851L21.5423 22"
                stroke="white"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type and Find your team"
              autoFocus
              className="w-full bg-transparent font-quicksand text-sm font-medium text-white placeholder-[#8E8E8E] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => {
                if (query) setQuery('');
                else onClose();
              }}
              className="text-[#8E8E8E] hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* STATE 1: Search/ Default (51:6022) — PAST SEARCHES Card */}
        {!q ? (
          <div className="rounded-[16px] bg-[#161616] p-4 shadow-card">
            <div className="font-quicksand text-xs font-medium tracking-wider uppercase text-[#8E8E8E] mb-2">
              PAST SEARCHES
            </div>
            <div className="divide-y divide-white/[0.08]">
              {pastSearches.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setQuery(item)}
                  className="w-full py-3.5 flex items-center justify-between text-left group"
                >
                  <div className="text-sm truncate pr-3">
                    <span className="font-bold text-white group-hover:text-[#C8F558] transition-colors">
                      {item}
                    </span>
                    <span className="font-quicksand text-[#8E8E8E] ml-1.5">
                      | King of the Streets Cup
                    </span>
                  </div>
                  <IconlyRightArrowCircle />
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* STATE 2: Search/ Results (51:6187) — LIVE FIXTURES, UPCOMING FIXTURES, TOP PLAYERS, TEAMS */
          <div className="space-y-4">
            {/* LIVE FIXTURES Card */}
            {matchedLive.length > 0 && (
              <div className="rounded-[16px] bg-[#161616] p-4 space-y-3 shadow-card">
                <div className="font-quicksand text-xs font-medium tracking-wider uppercase text-[#8E8E8E]">
                  LIVE FIXTURES
                </div>
                <div className="space-y-3">
                  {matchedLive.map((m) => (
                    <LiveScoreHeroCard
                      key={m.id}
                      match={m}
                      onSelect={(id) => {
                        addPastSearch(query);
                        onSelectMatch(id);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* UPCOMING FIXTURES Card */}
            {matchedUpcoming.length > 0 && (
              <div className="rounded-[16px] bg-[#161616] p-4 space-y-2.5 shadow-card">
                <div className="font-quicksand text-xs font-medium tracking-wider uppercase text-[#8E8E8E]">
                  UPCOMING FIXTURES
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {matchedUpcoming.slice(0, 3).map((m) => (
                    <UpcomingMatchCard
                      key={m.id}
                      match={m}
                      showRightArrow
                      onSelect={(id) => {
                        addPastSearch(query);
                        onSelectMatch(id);
                        onClose();
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* TOP PLAYERS Card */}
            {(matchedPlayers.length > 0 || matched1v1.length > 0) && (
              <div className="rounded-[16px] bg-[#161616] p-4 space-y-3 shadow-card">
                <div className="font-quicksand text-xs font-medium tracking-wider uppercase text-[#8E8E8E]">
                  TOP PLAYERS
                </div>
                <div className="divide-y divide-white/[0.06]">
                  {matchedPlayers.slice(0, 3).map((p) => (
                    <button
                      key={p.playerId}
                      type="button"
                      onClick={() => {
                        addPastSearch(p.playerName);
                        onNavigateTab('tournament');
                        onClose();
                      }}
                      className="w-full py-2.5 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#1AACA6] flex items-center justify-center text-sm font-bold text-[#161616] shrink-0">
                          {p.playerName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {p.playerName}
                          </div>
                          <div className="font-quicksand text-xs text-[#8E8E8E] truncate">
                            {p.teamName} Player
                          </div>
                        </div>
                      </div>
                      <IconlyRightArrowCircle />
                    </button>
                  ))}
                  {matched1v1.slice(0, 2).map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        addPastSearch(p.name);
                        onNavigateTab('1v1');
                        onClose();
                      }}
                      className="w-full py-2.5 flex items-center justify-between gap-3 text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-[#1AACA6] flex items-center justify-center text-sm font-bold text-[#161616] shrink-0">
                          {p.shortCode}
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-bold text-white truncate">
                            {p.name}
                          </div>
                          <div className="font-quicksand text-xs text-[#8E8E8E] truncate">
                            1v1 Showcase Competitor
                          </div>
                        </div>
                      </div>
                      <IconlyRightArrowCircle />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* TEAMS Card */}
            {matchedTeams.length > 0 && (
              <div className="rounded-[16px] bg-[#161616] p-4 space-y-2 shadow-card">
                <div className="font-quicksand text-xs font-medium tracking-wider uppercase text-[#8E8E8E]">
                  TEAMS
                </div>
                <div className="divide-y divide-white/[0.08]">
                  {matchedTeams.map((t) => {
                    const nextFixture = matches.find(
                      (m) =>
                        m.status === 'UPCOMING' &&
                        (m.homeId === t.id || m.awayId === t.id)
                    );
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          addPastSearch(t.name);
                          onNavigateTab('tournament');
                          onClose();
                        }}
                        className="w-full py-3 flex items-center justify-between gap-3 text-left"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-12 h-12 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
                            <TeamCrestBadge
                              shortCode={t.shortCode}
                              color={t.badgeColor}
                              size="sm"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">
                              {t.name}
                            </div>
                            <div className="font-quicksand text-xs text-[#8E8E8E] truncate">
                              {nextFixture
                                ? `Upcoming Fixture - ${nextFixture.scheduledTime}`
                                : 'No Upcoming Fixture'}
                            </div>
                          </div>
                        </div>
                        <IconlyRightArrowCircle />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {matchedLive.length === 0 &&
              matchedUpcoming.length === 0 &&
              matchedPlayers.length === 0 &&
              matched1v1.length === 0 &&
              matchedTeams.length === 0 && (
                <div className="rounded-[16px] bg-[#161616] p-8 text-center text-xs text-[#8E8E8E]">
                  No fixtures, teams, or players found for &ldquo;{query}&rdquo;
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Signed-in Account Profile & Sign-Out Modal (Strictly read-only role — no Spectator -> Admin privilege toggle).
 */
export const AccountModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const { session, updateDisplayName, signOut } = useTournament();
  const [nameInput, setNameInput] = useState(session.username);

  useEffect(() => {
    setNameInput(session.username);
  }, [session.username, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      updateDisplayName(nameInput.trim());
    }
    onClose();
  };

  const handleSignOut = () => {
    onClose();
    signOut();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl bg-[#161616] border border-white/10 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <img
              src="/kots-logo.png?v=2"
              alt="King of the Streets Cup"
              className="w-8 h-8 object-contain"
            />
            <h3 className="text-sm font-bold text-white">Account Profile</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8E8E8E] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Read-only Signed-in Identity Summary */}
        <div className="rounded-xl bg-[#141513] border border-white/[0.06] p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
              {session.role === 'ADMIN' ? (
                <ShieldCheck className="w-4 h-4 text-[#C8F558]" />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white truncate">
                {session.username}
              </div>
              {session.contact && (
                <div className="font-quicksand text-[11px] text-[#8E8E8E] truncate">
                  {session.contact}
                </div>
              )}
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
              session.role === 'ADMIN'
                ? 'bg-[#C8F558]/20 text-[#C8F558] border border-[#C8F558]/40'
                : 'bg-[#242224] text-[#BDBDBD]'
            }`}
          >
            {session.role}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block font-quicksand text-[11px] font-medium text-[#8E8E8E] mb-1.5">
              Display Username
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Enter display name"
              className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs text-white focus:border-[#C8F558] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-full bg-[#C8F558] text-[#161616] font-bold text-xs hover:bg-[#d4f87a] transition-colors"
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="px-4 py-2.5 rounded-full bg-[#242224] hover:bg-[#D9383A]/20 text-white hover:text-[#FF6B6B] border border-white/10 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
