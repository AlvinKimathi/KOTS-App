import React from 'react';
import { Match, ThemeMode } from '../../types/tournament';
import { getEffectiveElapsedSeconds } from '../../utils/clockHelper';

/**
 * Rounded pill section header matching the app's pill & card visual language.
 */
export const SectionTabHeader: React.FC<{
  title: string;
  rightElement?: React.ReactNode;
  className?: string;
}> = ({ title, rightElement, className = '' }) => {
  return (
    <div
      className={`flex items-center justify-between pb-2 border-b border-[#C8F558]/40 ${className}`}
    >
      <div className="rounded-full bg-[#C8F558] text-[#161616] font-bold text-xs px-4 py-1.5 min-w-[96px] inline-flex items-center justify-center tracking-tight select-none shadow-sm">
        {title}
      </div>
      {rightElement && <div>{rightElement}</div>}
    </div>
  );
};

/**
 * Exact Iconly/Regular/Light/Search circular button (48x48) from Figma Header.
 */
export const IconlySearchButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Search"
    title="Search Fixtures, Teams & Players"
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161616]/60 hover:bg-[#242224] border border-white/[0.06] flex items-center justify-center text-white transition-colors shrink-0"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="11.7666"
        cy="11.7666"
        r="8.98856"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M18.0183 18.4851L21.5423 22"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

/**
 * Light Mode / Dark Mode Theme Toggle circular button (48x48) for the top header pane.
 */
export const IconlyThemeToggleButton: React.FC<{
  theme: ThemeMode;
  onToggle: () => void;
}> = ({ theme, onToggle }) => (
  <button
    type="button"
    onClick={onToggle}
    aria-label={
      theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'
    }
    title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161616]/60 hover:bg-[#242224] border border-white/[0.06] flex items-center justify-center text-white transition-colors shrink-0"
  >
    {theme === 'dark' ? (
      /* Crisp Sun Vector Icon (switch to Light Mode) */
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          cx="12"
          cy="12"
          r="4.2"
          stroke="#C8F558"
          strokeWidth="1.8"
        />
        <path
          d="M12 2.5V5M12 19V21.5M4.22 4.22L5.99 5.99M18.01 18.01L19.78 19.78M2.5 12H5M19 12H21.5M4.22 19.78L5.99 18.01M18.01 5.99L19.78 4.22"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    ) : (
      /* Crisp Crescent Moon Vector Icon (switch to Dark Mode) */
      <svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          fill="#141513"
          stroke="#141513"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

/**
 * Settings circular button (48x48) for opening the dedicated Settings page.
 */
export const IconlySettingsButton: React.FC<{
  onClick: () => void;
  title?: string;
}> = ({ onClick, title = 'Settings' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161616]/60 hover:bg-[#242224] border border-white/[0.06] flex items-center justify-center text-white transition-colors shrink-0"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="12"
        cy="12"
        r="3.2"
        stroke="#C8F558"
        strokeWidth="1.8"
      />
      <path
        d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </button>
);

/**
 * Exact Iconly/Regular/Bulk/Category circular button (48x48) from Figma Header:
 * 3 rounded squares + top-right #C8F558 lime rounded square!
 */
export const IconlyCategoryButton: React.FC<{
  onClick: () => void;
  title?: string;
}> = ({ onClick, title = 'Quick Switcher' }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    aria-label={title}
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161616]/60 hover:bg-[#242224] border border-white/[0.06] flex items-center justify-center text-white transition-colors shrink-0"
  >
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Top-Left Square */}
      <rect
        x="1.5"
        y="1.5"
        width="7.2"
        height="7.2"
        rx="2.4"
        fill="currentColor"
      />
      {/* Top-Right Lime Square (#C8F558) */}
      <rect x="11.3" y="1.5" width="7.2" height="7.2" rx="2.4" fill="#C8F558" />
      {/* Bottom-Left Square */}
      <rect
        x="1.5"
        y="11.3"
        width="7.2"
        height="7.2"
        rx="2.4"
        fill="currentColor"
      />
      {/* Bottom-Right Square */}
      <rect
        x="11.3"
        y="11.3"
        width="7.2"
        height="7.2"
        rx="2.4"
        fill="currentColor"
      />
    </svg>
  </button>
);

/**
 * Exact Iconly/Regular/Bold/Arrow - Left Circle (57:7609) from Match Detail Screen:
 * 48x48 dark circle with a solid white inner circle and dark left chevron.
 */
export const IconlyBackCircleButton: React.FC<{
  onClick: () => void;
}> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Back"
    className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#161616]/60 hover:bg-[#242224] border border-white/[0.06] flex items-center justify-center transition-colors shrink-0"
  >
    <div className="w-6 h-6 rounded-full bg-white border border-black/10 flex items-center justify-center">
      <svg
        width="12"
        height="12"
        viewBox="0 0 12 12"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M7.2 3L4.2 6L7.2 9"
          stroke="#161616"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  </button>
);

/**
 * Exact Iconly/Regular/Bold/Arrow - Right Circle (67:8445) from Search & Results cards.
 */
export const IconlyRightArrowCircle: React.FC = () => (
  <div className="w-5 h-5 rounded-full bg-[#A3A3A3] flex items-center justify-center shrink-0">
    <svg
      width="10"
      height="10"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M4.8 3L7.8 6L4.8 9"
        stroke="#161616"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  </div>
);

/**
 * Filled Map Pin SVG matching the olive-lime (#7C9A32) stadium pin in Figma.
 */
export const FigmaPinIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5 text-[#7C9A32]',
}) => (
  <svg
    viewBox="0 0 16 16"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
  >
    <path d="M8 1.33331C4.86667 1.33331 2.33334 3.86665 2.33334 6.99998C2.33334 11.1666 8 14.6666 8 14.6666C8 14.6666 13.6667 11.1666 13.6667 6.99998C13.6667 3.86665 11.1333 1.33331 8 1.33331ZM8 8.99998C6.89543 8.99998 6 8.10455 6 6.99998C6 5.89541 6.89543 4.99998 8 4.99998C9.10457 4.99998 10 5.89541 10 6.99998C10 8.10455 9.10457 8.99998 8 8.99998Z" />
  </svg>
);

/**
 * Vector Topographic Wave Lines SVG.
 */
export const TopographicWavesSvg: React.FC<{ className?: string }> = ({
  className = '',
}) => (
  <svg
    viewBox="0 0 400 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`pointer-events-none select-none ${className}`}
    preserveAspectRatio="none"
  >
    <path
      d="M210 -20C235 45 290 65 335 115C380 165 360 215 415 245"
      stroke="#C8F558"
      strokeOpacity="0.16"
      strokeWidth="1"
    />
    <path
      d="M228 -20C253 40 305 60 350 110C395 160 375 210 430 240"
      stroke="#C8F558"
      strokeOpacity="0.14"
      strokeWidth="1"
    />
    <path
      d="M246 -20C271 35 320 55 365 105C410 155 390 205 445 235"
      stroke="#E5A93C"
      strokeOpacity="0.13"
      strokeWidth="1"
    />
    <path
      d="M264 -20C289 30 335 50 380 100C425 150 405 200 460 230"
      stroke="#E5A93C"
      strokeOpacity="0.11"
      strokeWidth="1"
    />
    <path
      d="M-30 130C25 145 65 175 105 225"
      stroke="#C8F558"
      strokeOpacity="0.13"
      strokeWidth="1"
    />
  </svg>
);

/**
 * Vector Club / Team Shield Crest Badge.
 */
export const TeamCrestBadge: React.FC<{
  shortCode: string;
  color: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}> = ({ shortCode, color, size = 'md' }) => {
  const dimensions = {
    xs: 'w-6 h-6 text-[8px]',
    sm: 'w-7 h-7 text-[9px]',
    md: 'w-10 h-10 text-[10px]',
    lg: 'w-12 h-12 text-xs',
  }[size];

  const isTbd = shortCode === 'TBD';

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${dimensions}`}
    >
      <svg
        viewBox="0 0 40 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow"
      >
        <path
          d="M20 2L36 8V20.5C36 30.8 29.1 39.6 20 42.5C10.9 39.6 4 30.8 4 20.5V8L20 2Z"
          fill="#161616"
          stroke={isTbd ? '#3A3A3A' : color}
          strokeWidth="2.5"
        />
        <path
          d="M20 5.5L32.5 10.2V20.2C32.5 28.4 27.1 35.5 20 38C12.9 35.5 7.5 28.4 7.5 20.2V10.2L20 5.5Z"
          fill={isTbd ? '#242224' : color}
          fillOpacity={isTbd ? '0.4' : '0.24'}
        />
        <path
          d="M14 11.5L20 8.5L26 11.5"
          stroke={isTbd ? '#525252' : color}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
      <span
        className="keep-white-text absolute inset-0 flex items-center justify-center font-bold tracking-tighter text-white pt-1"
        style={{ letterSpacing: '-0.03em' }}
      >
        {shortCode.slice(0, 4)}
      </span>
    </div>
  );
};

/**
 * Official Tournament Emblem for King of the Streets Cup (/kots-logo.png).
 */
export const KotsCrownEmblem: React.FC<{
  size?: number;
  dark?: boolean;
}> = ({ size = 30 }) => (
  <img
    src="/kots-logo.png?v=2"
    alt="King of the Streets Cup"
    style={{ width: size, height: size }}
    className="object-contain shrink-0 select-none drop-shadow-sm"
  />
);

export function formatMatchClock(match: Match, nowMs: number = Date.now()): string {
  if (match.status === 'FT') return 'FT';
  if (match.status === 'HT') return 'HT';
  if (match.status === 'UPCOMING')
    return match.scheduledTime.split('•')[1]?.trim() || 'SOON';
  const effectiveElapsed = getEffectiveElapsedSeconds(match, nowMs);
  const mins = Math.floor(effectiveElapsed / 60);
  const secs = effectiveElapsed % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Exact Cards/ Medium (57:7822, 358x144, radius 12px) Live Match Hero Card from Homepage/ Default:
 * Features the left stadium action banner (/figma/live_banner.png), semi-circular ticket notches
 * on left and right edges, dashed separator line, black timer pill, and olive-lime venue pin.
 */
export const LiveScoreHeroCard: React.FC<{
  match: Match;
  onSelect: (matchId: string) => void;
}> = ({ match, onSelect }) => {
  const clockLabel = formatMatchClock(match);

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className="relative w-full text-left rounded-[12px] bg-[#161616] hover:bg-[#1B1B1B] border border-white/[0.06] overflow-hidden shadow-card transition-all flex items-stretch h-[144px]"
    >
      {/* Left Ticket Semi-Circular Cutout Notch */}
      <span className="absolute left-0 bottom-[32px] w-2.5 h-5 rounded-r-full bg-[#141513] z-20 pointer-events-none" />
      {/* Right Ticket Semi-Circular Cutout Notch */}
      <span className="absolute right-0 bottom-[32px] w-2.5 h-5 rounded-l-full bg-[#141513] z-20 pointer-events-none" />

      {/* Left Banner Panel (matching 67:8423 soccer-players-action-professional-stadium) */}
      <div className="keep-white-scope w-[118px] relative bg-[#1C2414] flex flex-col items-center justify-center text-center p-2.5 shrink-0 overflow-hidden">
        <img
          src="/figma/live_banner.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-85"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/15" />
        <div className="relative z-10 flex flex-col items-center">
          <img
            src="/kots-logo.png?v=2"
            alt="King of the Streets Cup"
            className="w-[88px] h-[82px] object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,0.85)] select-none"
          />
          <span className="keep-lime-text mt-1 text-[8px] font-bold tracking-widest uppercase text-[#C8F558] drop-shadow">
            {match.category === '7aside' ? '7-ASIDE LEAGUE' : '1V1 ARENA'}
          </span>
        </div>
      </div>

      {/* Right Scoreboard Content */}
      <div className="flex-1 flex flex-col justify-between relative overflow-hidden px-4 pt-3 pb-2">
        <TopographicWavesSvg className="absolute inset-0 w-full h-full opacity-70" />

        {/* Teams & Score Row */}
        <div className="relative z-10 flex items-center justify-between gap-1 my-auto">
          {/* Home Team */}
          <div className="flex flex-col items-center gap-1.5 w-[30%]">
            <TeamCrestBadge
              shortCode={match.homeShort}
              color={match.homeColor}
              size="md"
            />
            <span className="font-quicksand text-[11px] font-normal text-[#9E9E9E] tracking-wider uppercase truncate max-w-full">
              {match.homeShort}
            </span>
          </div>

          {/* Center Score & Black Timer Pill */}
          <div className="flex flex-col items-center justify-center w-[40%]">
            <div className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
              <span>{match.homeScore}</span>
              <span>-</span>
              <span>{match.awayScore}</span>
            </div>
            <div className="mt-1.5 px-3 py-0.5 rounded-full bg-[#0A0A0A] flex items-center justify-center">
              <span className="keep-white-text text-[11px] font-normal text-white tracking-wide">
                {clockLabel}
              </span>
            </div>
          </div>

          {/* Away Team */}
          <div className="flex flex-col items-center gap-1.5 w-[30%]">
            <TeamCrestBadge
              shortCode={match.awayShort}
              color={match.awayColor}
              size="md"
            />
            <span className="font-quicksand text-[11px] font-normal text-[#9E9E9E] tracking-wider uppercase truncate max-w-full">
              {match.awayShort}
            </span>
          </div>
        </div>

        {/* Bottom Ticket Dashed Divider + Venue & Group Row */}
        <div className="relative z-10 pt-2 border-t border-dashed border-white/[0.08] flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 text-[#7C9A32] font-quicksand font-normal uppercase tracking-wide truncate">
            <FigmaPinIcon className="w-3.5 h-3.5 text-[#7C9A32]" />
            <span className="truncate">{match.venue}</span>
          </div>
          <span className="text-white font-normal tracking-tight shrink-0 ml-2">
            {match.stage === 'GROUP'
              ? match.groupId
              : match.stage === 'LEAGUE'
              ? match.matchday
                ? `Matchday ${match.matchday}`
                : 'League'
              : match.stage}
          </span>
        </div>
      </div>
    </button>
  );
};

/**
 * Exact Cards/ Small (57:7847, 171x144, radius 12px) Compact Live Match Card
 * from Homepage/ English PL (24:2956) for 2-column live match grids.
 */
export const LiveScoreSmallCard: React.FC<{
  match: Match;
  onSelect: (matchId: string) => void;
}> = ({ match, onSelect }) => {
  const clockLabel = formatMatchClock(match);

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className="relative w-full text-left rounded-[12px] bg-[#161616] hover:bg-[#1B1B1B] border border-white/[0.06] overflow-hidden shadow-card transition-all flex flex-col justify-between p-3 h-[144px]"
    >
      <TopographicWavesSvg className="absolute inset-0 w-full h-full opacity-55" />
      {/* Left & Right Ticket Cutout Notches */}
      <span className="absolute left-0 bottom-[32px] w-2 h-4 rounded-r-full bg-[#141513] z-20 pointer-events-none" />
      <span className="absolute right-0 bottom-[32px] w-2 h-4 rounded-l-full bg-[#141513] z-20 pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-1 my-auto">
        <div className="flex flex-col items-center gap-1.5 w-[30%]">
          <TeamCrestBadge
            shortCode={match.homeShort}
            color={match.homeColor}
            size="sm"
          />
          <span className="font-quicksand text-[10px] font-normal text-[#9E9E9E] uppercase truncate">
            {match.homeShort}
          </span>
        </div>

        <div className="flex flex-col items-center justify-center w-[40%]">
          <div className="text-xl font-bold text-white flex items-center gap-1">
            <span>{match.homeScore}</span>
            <span>-</span>
            <span>{match.awayScore}</span>
          </div>
          <div className="mt-1 px-2.5 py-0.5 rounded-full bg-[#0A0A0A]">
            <span className="keep-white-text text-[10px] font-normal text-white">
              {clockLabel}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-1.5 w-[30%]">
          <TeamCrestBadge
            shortCode={match.awayShort}
            color={match.awayColor}
            size="sm"
          />
          <span className="font-quicksand text-[10px] font-normal text-[#9E9E9E] uppercase truncate">
            {match.awayShort}
          </span>
        </div>
      </div>

      <div className="relative z-10 pt-2 border-t border-dashed border-white/[0.08] flex items-center gap-1 text-[10px] text-[#7C9A32] font-quicksand font-normal uppercase truncate">
        <FigmaPinIcon className="w-3 h-3 text-[#7C9A32]" />
        <span className="truncate">{match.venue}</span>
      </div>
    </button>
  );
};

/**
 * Upcoming Match Card with separated Home & Away teams flanking the center kickoff time,
 * while clearly retaining the match date and Group / Stage metadata below.
 */
export const UpcomingMatchCard: React.FC<{
  match: Match;
  onSelect: (matchId: string) => void;
  showRightArrow?: boolean;
}> = ({ match, onSelect, showRightArrow = false }) => {
  const scheduledParts = match.scheduledTime.split('•').map((s) => s.trim());
  const dateLabel = scheduledParts[0] || match.scheduledTime;
  const timeLabel = scheduledParts[1] || 'TBD';
  const stageLabel =
    match.stage === 'GROUP'
      ? match.groupId
      : match.stage === 'LEAGUE'
      ? match.matchday
        ? `Matchday ${match.matchday}`
        : 'League'
      : match.stage;

  return (
    <button
      type="button"
      onClick={() => onSelect(match.id)}
      className="w-full text-left rounded-[14px] bg-[#161616] hover:bg-[#1E1E1E] border border-white/[0.06] px-3.5 py-3 flex flex-col gap-2.5 transition-all"
    >
      {/* Top Symmetrical Matchup Row: [Home Name] (Crest) [Time / Score] (Crest) [Away Name] */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full">
        {/* Home Team (Right-Aligned, full name wraps cleanly without ellipsis) */}
        <div className="flex items-center justify-end gap-2 min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-white text-right leading-snug break-words">
            {match.homeName}
          </span>
          <div className="w-8 h-8 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
            <TeamCrestBadge
              shortCode={match.homeShort}
              color={match.homeColor}
              size="xs"
            />
          </div>
        </div>

        {/* Center Kickoff Time or Final Score Pill */}
        <div className="px-2.5 py-1 rounded-full bg-[#242224] text-[11px] font-bold text-white shrink-0 tabular-nums">
          {match.status === 'FT'
            ? `${match.homeScore} - ${match.awayScore}`
            : match.status === 'LIVE' || match.status === 'HT'
            ? `${match.homeScore} - ${match.awayScore}`
            : timeLabel}
        </div>

        {/* Away Team (Left-Aligned, full name wraps cleanly without ellipsis) */}
        <div className="flex items-center justify-start gap-2 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
            <TeamCrestBadge
              shortCode={match.awayShort}
              color={match.awayColor}
              size="xs"
            />
          </div>
          <span className="text-[11px] sm:text-xs font-bold text-white text-left leading-snug break-words">
            {match.awayName}
          </span>
        </div>
      </div>

      {/* Bottom Metadata Row: Centered Date • Venue • Group / Stage Info */}
      <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-1.5 text-center relative">
        <span className="font-quicksand text-[11px] font-normal text-[#7C9A32]">
          {dateLabel} • {match.venue} •{' '}
          <span className="text-[#9E9E9E]">{stageLabel}</span>
        </span>
        {showRightArrow && (
          <div className="absolute right-0">
            <IconlyRightArrowCircle />
          </div>
        )}
      </div>
    </button>
  );
};

/**
 * Exact Empty Cards (67:8431, 358x136, radius 12px) from Homepage/ English PL:
 * Dashed #7C9A32 border over #161616 fill with centered bold white text.
 */
export const EmptyMatchesCard: React.FC<{ label?: string }> = ({
  label = 'No Upcoming Fixtures',
}) => (
  <div className="w-full h-[136px] rounded-[12px] border border-dashed border-[#7C9A32]/60 bg-[#161616] px-4 flex items-center justify-center">
    <span className="text-sm font-bold text-white tracking-tight">{label}</span>
  </div>
);

/**
 * Exact Match/ Detail/ Default (33:4866) Statistics Comparison Bar:
 * - Full-width dark pill track
 * - Leading (or tied non-zero) side expands to a wider pill with the #C8F558 lime dot
 * - Trailing side renders a compact pill without a lime dot
 */
export const StatComparisonRow: React.FC<{
  label: string;
  homeValue: number | string;
  awayValue: number | string;
}> = ({ label, homeValue, awayValue }) => {
  const numHome = Number(homeValue) || 0;
  const numAway = Number(awayValue) || 0;

  const homeLeadingOrTied = numHome >= numAway && (numHome > 0 || numAway > 0);
  const awayLeadingOrTied = numAway >= numHome && (numHome > 0 || numAway > 0);

  return (
    <div className="w-full rounded-full bg-gradient-to-r from-[#201F20]/90 via-[#1B1A1B]/55 to-[#201F20]/90 h-[34px] flex items-center justify-between gap-2">
      {/* Left Stat Pill (HOME) */}
      <div
        className={`h-full rounded-full bg-[#2B292B] px-3.5 flex items-center justify-between transition-all ${
          homeLeadingOrTied ? 'min-w-[74px] sm:min-w-[88px]' : 'min-w-[48px]'
        }`}
      >
        <span className="text-xs font-semibold text-white">{homeValue}</span>
        {homeLeadingOrTied && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8F558] shrink-0 ml-2" />
        )}
      </div>

      {/* Center Stat Name */}
      <span className="text-xs font-bold text-white text-center flex-1 truncate px-1">
        {label}
      </span>

      {/* Right Stat Pill (AWAY) */}
      <div
        className={`h-full rounded-full bg-[#2B292B] px-3.5 flex items-center justify-between transition-all ${
          awayLeadingOrTied ? 'min-w-[74px] sm:min-w-[88px]' : 'min-w-[48px]'
        }`}
      >
        {awayLeadingOrTied && (
          <span className="w-2.5 h-2.5 rounded-full bg-[#C8F558] shrink-0 mr-2" />
        )}
        <span className="text-xs font-semibold text-white ml-auto">
          {awayValue}
        </span>
      </div>
    </div>
  );
};
