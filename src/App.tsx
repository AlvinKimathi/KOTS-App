import React, { useEffect, useState } from 'react';
import { TournamentProvider, useTournament } from './context/TournamentContext';
import { AuthLandingView } from './views/AuthLandingView';
import { HomeView } from './views/HomeView';
import { MatchDetailView } from './views/MatchDetailView';
import { StandingsSubTab, TournamentView } from './views/TournamentView';
import { OneVOneFixturesView } from './views/OneVOneFixturesView';
import { RegistrationView } from './views/RegistrationView';
import { AdminConsoleView } from './views/AdminConsoleView';
import { SettingsView } from './views/SettingsView';
import {
  AccountModal,
  SearchModal,
} from './components/modals/SearchAndUserModal';
import { AppNavTab } from './types/tournament';

/**
 * Custom Iconly Regular Bold/Light SVGs matching the Figma Navigation Dock (57:7619..57:7709)
 * where the active icon is solid white with a #C8F558 neon outer glow.
 */
const NavIcon: React.FC<{ id: AppNavTab; active: boolean }> = ({
  id,
  active,
}) => {
  const glowStyle = active
    ? { filter: 'drop-shadow(0 0 6px rgba(200, 245, 88, 0.85))' }
    : undefined;

  if (id === 'home') {
    return active ? (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="white"
        style={glowStyle}
      >
        <path d="M9.14 20.78V17.71C9.14 16.93 9.78 16.3 10.56 16.3H13.44C14.23 16.3 14.87 16.93 14.87 17.71V20.78C14.87 21.45 15.41 22 16.09 22H18.04C19.95 22 21.5 20.46 21.5 18.56V9.86C21.5 9.13 21.17 8.43 20.6 7.98L13.94 2.67C12.78 1.74 11.11 1.77 9.99 2.74L3.46 7.98C2.87 8.44 2.51 9.15 2.5 9.9V18.56C2.5 20.46 4.05 22 5.96 22H7.88C8.57 22 9.14 21.45 9.14 20.78Z" />
      </svg>
    ) : (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#8E8E8E"
        strokeWidth="1.6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9.14 20.78V17.71C9.14 16.93 9.78 16.3 10.56 16.3H13.44C14.23 16.3 14.87 16.93 14.87 17.71V20.78C14.87 21.45 15.41 22 16.09 22H18.04C19.95 22 21.5 20.46 21.5 18.56V9.86C21.5 9.13 21.17 8.43 20.6 7.98L13.94 2.67C12.78 1.74 11.11 1.77 9.99 2.74L3.46 7.98C2.87 8.44 2.51 9.15 2.5 9.9V18.56C2.5 20.46 4.05 22 5.96 22H7.88C8.57 22 9.14 21.45 9.14 20.78Z"
        />
      </svg>
    );
  }

  if (id === 'tournament') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill={active ? 'white' : 'none'}
        stroke={active ? '#161616' : '#8E8E8E'}
        strokeWidth="1.6"
        style={glowStyle}
      >
        <rect
          x="3.5"
          y="2.5"
          width="17"
          height="19"
          rx="4"
          fill={active ? 'white' : 'none'}
          stroke={active ? 'white' : '#8E8E8E'}
        />
        <path
          d="M8 8.5H16M8 12.5H16M8 16.5H12.5"
          stroke={active ? '#161616' : '#8E8E8E'}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (id === '1v1') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={glowStyle}
      >
        <circle
          cx="12"
          cy="12"
          r="9.2"
          fill={active ? 'white' : 'none'}
          stroke={active ? 'white' : '#8E8E8E'}
          strokeWidth="1.6"
        />
        <path
          d="M10.4 8.8L15.4 12L10.4 15.2V8.8Z"
          fill={active ? '#161616' : 'none'}
          stroke={active ? '#161616' : '#8E8E8E'}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (id === 'register' || id === 'teams') {
    return (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        style={glowStyle}
      >
        <circle
          cx="12"
          cy="8"
          r="4.2"
          fill={active ? 'white' : 'none'}
          stroke={active ? 'white' : '#8E8E8E'}
          strokeWidth="1.6"
        />
        <path
          d="M5 19.2C5 16.5 8.1 14.8 12 14.8C15.9 14.8 19 16.5 19 19.2C19 20.5 17.8 21.2 16 21.2H8C6.2 21.2 5 20.5 5 19.2Z"
          fill={active ? 'white' : 'none'}
          stroke={active ? 'white' : '#8E8E8E'}
          strokeWidth="1.6"
        />
      </svg>
    );
  }

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      style={glowStyle}
    >
      <rect
        x="3"
        y="3"
        width="7.5"
        height="7.5"
        rx="2.5"
        fill={active ? 'white' : 'none'}
        stroke={active ? 'white' : '#8E8E8E'}
        strokeWidth="1.6"
      />
      <rect
        x="13.5"
        y="3"
        width="7.5"
        height="7.5"
        rx="2.5"
        fill={active ? '#C8F558' : 'none'}
        stroke={active ? '#C8F558' : '#8E8E8E'}
        strokeWidth="1.6"
      />
      <rect
        x="3"
        y="13.5"
        width="7.5"
        height="7.5"
        rx="2.5"
        fill={active ? 'white' : 'none'}
        stroke={active ? 'white' : '#8E8E8E'}
        strokeWidth="1.6"
      />
      <rect
        x="13.5"
        y="13.5"
        width="7.5"
        height="7.5"
        rx="2.5"
        fill={active ? 'white' : 'none'}
        stroke={active ? 'white' : '#8E8E8E'}
        strokeWidth="1.6"
      />
    </svg>
  );
};

const AppContent: React.FC = () => {
  const { session, matches } = useTournament();
  const [activeTab, setActiveTab] = useState<AppNavTab>('home');
  const [standingsSubTab, setStandingsSubTab] =
    useState<StandingsSubTab>('league');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [splitDesktopPreview, setSplitDesktopPreview] = useState(false);

  const isAdmin = session.role === 'ADMIN';

  // Ensure Spectators are redirected off Admin-only tabs if session changes
  useEffect(() => {
    if (!session.isAuthenticated) {
      setActiveTab('home');
      setSelectedMatchId(null);
      setIsSearchOpen(false);
      setIsAccountModalOpen(false);
      return;
    }
    if (!isAdmin && (activeTab === 'admin' || activeTab === 'register')) {
      setActiveTab('home');
    }
  }, [session.isAuthenticated, isAdmin, activeTab]);

  // Gate 1: Unauthenticated visitors ALWAYS land on the Sign-In / Create Account screen first
  if (!session.isAuthenticated) {
    return <AuthLandingView />;
  }

  const defaultMatchId =
    selectedMatchId ||
    matches.find((m) => m.status === 'LIVE')?.id ||
    matches[0]?.id ||
    '';

  const handleSelectMatch = (matchId: string) => {
    setSelectedMatchId(matchId);
  };

  const handleNavigateTab = (tab: AppNavTab) => {
    setSelectedMatchId(null);
    if (!isAdmin && tab === 'admin') {
      setActiveTab('home');
      return;
    }
    if (!isAdmin && tab === 'register') {
      setActiveTab('teams');
      return;
    }
    setActiveTab(tab);
  };

  // Fixtures come first before Standings in the navigation flow
  const navItems: {
    id: AppNavTab;
    label: string;
  }[] = isAdmin
    ? [
        { id: 'home', label: 'Home' },
        { id: '1v1', label: '1v1' },
        { id: 'tournament', label: 'Standings' },
        { id: 'register', label: 'Register' },
        { id: 'admin', label: 'Admin' },
      ]
    : [
        { id: 'home', label: 'Home' },
        { id: '1v1', label: '1v1' },
        { id: 'tournament', label: 'Standings' },
        { id: 'teams', label: 'Teams' },
      ];

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#141513] text-white relative">
      {/* Main Content Container */}
      <div
        className={`mx-auto px-4 pt-3 ${
          splitDesktopPreview
            ? 'max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 items-start'
            : 'max-w-[430px]'
        }`}
      >
        {/* Primary Screen */}
        <main className="w-full figma-screen-glow rounded-[28px] px-3 sm:px-4">
          {selectedMatchId && !splitDesktopPreview ? (
            <MatchDetailView
              matchId={selectedMatchId}
              onBack={() => setSelectedMatchId(null)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onNavigateTab={handleNavigateTab}
            />
          ) : (
            <>
              {activeTab === 'home' && (
                <HomeView
                  onSelectMatch={handleSelectMatch}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onOpenUserModal={() => handleNavigateTab('settings')}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {activeTab === '1v1' && (
                <OneVOneFixturesView
                  onSelectMatch={handleSelectMatch}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onNavigateTab={handleNavigateTab}
                  onOpen1v1Standings={() => {
                    setStandingsSubTab('1v1');
                    handleNavigateTab('tournament');
                  }}
                />
              )}
              {activeTab === 'tournament' && (
                <TournamentView
                  initialSubTab={standingsSubTab}
                  onSelectMatch={handleSelectMatch}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {(activeTab === 'teams' ||
                (activeTab === 'register' && isAdmin)) && (
                <RegistrationView
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {activeTab === 'admin' && isAdmin && (
                <AdminConsoleView
                  onSelectMatch={handleSelectMatch}
                  onOpenSearch={() => setIsSearchOpen(true)}
                  onNavigateTab={handleNavigateTab}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsView
                  onBack={() => handleNavigateTab('home')}
                  splitDesktopPreview={splitDesktopPreview}
                  onToggleSplitDesktopPreview={() =>
                    setSplitDesktopPreview((prev) => !prev)
                  }
                />
              )}
            </>
          )}
        </main>

        {/* Secondary Live Match Screen when Desktop Split Preview is active */}
        {splitDesktopPreview && defaultMatchId && (
          <aside className="hidden lg:block w-full figma-screen-glow rounded-[28px] px-4">
            <MatchDetailView
              matchId={defaultMatchId}
              onBack={() => setSplitDesktopPreview(false)}
              onOpenSearch={() => setIsSearchOpen(true)}
              onNavigateTab={handleNavigateTab}
            />
          </aside>
        )}
      </div>

      {/* Exact Floating Bottom Navigation Dock (Navigation/ Home 57:7619: 358x80, radius 800, #161616) */}
      <div className="fixed safe-bottom-dock inset-x-0 z-50 flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="Primary Navigation"
          className="pointer-events-auto w-full max-w-[390px] h-[76px] rounded-full bg-[#161616] keep-dark-surface shadow-dock px-7 flex items-center justify-between border border-white/[0.04]"
        >
          {navItems.map((item) => {
            const isActive = !selectedMatchId && activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setIsSearchOpen(false);
                  handleNavigateTab(item.id);
                }}
                className="flex flex-col items-center justify-center gap-1.5 group min-w-[48px]"
              >
                <NavIcon id={item.id} active={isActive} />
                <span
                  className={`font-quicksand text-xs tracking-tight transition-colors ${
                    isActive
                      ? 'font-bold text-[#C8F558]'
                      : 'font-medium text-[#8E8E8E] group-hover:text-white'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Modals */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectMatch={handleSelectMatch}
        onNavigateTab={handleNavigateTab}
      />

      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
      />
    </div>
  );
};

export function App() {
  return (
    <TournamentProvider>
      <AppContent />
    </TournamentProvider>
  );
}

export default App;
