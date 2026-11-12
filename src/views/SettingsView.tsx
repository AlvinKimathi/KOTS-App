import React, { useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  Columns,
  Download,
  HardDrive,
  LogOut,
  RotateCcw,
  ShieldCheck,
  Upload,
  User,
} from 'lucide-react';
import { useTournament } from '../context/TournamentContext';
import {
  IconlyBackCircleButton,
  IconlyThemeToggleButton,
  SectionTabHeader,
} from '../components/ui/FigmaWidgets';

export const SettingsView: React.FC<{
  onBack: () => void;
  splitDesktopPreview: boolean;
  onToggleSplitDesktopPreview: () => void;
}> = ({ onBack, splitDesktopPreview, onToggleSplitDesktopPreview }) => {
  const {
    session,
    theme,
    toggleTheme,
    syncStatus,
    updateDisplayName,
    signOut,
    exportTournamentBackup,
    importTournamentBackup,
    resetTournamentData,
    clearAllTournamentData,
  } = useTournament();

  const isAdmin = session.role === 'ADMIN';

  const [nameInput, setNameInput] = useState(session.username);
  const [confirmResetStep, setConfirmResetStep] = useState(false);
  const [confirmClearBlankStep, setConfirmClearBlankStep] = useState(false);
  const [notice, setNotice] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) return;
    updateDisplayName(nameInput.trim());
    setNotice({
      type: 'ok',
      text: `Display username updated to "${nameInput.trim()}".`,
    });
  };

  const handleExportBackup = () => {
    const json = exportTournamentBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStamp = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.download = `kots-cup-backup-${dateStamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setNotice({
      type: 'ok',
      text: `Tournament backup exported (kots-cup-backup-${dateStamp}.json).`,
    });
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = typeof reader.result === 'string' ? reader.result : '';
      const res = importTournamentBackup(raw);
      setNotice({
        type: res.ok ? 'ok' : 'err',
        text: res.message,
      });
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="space-y-6 pb-28">
      {/* Header */}
      <header className="flex items-center justify-between pt-3">
        <div className="flex items-center gap-3.5">
          <IconlyBackCircleButton onClick={onBack} />
          <div>
            <h1 className="text-[24px] font-bold text-white leading-tight">
              Settings
            </h1>
            <p className="font-quicksand text-xs text-[#9E9E9E] font-normal">
              Appearance, Account Profile & System Controls
            </p>
          </div>
        </div>

        <IconlyThemeToggleButton theme={theme} onToggle={toggleTheme} />
      </header>

      {notice && (
        <div
          className={`rounded-[14px] p-3.5 flex items-center justify-between gap-2 text-xs ${
            notice.type === 'ok'
              ? 'bg-[#C8F558]/15 border border-[#C8F558] text-white'
              : 'bg-[#D9383A]/15 border border-[#D9383A] text-white'
          }`}
        >
          <div className="flex items-center gap-2">
            {notice.type === 'ok' ? (
              <CheckCircle2 className="w-4 h-4 text-[#C8F558] shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-[#D9383A] shrink-0" />
            )}
            <span className="font-semibold">{notice.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotice(null)}
            className="text-[11px] font-bold text-[#C8F558]"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* 1. APPEARANCE & DISPLAY */}
      <section className="space-y-3">
        <SectionTabHeader title="Appearance" />

        <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-4 space-y-4 shadow-card">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-white">
                Theme Mode (Light / Dark)
              </div>
              <div className="font-quicksand text-[11px] text-[#8E8E8E]">
                Light Mode is default for outdoor pitch visibility
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 bg-[#141513] p-1.5 rounded-full border border-white/[0.06]">
            <button
              type="button"
              onClick={() => {
                if (theme !== 'light') toggleTheme();
              }}
              className={`h-[40px] rounded-full text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558]'
                  : 'text-[#8E8E8E] hover:text-white'
              }`}
            >
              Light Mode (Default)
            </button>
            <button
              type="button"
              onClick={() => {
                if (theme !== 'dark') toggleTheme();
              }}
              className={`h-[40px] rounded-full text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'bg-white text-[#161616] border-2 border-[#C8F558]'
                  : 'text-[#8E8E8E] hover:text-white'
              }`}
            >
              Dark Mode
            </button>
          </div>

          {/* Desktop Split View Option */}
          <div className="hidden lg:flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div>
              <div className="text-xs font-bold text-white">
                Desktop Split Live Match View
              </div>
              <div className="font-quicksand text-[11px] text-[#8E8E8E]">
                Display Live Match Details side-by-side on wide screens
              </div>
            </div>
            <button
              type="button"
              onClick={onToggleSplitDesktopPreview}
              className={`px-3.5 py-2 rounded-full border text-xs font-bold inline-flex items-center gap-1.5 transition-colors ${
                splitDesktopPreview
                  ? 'bg-[#C8F558] text-[#161616] border-[#C8F558]'
                  : 'bg-[#242224] text-white border-white/10'
              }`}
            >
              <Columns className="w-3.5 h-3.5" />
              <span>{splitDesktopPreview ? 'Enabled' : 'Single Frame'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 2. ACCOUNT PROFILE & SESSION */}
      <section className="space-y-3">
        <SectionTabHeader title="Account" />

        <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-4 space-y-4 shadow-card">
          <div className="rounded-xl bg-[#141513] border border-white/[0.06] p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#242224] flex items-center justify-center shrink-0">
                {isAdmin ? (
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
                isAdmin
                  ? 'bg-[#C8F558]/20 text-[#C8F558] border border-[#C8F558]/40'
                  : 'bg-[#242224] text-[#BDBDBD]'
              }`}
            >
              {session.role}
            </span>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-3">
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

            <div className="flex items-center gap-2.5">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-full bg-[#C8F558] text-[#161616] font-bold text-xs hover:bg-[#d4f87a] transition-colors"
              >
                Save Display Name
              </button>
              <button
                type="button"
                onClick={signOut}
                className="px-4 py-2.5 rounded-full bg-[#242224] hover:bg-[#D9383A]/20 text-white hover:text-[#FF6B6B] border border-white/10 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* 3. ADMIN-ONLY SYSTEM & BACKUP CONTROLS */}
      {isAdmin && (
        <section className="space-y-3">
          <SectionTabHeader title="System & Backups" />

          <div className="rounded-[20px] bg-[#161616] border border-white/[0.06] p-4 space-y-4 shadow-card">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
              <div>
                <div className="text-xs font-bold text-white">
                  Database & Broadcast Sync
                </div>
                <div className="font-quicksand text-[11px] text-[#8E8E8E]">
                  Real-time tournament state synchronization status
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 ${
                  syncStatus === 'LIVE_CLOUD' || syncStatus === 'SYNCING'
                    ? 'bg-[#C8F558]/20 text-[#C8F558] border border-[#C8F558]/40'
                    : 'bg-[#242224] text-[#9E9E9E] border border-white/10'
                }`}
              >
                {syncStatus === 'LIVE_CLOUD' || syncStatus === 'SYNCING' ? (
                  <Cloud className="w-3 h-3" />
                ) : (
                  <HardDrive className="w-3 h-3" />
                )}
                <span>
                  {syncStatus === 'LIVE_CLOUD'
                    ? 'CLOUD LIVE'
                    : syncStatus === 'SYNCING'
                    ? 'SYNCING'
                    : 'LOCAL CACHE'}
                </span>
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-white">
                Match-Day Snapshot Backup (JSON)
              </div>
              <div className="font-quicksand text-[11px] text-[#8E8E8E]">
                Download a complete snapshot of teams, 1v1 players, and match
                scores or restore from a saved backup file.
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleExportBackup}
                  className="px-3.5 py-2 rounded-full bg-[#C8F558] text-[#161616] text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#d4f87a] transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Backup JSON</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={handleImportFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2 rounded-full bg-[#242224] text-white border border-white/10 text-xs font-bold inline-flex items-center gap-1.5 hover:border-[#C8F558] transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Restore Backup JSON</span>
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">
                  Start Clean Tournament (Clear Demo Teams & Matches)
                </div>
                <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                  Wipes sample teams, 1v1 players, and demo fixtures so you can
                  register only real tournament squads
                </div>
              </div>

              {!confirmClearBlankStep ? (
                <button
                  type="button"
                  onClick={() => setConfirmClearBlankStep(true)}
                  className="px-3.5 py-2 rounded-full bg-[#242224] hover:bg-red-500/20 text-white hover:text-red-300 border border-white/10 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear Demo Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      clearAllTournamentData();
                      setConfirmClearBlankStep(false);
                      setNotice({
                        type: 'ok',
                        text: 'Cleared all demo teams, 1v1 players, and matches. Ready for official registrations.',
                      });
                    }}
                    className="px-3 py-2 rounded-full bg-[#D9383A] text-white keep-white-text text-xs font-bold"
                  >
                    Confirm Wipe to Blank
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClearBlankStep(false)}
                    className="px-3 py-2 rounded-full bg-[#242224] text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-white">
                  Restore Demo / Sample Tournament State
                </div>
                <div className="font-quicksand text-[11px] font-normal text-[#8E8E8E]">
                  Restore the 8 sample squads, 1v1 competitors, and demo
                  fixtures for testing
                </div>
              </div>

              {!confirmResetStep ? (
                <button
                  type="button"
                  onClick={() => setConfirmResetStep(true)}
                  className="px-3.5 py-2 rounded-full bg-[#242224] hover:bg-red-500/20 text-[#9E9E9E] hover:text-red-300 border border-white/10 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default Data</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      resetTournamentData();
                      setConfirmResetStep(false);
                      setNotice({
                        type: 'ok',
                        text: 'Tournament data reset to initial defaults.',
                      });
                    }}
                    className="px-3 py-2 rounded-full bg-[#D9383A] text-white keep-white-text text-xs font-bold"
                  >
                    Confirm Reset All
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmResetStep(false)}
                    className="px-3 py-2 rounded-full bg-[#242224] text-white text-xs font-bold"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
