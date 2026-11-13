import React, { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  Shuffle,
  Trash2,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  IconlySearchButton,
  IconlySettingsButton,
  SectionTabHeader,
  TeamCrestBadge,
} from '../components/ui/FigmaWidgets';
import { parseAdminPlayerList } from '../utils/adminRosterParser';
import { AppNavTab, RegistrationStatus } from '../types/tournament';

const BADGE_COLORS = [
  '#C8F558', // Electric Lime
  '#10B981', // Emerald Green
  '#22C55E', // Pitch Green
  '#1AACA6', // Teal
  '#06B6D4', // Cyan
  '#38BDF8', // Sky Blue
  '#2563EB', // Royal Blue
  '#1D4ED8', // Cobalt Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Hot Pink
  '#F43F5E', // Rose
  '#D9383A', // Crimson Red
  '#EF4444', // Scarlet
  '#F97316', // Flame Orange
  '#E5A93C', // Championship Gold
  '#FACC15', // Sun Yellow
  '#FFFFFF', // Classic White
  '#94A3B8', // Metallic Silver
];

/**
 * Shared palette + custom hex color picker for 7-Aside teams and 1v1 badges.
 */
const CrestColorPicker: React.FC<{
  value: string;
  onChange: (color: string) => void;
  compact?: boolean;
}> = ({ value, onChange, compact = false }) => {
  const sizeCls = compact ? 'w-5 h-5' : 'w-6 h-6';
  const isPreset = BADGE_COLORS.some(
    (c) => c.toLowerCase() === value.toLowerCase()
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {BADGE_COLORS.map((color) => {
        const selected = value.toLowerCase() === color.toLowerCase();
        return (
          <button
            key={color}
            type="button"
            title={`Select crest color ${color}`}
            aria-label={`Select crest color ${color}`}
            onClick={() => onChange(color)}
            className={`${sizeCls} rounded-full border-2 transition-transform ${
              selected
                ? 'border-[#C8F558] ring-2 ring-white scale-110'
                : 'border-black/25 opacity-80 hover:opacity-100 hover:scale-105'
            }`}
            style={{ backgroundColor: color }}
          />
        );
      })}
      <label
        title="Pick custom crest color"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#141513] border border-white/15 hover:border-[#C8F558] text-[10px] text-white cursor-pointer transition-colors"
      >
        <span
          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0"
          style={{ backgroundColor: !isPreset ? value : '#C8F558' }}
        />
        <span>Custom</span>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="sr-only"
          aria-label="Custom crest color"
        />
      </label>
    </div>
  );
};

export const RegistrationView: React.FC<{
  onOpenSearch: () => void;
  onNavigateTab: (tab: AppNavTab) => void;
}> = ({ onOpenSearch, onNavigateTab }) => {
  const {
    session,
    teams7Aside,
    players1v1,
    registerTeam7Aside,
    updateTeam7Aside,
    deleteTeam7Aside,
    registerPlayer1v1,
    updatePlayer1v1Status,
    deletePlayer1v1,
    runAutomatedLeagueFixtures,
    regenerateKnockoutDraw,
  } = useTournament();

  const isAdmin = session.role === 'ADMIN';

  const [regMode, setRegMode] = useState<'7aside' | '1v1'>('7aside');
  const [submitBanner, setSubmitBanner] = useState<string | null>(null);
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);

  // Match-day paste helper inside an already-registered team card
  const [cardPasteTeamId, setCardPasteTeamId] = useState<string | null>(null);
  const [cardPasteRawText, setCardPasteRawText] = useState('');

  // 7-Aside Form State (Admin-only)
  const [teamName, setTeamName] = useState('');
  const [teamShort, setTeamShort] = useState('');
  const [teamColor, setTeamColor] = useState(BADGE_COLORS[0]);
  const [captainName, setCaptainName] = useState('');
  const [captainPhone, setCaptainPhone] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [adminStatus, setAdminStatus] =
    useState<RegistrationStatus>('CONFIRMED');
  const [showInitialSquadInputs, setShowInitialSquadInputs] = useState(false);
  const [playerNames, setPlayerNames] = useState<string[]>(
    Array.from({ length: 10 }, () => '')
  );

  // Admin-only smart text parser state during registration
  const [showAdminParser, setShowAdminParser] = useState(false);
  const [adminRawText, setAdminRawText] = useState('');

  // 1v1 Form State (Admin-only)
  const [p1v1Name, setP1v1Name] = useState('');
  const [p1v1Short, setP1v1Short] = useState('');
  const [p1v1Color, setP1v1Color] = useState(BADGE_COLORS[1]);
  const [p1v1Phone, setP1v1Phone] = useState('');
  const [p1v1Mpesa, setP1v1Mpesa] = useState('');

  const handlePlayerNameChange = (index: number, value: string) => {
    setPlayerNames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  };

  const handleAdminAutoFill = () => {
    if (!isAdmin) return;
    const extracted = parseAdminPlayerList(adminRawText);
    if (extracted.length === 0) return;
    setPlayerNames((prev) =>
      prev.map((current, idx) => extracted[idx] || current)
    );
    setShowInitialSquadInputs(true);
    setShowAdminParser(false);
    setAdminRawText('');
  };

  const handleMatchDayCardAutoFill = (teamId: string) => {
    if (!isAdmin) return;
    const targetTeam = teams7Aside.find((t) => t.id === teamId);
    if (!targetTeam) return;
    const extracted = parseAdminPlayerList(cardPasteRawText);
    if (extracted.length === 0) return;

    const updatedPlayers = targetTeam.players.map((pl, idx) => ({
      ...pl,
      name: extracted[idx] || pl.name,
    }));
    updateTeam7Aside(teamId, { players: updatedPlayers });
    setCardPasteTeamId(null);
    setCardPasteRawText('');
    setSubmitBanner(
      `Updated 10-player match-day roster for "${targetTeam.name}".`
    );
  };

  const handleTeamSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!teamName.trim() || !captainName.trim()) return;

    const created = registerTeam7Aside({
      name: teamName,
      shortCode: teamShort,
      badgeColor: teamColor,
      captainName,
      captainPhone,
      playerNames,
      mpesaReference: mpesaCode,
      registrationStatus: adminStatus,
    });

    if (!created) return;

    const filledPlayersCount = playerNames.filter((n) => n.trim().length > 0)
      .length;
    setSubmitBanner(
      filledPlayersCount > 0
        ? `Team "${created.name}" (${created.shortCode}) registered with ${filledPlayersCount} named players. Run Automated League Fixtures when all teams are in.`
        : `Team "${created.name}" (${created.shortCode}) registered. Player names can be filled in on tournament day, and league fixtures will be generated via Run Automated League Fixtures.`
    );
    setTeamName('');
    setTeamShort('');
    setCaptainName('');
    setCaptainPhone('');
    setMpesaCode('');
    setPlayerNames(Array.from({ length: 10 }, () => ''));
    setShowInitialSquadInputs(false);
  };

  const handle1v1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!p1v1Name.trim() || !p1v1Phone.trim()) return;

    const created = registerPlayer1v1({
      name: p1v1Name,
      shortCode: p1v1Short,
      badgeColor: p1v1Color,
      phone: p1v1Phone,
      mpesaReference: p1v1Mpesa,
      registrationStatus: adminStatus,
    });

    if (!created) return;

    setSubmitBanner(
      `1v1 Player "${created.name}" (${created.shortCode}) registered.`
    );
    setP1v1Name('');
    setP1v1Short('');
    setP1v1Phone('');
    setP1v1Mpesa('');
  };

  const visibleTeams = isAdmin
    ? teams7Aside
    : teams7Aside.filter((t) => t.registrationStatus === 'CONFIRMED');

  const visiblePlayers1v1 = isAdmin
    ? players1v1
    : players1v1.filter((p) => p.registrationStatus === 'CONFIRMED');

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3">
        <div>
          <h1 className="text-[24px] font-bold text-white leading-tight">
            {isAdmin ? 'Registration' : 'Teams & Players'}
          </h1>
          <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
            {isAdmin
              ? 'Register 7-Aside Teams & 1v1 Competitors • Player Rosters Open Through Match Day'
              : 'Confirmed 7-Aside Squads & 1v1 Showcase Competitors'}
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

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-2.5 bg-[#161616] p-1.5 rounded-full border border-white/[0.06]">
        <button
          type="button"
          onClick={() => {
            setRegMode('7aside');
            setSubmitBanner(null);
          }}
          className={`h-[42px] px-4 rounded-full text-xs transition-all ${
            regMode === '7aside'
              ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
              : 'text-[#8E8E8E] hover:text-white font-normal'
          }`}
        >
          {isAdmin
            ? '7-Aside Squad'
            : `7-Aside Squads (${visibleTeams.length})`}
        </button>
        <button
          type="button"
          onClick={() => {
            setRegMode('1v1');
            setSubmitBanner(null);
          }}
          className={`h-[42px] px-4 rounded-full text-xs transition-all ${
            regMode === '1v1'
              ? 'bg-white text-[#161616] border-2 border-[#C8F558] font-bold'
              : 'text-[#8E8E8E] hover:text-white font-normal'
          }`}
        >
          {isAdmin
            ? '1v1 Player'
            : `1v1 Competitors (${visiblePlayers1v1.length})`}
        </button>
      </div>

      {isAdmin && submitBanner && (
        <div className="rounded-[14px] bg-[#C8F558]/15 border border-[#C8F558] p-3.5 flex items-center justify-between text-xs text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#C8F558] shrink-0" />
            <span className="font-normal">{submitBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSubmitBanner(null)}
            className="text-[11px] font-bold text-[#C8F558] ml-2 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ADMIN-ONLY REGISTRATION FORMS */}
      {isAdmin &&
        (regMode === '7aside' ? (
          <section className="space-y-4">
            <SectionTabHeader title="Team Form" />

            <form
              onSubmit={handleTeamSubmit}
              className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-5 space-y-5 shadow-card"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-[#C8F558] uppercase tracking-wider">
                    1. Team & Captain Details
                  </div>
                  <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                    All squads enter the unified 7-Aside League
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      Team Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="e.g. Runda Royals FC"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      Short Code
                    </label>
                    <input
                      type="text"
                      maxLength={4}
                      value={teamShort}
                      onChange={(e) =>
                        setTeamShort(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. RND"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white uppercase focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      Captain Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={captainName}
                      onChange={(e) => setCaptainName(e.target.value)}
                      placeholder="Captain name"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      Captain Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={captainPhone}
                      onChange={(e) => setCaptainPhone(e.target.value)}
                      placeholder="e.g. 0712345678 (or add later)"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1.5">
                    Team Crest Color
                  </label>
                  <CrestColorPicker
                    value={teamColor}
                    onChange={setTeamColor}
                  />
                </div>
              </div>

              {/* Step 2: Optional 10-Player Squad (Can be filled now or on Match Day) */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold text-[#C8F558] uppercase tracking-wider">
                      2. Squad Roster (Optional — Can Be Input on Match Day)
                    </div>
                    <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                      You can register the team now and input the 10 player
                      names on the day of the tournament.
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setShowInitialSquadInputs((prev) => !prev)
                      }
                      className="px-3 py-1.5 rounded-full bg-[#242224] hover:bg-[#2D2D2D] border border-white/10 text-[11px] font-normal text-white"
                    >
                      {showInitialSquadInputs
                        ? 'Hide Player Slots'
                        : 'Input Players Now'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowAdminParser((prev) => !prev);
                        setShowInitialSquadInputs(true);
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#242224] hover:bg-[#2D2D2D] border border-[#C8F558]/40 text-[11px] font-normal text-[#C8F558] flex items-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Admin Text Fill</span>
                    </button>
                  </div>
                </div>

                {showAdminParser && (
                  <div className="rounded-2xl bg-[#141513] border border-[#C8F558]/40 p-3.5 space-y-2.5">
                    <div className="font-quicksand text-[11px] font-normal text-white">
                      Admin Helper: Paste a numbered or line-separated list of
                      up to 10 player names to fill the fields below.
                    </div>
                    <textarea
                      rows={4}
                      value={adminRawText}
                      onChange={(e) => setAdminRawText(e.target.value)}
                      placeholder={`1. Brian Ochieng\n2. Kevin Mwangi\n3. Dennis Kiprop...`}
                      className="w-full rounded-xl bg-[#161616] border border-white/10 p-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAdminAutoFill}
                      className="px-4 py-1.5 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold"
                    >
                      Fill 10 Player Slots
                    </button>
                  </div>
                )}

                {showInitialSquadInputs && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {playerNames.map((pName, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 rounded-xl bg-[#141513] border border-white/10 px-3 py-2 focus-within:border-[#C8F558]"
                      >
                        <span className="w-6 text-[11px] font-bold text-[#C8F558] select-none">
                          #{idx + 1}
                        </span>
                        <input
                          type="text"
                          value={pName}
                          onChange={(e) =>
                            handlePlayerNameChange(idx, e.target.value)
                          }
                          placeholder={`Player ${idx + 1} Full Name (or fill on Match Day)`}
                          className="w-full bg-transparent text-xs font-normal text-white placeholder-[#8E8E8E] focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Step 3: Registration Confirmation */}
              <div className="space-y-3 pt-3 border-t border-white/[0.06]">
                <div className="text-xs font-bold text-[#C8F558] uppercase tracking-wider">
                  3. Confirmation Message & Status
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      M-Pesa Confirmation Code / Message (Optional)
                    </label>
                    <input
                      type="text"
                      value={mpesaCode}
                      onChange={(e) =>
                        setMpesaCode(e.target.value.toUpperCase())
                      }
                      placeholder="e.g. SK92LM481Q Confirmed"
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white uppercase focus:border-[#C8F558] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                      Admin Verification Status
                    </label>
                    <select
                      value={adminStatus}
                      onChange={(e) =>
                        setAdminStatus(e.target.value as RegistrationStatus)
                      }
                      className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                    >
                      <option value="CONFIRMED">
                        CONFIRMED (Verified Team)
                      </option>
                      <option value="PENDING">PENDING (Awaiting Check)</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-[#D9383A]/15 border border-[#D9383A]/40 p-3 flex items-center gap-2.5 font-quicksand text-xs font-normal text-white">
                  <AlertCircle className="w-4 h-4 text-[#D9383A] shrink-0" />
                  <span>
                    All registrations are strictly non-refundable. Official
                    squad registration closes 10th November.
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] font-bold text-xs tracking-wide transition-colors"
              >
                Register 7-Aside Team
              </button>
            </form>
          </section>
        ) : (
          /* FORM 2: 1V1 PLAYER REGISTRATION (ADMIN-ONLY) */
          <section className="space-y-4">
            <SectionTabHeader title="1v1 Form" />

            <form
              onSubmit={handle1v1Submit}
              className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-5 space-y-4 shadow-card"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold text-[#C8F558] uppercase tracking-wider">
                  1v1 Competitor Details
                </div>
                <span className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                  Direct knockout draw (no group stage)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                    Player Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={p1v1Name}
                    onChange={(e) => setP1v1Name(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                    Short Code (3 chars)
                  </label>
                  <input
                    type="text"
                    maxLength={3}
                    value={p1v1Short}
                    onChange={(e) => setP1v1Short(e.target.value.toUpperCase())}
                    placeholder="e.g. GIT"
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white uppercase focus:border-[#C8F558] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={p1v1Phone}
                    onChange={(e) => setP1v1Phone(e.target.value)}
                    placeholder="e.g. 0712345678"
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                    M-Pesa Reference (Optional)
                  </label>
                  <input
                    type="text"
                    value={p1v1Mpesa}
                    onChange={(e) => setP1v1Mpesa(e.target.value.toUpperCase())}
                    placeholder="e.g. SK11V1009X"
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white uppercase focus:border-[#C8F558] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1">
                    Status
                  </label>
                  <select
                    value={adminStatus}
                    onChange={(e) =>
                      setAdminStatus(e.target.value as RegistrationStatus)
                    }
                    className="w-full rounded-xl bg-[#141513] border border-white/10 px-3.5 py-2.5 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                  >
                    <option value="CONFIRMED">CONFIRMED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-quicksand text-[11px] font-normal text-[#8E8E8E] mb-1.5">
                  Badge Color
                </label>
                <CrestColorPicker
                  value={p1v1Color}
                  onChange={setP1v1Color}
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] font-bold text-xs tracking-wide transition-colors"
              >
                Register 1v1 Competitor
              </button>
            </form>
          </section>
        ))}

      {/* POST-REGISTRATION AUTOMATED DRAW CALLOUT (ADMIN-ONLY) */}
      {isAdmin && regMode === '7aside' && teams7Aside.length >= 2 && (
        <div className="rounded-[16px] bg-[#161616] border border-[#C8F558]/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
          <div>
            <div className="text-xs font-bold text-white">
              Post-Registration Automated League Fixtures
            </div>
            <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
              Generates a balanced single round-robin League schedule across
              whichever teams are registered and confirmed on tournament day
              (team count stays open — add or remove teams anytime, and adjust
              kickoff times and match durations in Admin).
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              const res = runAutomatedLeagueFixtures();
              setSubmitBanner(
                `Automated League Fixtures generated: ${res.matchCount} fixtures across ${res.matchdayCount} Matchdays.`
              );
            }}
            className="px-4 py-2 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Run Automated League Fixtures</span>
          </button>
        </div>
      )}

      {isAdmin && regMode === '1v1' && players1v1.length >= 2 && (
        <div className="rounded-[16px] bg-[#161616] border border-[#C8F558]/30 p-4 flex flex-wrap items-center justify-between gap-3 shadow-card">
          <div>
            <div className="text-xs font-bold text-white">
              Post-Registration 1v1 Direct Knockout Draw & Fixtures
            </div>
            <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
              Randomly pairs all {players1v1.length} registered 1v1 players into
              knockout fixtures (no group stage).
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              regenerateKnockoutDraw({
                category: '1v1',
                startStage: 'AUTO',
                source: 'RANDOM_DRAW',
              });
              setSubmitBanner(
                `1v1 Random Knockout Draw complete: fixtures generated for ${players1v1.length} competitors.`
              );
            }}
            className="px-4 py-2 rounded-full bg-[#C8F558] hover:bg-[#d4f87a] text-[#161616] text-xs font-bold inline-flex items-center gap-1.5 shrink-0"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Run 1v1 Random Draw & Create Fixtures</span>
          </button>
        </div>
      )}

      {/* REGISTERED ROSTER DIRECTORY (Read-Only for Spectators, Editable for Admin) */}
      <section className="space-y-4">
        <SectionTabHeader
          title={
            regMode === '7aside'
              ? `Teams (${visibleTeams.length})`
              : `1v1 Players (${visiblePlayers1v1.length})`
          }
        />

        {regMode === '7aside' ? (
          <div className="space-y-2.5">
            {visibleTeams.map((team) => {
              const isExpanded = expandedTeamId === team.id;
              const isPasteOpen = cardPasteTeamId === team.id;
              return (
                <div
                  key={team.id}
                  className="rounded-[16px] bg-[#161616] border border-white/[0.06] overflow-hidden"
                >
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
                        <TeamCrestBadge
                          shortCode={team.shortCode}
                          color={team.badgeColor}
                          size="sm"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-white truncate">
                          {team.name}
                        </div>
                        <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E] truncate">
                          League Squad • Capt: {team.captainName}
                          {isAdmin && team.captainPhone
                            ? ` (${team.captainPhone})`
                            : ''}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isAdmin ? (
                        <button
                          type="button"
                          onClick={() =>
                            updateTeam7Aside(team.id, {
                              registrationStatus:
                                team.registrationStatus === 'CONFIRMED'
                                  ? 'PENDING'
                                  : 'CONFIRMED',
                            })
                          }
                          className={`px-2.5 py-1 rounded-full text-[10px] font-normal flex items-center gap-1 ${
                            team.registrationStatus === 'CONFIRMED'
                              ? 'bg-[#C8F558]/20 text-[#C8F558]'
                              : 'bg-[#E5A93C]/20 text-[#E5A93C]'
                          }`}
                        >
                          {team.registrationStatus === 'CONFIRMED' ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          <span>{team.registrationStatus}</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-normal bg-[#C8F558]/20 text-[#C8F558]">
                          10 PLAYERS
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedTeamId(isExpanded ? null : team.id)
                        }
                        className="w-8 h-8 rounded-full bg-[#242224] flex items-center justify-center text-white"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-white/[0.05] space-y-3 bg-[#141513]">
                      <div className="flex flex-wrap items-center justify-between gap-2 font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                        <div className="flex flex-wrap items-center gap-2">
                          {isAdmin ? (
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-1.5">
                                <span>M-Pesa Ref:</span>
                                <input
                                  type="text"
                                  value={team.mpesaReference || ''}
                                  onChange={(e) =>
                                    updateTeam7Aside(team.id, {
                                      mpesaReference:
                                        e.target.value.toUpperCase(),
                                    })
                                  }
                                  placeholder="Enter M-Pesa Ref"
                                  className="rounded-lg bg-[#161616] border border-white/10 px-2 py-1 text-[11px] font-normal text-white uppercase focus:border-[#C8F558] focus:outline-none w-32"
                                />
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span>Captain Phone:</span>
                                <input
                                  type="tel"
                                  value={team.captainPhone || ''}
                                  onChange={(e) =>
                                    updateTeam7Aside(team.id, {
                                      captainPhone: e.target.value,
                                    })
                                  }
                                  placeholder="Add phone later"
                                  className="rounded-lg bg-[#161616] border border-white/10 px-2 py-1 text-[11px] font-normal text-white focus:border-[#C8F558] focus:outline-none w-32"
                                />
                              </div>
                            </div>
                          ) : (
                            <span>Registered 10-Player Squad</span>
                          )}
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setCardPasteTeamId(
                                  isPasteOpen ? null : team.id
                                );
                                setCardPasteRawText('');
                              }}
                              className="inline-flex items-center gap-1 text-[#C8F558] hover:underline font-normal"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Paste Match-Day Roster</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    `Remove team "${team.name}" (${team.shortCode}) from the tournament roster?`
                                  )
                                ) {
                                  deleteTeam7Aside(team.id);
                                }
                              }}
                              className="inline-flex items-center gap-1 text-red-400 hover:underline font-normal"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove Team</span>
                            </button>
                          </div>
                        )}
                      </div>

                      {isAdmin && (
                        <div className="flex flex-wrap items-center gap-2 font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                          <span>Crest Color:</span>
                          <CrestColorPicker
                            compact
                            value={team.badgeColor}
                            onChange={(color) =>
                              updateTeam7Aside(team.id, { badgeColor: color })
                            }
                          />
                        </div>
                      )}

                      {isAdmin && isPasteOpen && (
                        <div className="rounded-xl bg-[#161616] border border-[#C8F558]/40 p-3 space-y-2">
                          <div className="font-quicksand text-[11px] font-normal text-white">
                            Paste 10 player names for {team.name} (Match-Day
                            Squad Input):
                          </div>
                          <textarea
                            rows={3}
                            value={cardPasteRawText}
                            onChange={(e) =>
                              setCardPasteRawText(e.target.value)
                            }
                            placeholder={`1. Player One\n2. Player Two...`}
                            className="w-full rounded-lg bg-[#141513] border border-white/10 p-2 text-xs font-normal text-white focus:border-[#C8F558] focus:outline-none"
                          />
                          <button
                            type="button"
                            onClick={() => handleMatchDayCardAutoFill(team.id)}
                            className="px-3.5 py-1.5 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold"
                          >
                            Save 10-Player Roster
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.players.map((p, idx) => (
                          <div
                            key={p.id}
                            className="flex items-center gap-2 rounded-xl bg-[#161616] border border-white/[0.05] px-3 py-1.5 text-xs"
                          >
                            <span className="w-5 text-[10px] font-bold text-[#C8F558]">
                              #{idx + 1}
                            </span>
                            {isAdmin ? (
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => {
                                  const updatedPlayers = team.players.map(
                                    (pl, pIdx) =>
                                      pIdx === idx
                                        ? { ...pl, name: e.target.value }
                                        : pl
                                  );
                                  updateTeam7Aside(team.id, {
                                    players: updatedPlayers,
                                  });
                                }}
                                className="w-full bg-transparent text-white text-xs font-normal focus:outline-none"
                              />
                            ) : (
                              <span className="text-white font-normal">
                                {p.name}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2.5">
            {visiblePlayers1v1.map((player) => (
              <div
                key={player.id}
                className="rounded-[16px] bg-[#161616] border border-white/[0.06] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-[#161616]"
                    style={{ backgroundColor: player.badgeColor || '#1AACA6' }}
                  >
                    {player.shortCode}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {player.name}
                    </div>
                    <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                      {isAdmin
                        ? `Phone: ${player.phone} • M-Pesa: ${
                            player.mpesaReference || 'Pending'
                          }`
                        : '1v1 Arena Competitor'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() =>
                        updatePlayer1v1Status(
                          player.id,
                          player.registrationStatus === 'CONFIRMED'
                            ? 'PENDING'
                            : 'CONFIRMED'
                        )
                      }
                      className={`px-2.5 py-1 rounded-full text-[10px] font-normal ${
                        player.registrationStatus === 'CONFIRMED'
                          ? 'bg-[#C8F558]/20 text-[#C8F558]'
                          : 'bg-[#E5A93C]/20 text-[#E5A93C]'
                      }`}
                    >
                      {player.registrationStatus}
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-normal bg-[#1AACA6]/20 text-[#1AACA6]">
                      CONFIRMED
                    </span>
                  )}

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            `Remove 1v1 player "${player.name}" from the tournament?`
                          )
                        ) {
                          deletePlayer1v1(player.id);
                        }
                      }}
                      title="Remove 1v1 Competitor"
                      className="w-8 h-8 rounded-full bg-[#242224] hover:bg-red-500/20 text-red-400 flex items-center justify-center transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
