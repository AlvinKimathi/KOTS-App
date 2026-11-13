import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  DEFAULT_ADMIN_ACCOUNTS,
  INITIAL_MATCHES,
  INITIAL_PLAYERS_1V1,
  INITIAL_TEAMS_7ASIDE,
  INITIAL_USER_SESSION,
} from '../data/initialTournamentData';
import {
  isCloudSyncEnabled,
  supabase,
  TOURNAMENT_ROW_ID,
} from '../lib/supabaseClient';
import {
  Match,
  MatchEventType,
  MatchStats,
  MatchStatus,
  Player1v1,
  RegistrationStatus,
  StoredUserAccount,
  SyncStatus,
  Team7Aside,
  ThemeMode,
  TournamentCategory,
  UserSession,
} from '../types/tournament';
import {
  authenticateAccount,
  AuthResult,
  createSpectatorAccount,
} from '../utils/authHelper';
import { getEffectiveElapsedSeconds } from '../utils/clockHelper';
import {
  BracketParticipant,
  generateKnockoutBracket,
  getRecommendedKnockoutStartStage,
  propagateKnockoutProgression,
} from '../utils/knockoutEngine';
import {
  generateLeagueFixturesForTeams,
  generateRandomGroupDrawAndFixtures,
  generateRoundRobinFixturesForTeams,
  LeagueDrawOptions,
} from '../utils/drawGenerator';
import {
  calculateGroupStandings,
  calculateLeagueStandings,
} from '../utils/standingsCalculator';

const STORAGE_KEY = 'kots_cup_state_v1';
const SESSION_STORAGE_KEY = 'kots_cup_session_v2';
const ACCOUNTS_STORAGE_KEY = 'kots_cup_accounts_v1';
const THEME_STORAGE_KEY = 'kots_cup_theme_v2';
const CHANNEL_NAME = 'kots_cup_live_sync';

export interface PersistedTournamentData {
  teams7Aside: Team7Aside[];
  players1v1: Player1v1[];
  matches: Match[];
  pastSearches: string[];
}

interface TournamentContextValue {
  session: UserSession;
  theme: ThemeMode;
  syncStatus: SyncStatus;
  teams7Aside: Team7Aside[];
  players1v1: Player1v1[];
  matches: Match[];
  pastSearches: string[];
  isClockRunning: boolean;
  // Theme
  toggleTheme: () => void;
  // Authentication & Profile
  signIn: (identifier: string, password: string) => AuthResult;
  signUpSpectator: (params: {
    username: string;
    contact: string;
    password: string;
  }) => AuthResult;
  signOut: () => void;
  updateDisplayName: (username: string) => void;
  // Utility & Backup
  toggleClockRunning: (matchId?: string) => void;
  adjustMatchClock: (
    matchId: string,
    adjustment: number | 'RESET' | 'SECOND_HALF'
  ) => void;
  addPastSearch: (term: string) => void;
  exportTournamentBackup: () => string;
  importTournamentBackup: (rawJson: string) => { ok: boolean; message: string };
  // Match live operations (Admin-only)
  setMatchStatus: (matchId: string, status: MatchStatus) => void;
  deleteCustomMatch: (matchId: string) => void;
  recordMatchEvent: (params: {
    matchId: string;
    type: MatchEventType;
    side: 'HOME' | 'AWAY';
    playerId?: string;
    playerName: string;
    assistPlayerId?: string;
    assistPlayerName?: string;
  }) => void;
  removeMatchEvent: (matchId: string, eventId: string) => void;
  updateMatchStat: (
    matchId: string,
    statKey: keyof MatchStats,
    side: 'HOME' | 'AWAY',
    delta: number
  ) => void;
  setPenaltyScore: (
    matchId: string,
    homePenalties: number,
    awayPenalties: number
  ) => void;
  updateMatchDetails: (
    matchId: string,
    patch: {
      scheduledTime?: string;
      durationMinutes?: number;
      venue?: string;
    }
  ) => void;
  createCustomMatch: (params: {
    category: TournamentCategory;
    stage: 'LEAGUE' | 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL';
    groupId?: string;
    matchday?: number;
    durationMinutes?: number;
    homeId: string;
    awayId: string;
    scheduledTime: string;
    venue: string;
  }) => void;
  // Automated League & 1v1 Draws (Admin-only)
  runAutomatedLeagueFixtures: (
    options?: Omit<LeagueDrawOptions, 'teams'>
  ) => { matchCount: number; matchdayCount: number };
  runAutomatedGroupDrawAndFixtures: (
    groupCount?: 'AUTO' | 2 | 3 | 4
  ) => { groupCount: number; matchCount: number };
  assignTeamGroupAndSyncFixtures: (teamId: string, groupId: string) => void;
  regenerateKnockoutDraw: (params: {
    category: TournamentCategory;
    startStage: 'R16' | 'QF' | 'SF' | 'AUTO';
    source:
      | 'TOP_8_STANDINGS'
      | 'TBD_EMPTY'
      | 'GROUP_STANDINGS'
      | 'ALL_REGISTERED'
      | 'RANDOM_DRAW';
    dateLabel?: string;
    startTime?: string;
    qfDurationMinutes?: number;
    sfFinalDurationMinutes?: number;
    cooldownMinutes?: number;
    venue?: string;
  }) => void;
  assignSlotParticipant: (
    matchId: string,
    slot: 'HOME' | 'AWAY',
    participantId: string
  ) => void;
  // Registration operations (Admin-only)
  registerTeam7Aside: (input: {
    name: string;
    shortCode: string;
    badgeColor: string;
    groupId?: string;
    captainName: string;
    captainPhone?: string;
    playerNames: string[];
    mpesaReference?: string;
    registrationStatus?: RegistrationStatus;
  }) => Team7Aside | null;
  updateTeam7Aside: (
    teamId: string,
    patch: Partial<
      Pick<
        Team7Aside,
        | 'name'
        | 'shortCode'
        | 'badgeColor'
        | 'groupId'
        | 'captainName'
        | 'captainPhone'
        | 'registrationStatus'
        | 'mpesaReference'
        | 'players'
      >
    >
  ) => void;
  deleteTeam7Aside: (teamId: string) => void;
  registerPlayer1v1: (input: {
    name: string;
    shortCode: string;
    badgeColor: string;
    phone: string;
    mpesaReference?: string;
    registrationStatus?: RegistrationStatus;
  }) => Player1v1 | null;
  updatePlayer1v1Status: (
    playerId: string,
    status: RegistrationStatus,
    mpesaReference?: string
  ) => void;
  deletePlayer1v1: (playerId: string) => void;
  resetTournamentData: () => void;
  clearAllTournamentData: () => void;
}

const TournamentContext = createContext<TournamentContextValue | null>(null);

function normalizeLiveMatchClocks(matches: Match[]): Match[] {
  const now = Date.now();
  return matches.map((m) => {
    if (m.status === 'LIVE' && m.clockStartedAt === undefined) {
      return { ...m, clockStartedAt: now };
    }
    return m;
  });
}

function loadInitialTournamentData(): PersistedTournamentData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedTournamentData>;
      if (
        parsed &&
        Array.isArray(parsed.teams7Aside) &&
        Array.isArray(parsed.matches)
      ) {
        return {
          teams7Aside: parsed.teams7Aside,
          players1v1: Array.isArray(parsed.players1v1)
            ? parsed.players1v1
            : INITIAL_PLAYERS_1V1,
          matches: normalizeLiveMatchClocks(parsed.matches),
          pastSearches: Array.isArray(parsed.pastSearches)
            ? parsed.pastSearches
            : ['Runda Royals', 'League', '1v1', 'Oyster Bay'],
        };
      }
    }
  } catch {
    // ignore storage read error
  }
  return {
    teams7Aside: INITIAL_TEAMS_7ASIDE,
    players1v1: INITIAL_PLAYERS_1V1,
    matches: normalizeLiveMatchClocks(INITIAL_MATCHES),
    pastSearches: ['Runda Royals', 'League', '1v1', 'Oyster Bay'],
  };
}

function loadInitialSession(): UserSession {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserSession;
      if (
        parsed &&
        typeof parsed.isAuthenticated === 'boolean' &&
        typeof parsed.username === 'string' &&
        (parsed.role === 'ADMIN' || parsed.role === 'SPECTATOR')
      ) {
        return parsed;
      }
    }
  } catch {
    // ignore storage read error
  }
  return INITIAL_USER_SESSION;
}

function loadInitialTheme(): ThemeMode {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore storage read error
  }
  return 'light';
}

function loadSpectatorAccounts(): StoredUserAccount[] {
  try {
    const raw = localStorage.getItem(ACCOUNTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(
          (acc: StoredUserAccount) => acc && acc.role === 'SPECTATOR'
        );
      }
    }
  } catch {
    // ignore storage read error
  }
  return [];
}

export const TournamentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<PersistedTournamentData>(
    loadInitialTournamentData
  );
  const [session, setSession] = useState<UserSession>(loadInitialSession);
  const [theme, setTheme] = useState<ThemeMode>(loadInitialTheme);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(
    isCloudSyncEnabled ? 'SYNCING' : 'LOCAL_ONLY'
  );
  const [spectatorAccounts, setSpectatorAccounts] = useState<
    StoredUserAccount[]
  >(loadSpectatorAccounts);
  const [clockTick, setClockTick] = useState<number>(() => Date.now());
  const lastLocalMutationAtRef = useRef<number>(0);

  // Apply html.dark / html.light class and sync mobile browser theme-color whenever theme changes
  useEffect(() => {
    const root = document.documentElement;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
      if (themeMeta) themeMeta.setAttribute('content', '#F3F5EE');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      if (themeMeta) themeMeta.setAttribute('content', '#141513');
    }
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore storage error
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Derive whether any LIVE match currently has an active running timestamp
  const isClockRunning = useMemo(() => {
    const liveMatches = data.matches.filter((m) => m.status === 'LIVE');
    if (liveMatches.length === 0) return true;
    return liveMatches.some(
      (m) => typeof m.clockStartedAt === 'number' && m.clockStartedAt > 0
    );
  }, [data.matches]);

  const persistSession = (nextSession: UserSession) => {
    setSession(nextSession);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    } catch {
      // ignore storage errors
    }
  };

  const pushStateToSupabase = async (snapshot: PersistedTournamentData) => {
    if (!supabase) return;
    try {
      setSyncStatus('SYNCING');
      const { error } = await supabase.from('tournament_state').upsert(
        {
          id: TOURNAMENT_ROW_ID,
          teams_7aside: snapshot.teams7Aside,
          players_1v1: snapshot.players1v1,
          matches: snapshot.matches,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
      setSyncStatus(error ? 'LOCAL_ONLY' : 'LIVE_CLOUD');
    } catch {
      setSyncStatus('LOCAL_ONLY');
    }
  };

  const applyRemoteSnapshot = (remote: {
    teams_7aside?: Team7Aside[];
    players_1v1?: Player1v1[];
    matches?: Match[];
  }) => {
    if (!Array.isArray(remote.teams_7aside) || !Array.isArray(remote.matches)) {
      return;
    }
    setData((prev) => {
      const next: PersistedTournamentData = {
        teams7Aside: remote.teams_7aside!,
        players1v1: Array.isArray(remote.players_1v1)
          ? remote.players_1v1
          : prev.players1v1,
        matches: remote.matches!,
        pastSearches: prev.pastSearches,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage error
      }
      return next;
    });
    setSyncStatus('LIVE_CLOUD');
  };

  const commitData = (
    updater: (prev: PersistedTournamentData) => PersistedTournamentData,
    syncCloud: boolean = true
  ) => {
    lastLocalMutationAtRef.current = Date.now();
    setData((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel(CHANNEL_NAME);
          bc.postMessage(next);
          bc.close();
        }
      } catch {
        // ignore storage errors
      }
      if (syncCloud && supabase) {
        void pushStateToSupabase(next);
      } else if (syncCloud && import.meta.env.DEV) {
        void fetch('/api/dev-sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ state: next }),
        }).catch(() => {});
      }
      return next;
    });
  };

  // Supabase Realtime subscription + initial fetch + 12s poll + wake-on-visibility for 300-1,000 users
  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    const fetchLatestFromCloud = async () => {
      if (!supabase) return;
      if (Date.now() - lastLocalMutationAtRef.current < 3500) {
        return;
      }
      try {
        const { data: row, error } = await supabase
          .from('tournament_state')
          .select('teams_7aside, players_1v1, matches')
          .eq('id', TOURNAMENT_ROW_ID)
          .maybeSingle();

        if (!isMounted) return;
        if (Date.now() - lastLocalMutationAtRef.current < 3500) {
          return;
        }

        if (error) {
          setSyncStatus('LOCAL_ONLY');
          return;
        }

        if (row) {
          applyRemoteSnapshot(row);
        } else {
          // Seed initial row if database table is empty
          await pushStateToSupabase(loadInitialTournamentData());
        }

        // Also sync spectator accounts from cloud if available
        const { data: cloudAccounts } = await supabase
          .from('user_accounts')
          .select('id, username, contact, password, role, created_at')
          .eq('role', 'SPECTATOR');

        if (isMounted && Array.isArray(cloudAccounts)) {
          const mapped: StoredUserAccount[] = cloudAccounts.map((acc) => ({
            id: String(acc.id),
            username: String(acc.username),
            contact: String(acc.contact),
            password: String(acc.password),
            role: 'SPECTATOR',
            createdAt: String(acc.created_at || new Date().toISOString()),
          }));
          setSpectatorAccounts(mapped);
          try {
            localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(mapped));
          } catch {
            // ignore storage error
          }
        }
      } catch {
        if (isMounted) setSyncStatus('LOCAL_ONLY');
      }
    };

    void fetchLatestFromCloud();

    const channel = supabase
      .channel('kots-live-state-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tournament_state',
          filter: `id=eq.${TOURNAMENT_ROW_ID}`,
        },
        (payload) => {
          if (payload.new && typeof payload.new === 'object') {
            applyRemoteSnapshot(
              payload.new as {
                teams_7aside?: Team7Aside[];
                players_1v1?: Player1v1[];
                matches?: Match[];
              }
            );
          }
        }
      )
      .subscribe((status) => {
        if (isMounted && status === 'SUBSCRIBED') {
          setSyncStatus('LIVE_CLOUD');
        }
      });

    // 12-second poll fallback + instant refresh when phone wakes up or reconnects
    const pollInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchLatestFromCloud();
      }
    }, 12000);

    const handleVisibilityOrOnline = () => {
      if (document.visibilityState === 'visible') {
        void fetchLatestFromCloud();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrOnline);
    window.addEventListener('online', handleVisibilityOrOnline);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      document.removeEventListener(
        'visibilitychange',
        handleVisibilityOrOnline
      );
      window.removeEventListener('online', handleVisibilityOrOnline);
      void supabase?.removeChannel(channel);
    };
  }, []);

  // Multi-tab real-time sync of matches/standings/teams (does not overwrite tab session)
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return;
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (ev) => {
      if (ev.data && Array.isArray(ev.data.matches)) {
        setData(ev.data as PersistedTournamentData);
      }
    };
    return () => bc.close();
  }, []);

  // Cross-device PoC sync when running Vite dev server across laptop + phones without Supabase
  useEffect(() => {
    if (supabase || !import.meta.env.DEV) return;
    let lastSeenUpdatedAt = 0;
    let active = true;

    const syncWithDevServer = async () => {
      try {
        const res = await fetch('/api/dev-sync');
        if (!res.ok || !active) return;
        const payload = await res.json();
        if (
          payload &&
          typeof payload.updatedAt === 'number' &&
          payload.updatedAt > lastSeenUpdatedAt &&
          payload.state &&
          Array.isArray(payload.state.matches)
        ) {
          lastSeenUpdatedAt = payload.updatedAt;
          setData(payload.state as PersistedTournamentData);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload.state));
          } catch {
            // ignore storage error
          }
        } else if (payload && payload.updatedAt === 0) {
          // Seed the dev server with the initial state from the first connected client
          lastSeenUpdatedAt = Date.now();
          await fetch('/api/dev-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: loadInitialTournamentData() }),
          });
        }
      } catch {
        // ignore network error
      }
    };

    void syncWithDevServer();
    const timer = setInterval(syncWithDevServer, 1500);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  // Lightweight 1-second UI tick for drift-free timestamped live clocks (zero DB writes per second)
  useEffect(() => {
    const hasRunningLive = data.matches.some(
      (m) =>
        m.status === 'LIVE' &&
        typeof m.clockStartedAt === 'number' &&
        m.clockStartedAt > 0
    );
    if (!hasRunningLive) return;

    const interval = setInterval(() => {
      setClockTick(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [data.matches]);

  const signIn = (identifier: string, password: string): AuthResult => {
    const result = authenticateAccount({
      identifier,
      password,
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts,
    });
    if (result.ok) {
      persistSession(result.session);
    }
    return result;
  };

  const signUpSpectator = (params: {
    username: string;
    contact: string;
    password: string;
  }): AuthResult => {
    const result = createSpectatorAccount({
      ...params,
      adminAccounts: DEFAULT_ADMIN_ACCOUNTS,
      spectatorAccounts,
    });
    if (result.ok && result.createdAccount) {
      const created = result.createdAccount;
      const updatedAccounts = [...spectatorAccounts, created];
      setSpectatorAccounts(updatedAccounts);
      try {
        localStorage.setItem(
          ACCOUNTS_STORAGE_KEY,
          JSON.stringify(updatedAccounts)
        );
      } catch {
        // ignore storage error
      }
      if (supabase) {
        void supabase.from('user_accounts').insert({
          id: created.id,
          username: created.username,
          contact: created.contact,
          password: created.password,
          role: 'SPECTATOR',
          created_at: created.createdAt,
        });
      }
      persistSession(result.session);
    }
    return result;
  };

  const signOut = () => {
    persistSession(INITIAL_USER_SESSION);
  };

  const updateDisplayName = (username: string) => {
    const trimmed = username.trim();
    if (!trimmed || !session.isAuthenticated) return;
    persistSession({
      ...session,
      username: trimmed,
    });
  };

  const toggleClockRunning = (matchId?: string) => {
    if (session.role !== 'ADMIN') return;
    const now = Date.now();
    commitData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.status !== 'LIVE') return m;
        if (matchId && m.id !== matchId) return m;
        const isThisRunning =
          typeof m.clockStartedAt === 'number' && m.clockStartedAt > 0;
        if (isThisRunning) {
          return {
            ...m,
            elapsedSeconds: getEffectiveElapsedSeconds(m, now),
            clockStartedAt: null,
          };
        }
        return {
          ...m,
          clockStartedAt: now,
        };
      }),
    }));
  };

  const adjustMatchClock = (
    matchId: string,
    adjustment: number | 'RESET' | 'SECOND_HALF'
  ) => {
    if (session.role !== 'ADMIN') return;
    const now = Date.now();
    commitData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const currentSecs = getEffectiveElapsedSeconds(m, now);
        const maxSecs = m.durationMinutes * 60;
        const halfSecs = Math.floor(maxSecs / 2);
        let nextSecs = currentSecs;
        if (adjustment === 'RESET') {
          nextSecs = 0;
        } else if (adjustment === 'SECOND_HALF') {
          nextSecs = halfSecs;
        } else {
          nextSecs = Math.max(0, Math.min(maxSecs, currentSecs + adjustment));
        }
        const isThisRunning =
          m.status === 'LIVE' &&
          typeof m.clockStartedAt === 'number' &&
          m.clockStartedAt > 0;
        return {
          ...m,
          elapsedSeconds: nextSecs,
          clockStartedAt: isThisRunning ? now : null,
        };
      }),
    }));
  };

  const addPastSearch = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    commitData(
      (prev) => ({
        ...prev,
        pastSearches: [
          trimmed,
          ...prev.pastSearches.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase()
          ),
        ].slice(0, 6),
      }),
      false
    );
  };

  const exportTournamentBackup = (): string => {
    return JSON.stringify(
      {
        version: 'kots-2026-v1',
        exportedAt: new Date().toISOString(),
        teams7Aside: data.teams7Aside,
        players1v1: data.players1v1,
        matches: data.matches,
      },
      null,
      2
    );
  };

  const importTournamentBackup = (
    rawJson: string
  ): { ok: boolean; message: string } => {
    if (session.role !== 'ADMIN') {
      return { ok: false, message: 'Admin privileges required.' };
    }
    try {
      const parsed = JSON.parse(rawJson);
      if (
        !parsed ||
        !Array.isArray(parsed.teams7Aside) ||
        !Array.isArray(parsed.players1v1) ||
        !Array.isArray(parsed.matches)
      ) {
        return {
          ok: false,
          message:
            'Invalid backup file format. Expected teams7Aside, players1v1, and matches arrays.',
        };
      }
      commitData((prev) => ({
        ...prev,
        teams7Aside: parsed.teams7Aside,
        players1v1: parsed.players1v1,
        matches: parsed.matches,
      }));
      return {
        ok: true,
        message: `Restored ${parsed.teams7Aside.length} teams, ${parsed.players1v1.length} 1v1 players, and ${parsed.matches.length} fixtures.`,
      };
    } catch {
      return {
        ok: false,
        message: 'Could not parse JSON backup file.',
      };
    }
  };

  const setMatchStatus = (matchId: string, status: MatchStatus) => {
    if (session.role !== 'ADMIN') return;
    const now = Date.now();
    commitData((prev) => {
      const updated = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const currentElapsed = getEffectiveElapsedSeconds(m, now);
        return {
          ...m,
          status,
          elapsedSeconds:
            status === 'UPCOMING'
              ? 0
              : status === 'FT'
              ? m.durationMinutes * 60
              : currentElapsed,
          clockStartedAt: status === 'LIVE' ? now : null,
        };
      });
      const progressed = propagateKnockoutProgression(updated);
      return { ...prev, matches: progressed };
    });
  };

  const deleteCustomMatch = (matchId: string) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      matches: prev.matches.filter((m) => m.id !== matchId),
    }));
  };

  const recordMatchEvent = (params: {
    matchId: string;
    type: MatchEventType;
    side: 'HOME' | 'AWAY';
    playerId?: string;
    playerName: string;
    assistPlayerId?: string;
    assistPlayerName?: string;
  }) => {
    if (session.role !== 'ADMIN') return;
    const now = Date.now();
    commitData((prev) => {
      const sideIdx = params.side === 'HOME' ? 0 : 1;
      const updatedMatches = prev.matches.map((m) => {
        if (m.id !== params.matchId) return m;
        const effectiveSecs = getEffectiveElapsedSeconds(m, now);
        const currentMinute = Math.max(1, Math.ceil(effectiveSecs / 60));
        const newEvent = {
          id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          minute: currentMinute,
          type: params.type,
          side: params.side,
          playerId: params.playerId,
          playerName: params.playerName,
          assistPlayerId: params.assistPlayerId,
          assistPlayerName: params.assistPlayerName,
        };

        const nextStats: MatchStats = {
          ...m.stats,
          shotsOnTarget: [...m.stats.shotsOnTarget] as [number, number],
          yellowCards: [...m.stats.yellowCards] as [number, number],
          redCards: [...m.stats.redCards] as [number, number],
        };

        let homeScore = m.homeScore;
        let awayScore = m.awayScore;

        if (params.type === 'GOAL') {
          if (params.side === 'HOME') homeScore += 1;
          else awayScore += 1;
          nextStats.shotsOnTarget[sideIdx] += 1;
        } else if (params.type === 'YELLOW_CARD') {
          nextStats.yellowCards[sideIdx] += 1;
        } else if (params.type === 'RED_CARD') {
          nextStats.redCards[sideIdx] += 1;
        }

        return {
          ...m,
          homeScore,
          awayScore,
          stats: nextStats,
          events: [newEvent, ...m.events],
        };
      });

      const progressed = propagateKnockoutProgression(updatedMatches);
      return { ...prev, matches: progressed };
    });
  };

  const removeMatchEvent = (matchId: string, eventId: string) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const updatedMatches = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const target = m.events.find((e) => e.id === eventId);
        if (!target) return m;
        const sideIdx = target.side === 'HOME' ? 0 : 1;
        let homeScore = m.homeScore;
        let awayScore = m.awayScore;
        const nextStats: MatchStats = {
          ...m.stats,
          shotsOnTarget: [...m.stats.shotsOnTarget] as [number, number],
          yellowCards: [...m.stats.yellowCards] as [number, number],
          redCards: [...m.stats.redCards] as [number, number],
        };

        if (target.type === 'GOAL') {
          if (target.side === 'HOME') homeScore = Math.max(0, homeScore - 1);
          else awayScore = Math.max(0, awayScore - 1);
          nextStats.shotsOnTarget[sideIdx] = Math.max(
            0,
            nextStats.shotsOnTarget[sideIdx] - 1
          );
        } else if (target.type === 'YELLOW_CARD') {
          nextStats.yellowCards[sideIdx] = Math.max(
            0,
            nextStats.yellowCards[sideIdx] - 1
          );
        } else if (target.type === 'RED_CARD') {
          nextStats.redCards[sideIdx] = Math.max(
            0,
            nextStats.redCards[sideIdx] - 1
          );
        }

        return {
          ...m,
          homeScore,
          awayScore,
          stats: nextStats,
          events: m.events.filter((e) => e.id !== eventId),
        };
      });

      const progressed = propagateKnockoutProgression(updatedMatches);
      return { ...prev, matches: progressed };
    });
  };

  const updateMatchStat = (
    matchId: string,
    statKey: keyof MatchStats,
    side: 'HOME' | 'AWAY',
    delta: number
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const sideIdx = side === 'HOME' ? 0 : 1;
      const otherIdx = sideIdx === 0 ? 1 : 0;
      const updated = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        const tuple = [...m.stats[statKey]] as [number, number];
        if (statKey === 'possession') {
          const nextVal = Math.min(95, Math.max(5, tuple[sideIdx] + delta));
          tuple[sideIdx] = nextVal;
          tuple[otherIdx] = 100 - nextVal;
        } else {
          tuple[sideIdx] = Math.max(0, tuple[sideIdx] + delta);
        }
        return {
          ...m,
          stats: {
            ...m.stats,
            [statKey]: tuple,
          },
        };
      });
      return { ...prev, matches: updated };
    });
  };

  const setPenaltyScore = (
    matchId: string,
    homePenalties: number,
    awayPenalties: number
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const updated = prev.matches.map((m) =>
        m.id === matchId ? { ...m, homePenalties, awayPenalties } : m
      );
      return {
        ...prev,
        matches: propagateKnockoutProgression(updated),
      };
    });
  };

  const updateMatchDetails = (
    matchId: string,
    patch: {
      scheduledTime?: string;
      durationMinutes?: number;
      venue?: string;
    }
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      matches: prev.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              scheduledTime:
                patch.scheduledTime !== undefined
                  ? patch.scheduledTime.trim() || m.scheduledTime
                  : m.scheduledTime,
              durationMinutes:
                patch.durationMinutes !== undefined
                  ? Math.max(1, Math.min(90, Number(patch.durationMinutes) || m.durationMinutes))
                  : m.durationMinutes,
              venue:
                patch.venue !== undefined
                  ? patch.venue.trim() || m.venue
                  : m.venue,
            }
          : m
      ),
    }));
  };

  const createCustomMatch = (params: {
    category: TournamentCategory;
    stage: 'LEAGUE' | 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL';
    groupId?: string;
    matchday?: number;
    durationMinutes?: number;
    homeId: string;
    awayId: string;
    scheduledTime: string;
    venue: string;
  }) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const is7Aside = params.category === '7aside';
      const homeEntity = is7Aside
        ? prev.teams7Aside.find((t) => t.id === params.homeId)
        : prev.players1v1.find((p) => p.id === params.homeId);
      const awayEntity = is7Aside
        ? prev.teams7Aside.find((t) => t.id === params.awayId)
        : prev.players1v1.find((p) => p.id === params.awayId);

      if (!homeEntity || !awayEntity) return prev;

      const newMatch: Match = {
        id: `match-${Date.now()}`,
        category: params.category,
        stage: params.stage,
        groupId: params.groupId || (params.stage === 'LEAGUE' ? 'League' : params.stage),
        matchday: params.matchday,
        venue: params.venue || 'BALLMANIA RUNDA',
        scheduledTime: params.scheduledTime || '14 Nov • 14:00',
        status: 'UPCOMING',
        elapsedSeconds: 0,
        clockStartedAt: null,
        durationMinutes: params.durationMinutes || (is7Aside ? 20 : 4),
        homeId: homeEntity.id,
        awayId: awayEntity.id,
        homeName: homeEntity.name,
        awayName: awayEntity.name,
        homeShort: homeEntity.shortCode,
        awayShort: awayEntity.shortCode,
        homeColor: homeEntity.badgeColor,
        awayColor: awayEntity.badgeColor,
        homeScore: 0,
        awayScore: 0,
        stats: {
          shotsOnTarget: [0, 0],
          shotsOffTarget: [0, 0],
          blockedShots: [0, 0],
          possession: [50, 50],
          corners: [0, 0],
          fouls: [0, 0],
          yellowCards: [0, 0],
          redCards: [0, 0],
        },
        events: [],
      };

      return {
        ...prev,
        matches: [newMatch, ...prev.matches],
      };
    });
  };

  const runAutomatedLeagueFixtures = (
    options: Omit<LeagueDrawOptions, 'teams'> = {}
  ): { matchCount: number; matchdayCount: number } => {
    if (session.role !== 'ADMIN') {
      return { matchCount: 0, matchdayCount: 0 };
    }
    const { leagueMatches, matchdayCount } = generateLeagueFixturesForTeams({
      teams: data.teams7Aside,
      venue: options.venue || 'BALLMANIA RUNDA',
      dateLabel: options.dateLabel || '14 Nov',
      startTime: options.startTime || '10:00',
      durationMinutes: options.durationMinutes || 20,
      slotIntervalMinutes: options.slotIntervalMinutes || 25,
      shuffleTeams: options.shuffleTeams ?? true,
    });

    commitData((prev) => {
      const updatedTeams = prev.teams7Aside.map((t) => ({
        ...t,
        groupId: 'League',
      }));
      const non7AsideMatches = prev.matches.filter(
        (m) => m.category !== '7aside'
      );
      return {
        ...prev,
        teams7Aside: updatedTeams,
        matches: [...leagueMatches, ...non7AsideMatches],
      };
    });

    return {
      matchCount: leagueMatches.length,
      matchdayCount,
    };
  };

  const runAutomatedGroupDrawAndFixtures = (
    groupCount: 'AUTO' | 2 | 3 | 4 = 'AUTO'
  ): { groupCount: number; matchCount: number } => {
    if (session.role !== 'ADMIN') {
      return { groupCount: 0, matchCount: 0 };
    }
    const drawResult = generateRandomGroupDrawAndFixtures({
      teams: data.teams7Aside,
      groupCount,
      venue: 'BALLMANIA RUNDA',
    });

    commitData((prev) => {
      const nonGroup7AsideMatches = prev.matches.filter(
        (m) => !(m.category === '7aside' && m.stage === 'GROUP')
      );
      return {
        ...prev,
        teams7Aside: drawResult.updatedTeams,
        matches: [...drawResult.groupMatches, ...nonGroup7AsideMatches],
      };
    });

    return {
      groupCount: drawResult.groupLabels.length,
      matchCount: drawResult.groupMatches.length,
    };
  };

  const assignTeamGroupAndSyncFixtures = (teamId: string, groupId: string) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const updatedTeams = prev.teams7Aside.map((t) =>
        t.id === teamId ? { ...t, groupId } : t
      );
      const regeneratedGroupMatches = generateRoundRobinFixturesForTeams(
        updatedTeams,
        'BALLMANIA RUNDA'
      );
      const nonGroup7AsideMatches = prev.matches.filter(
        (m) => !(m.category === '7aside' && m.stage === 'GROUP')
      );
      return {
        ...prev,
        teams7Aside: updatedTeams,
        matches: [...regeneratedGroupMatches, ...nonGroup7AsideMatches],
      };
    });
  };

  const regenerateKnockoutDraw = (params: {
    category: TournamentCategory;
    startStage: 'R16' | 'QF' | 'SF' | 'AUTO';
    source:
      | 'TOP_8_STANDINGS'
      | 'TBD_EMPTY'
      | 'GROUP_STANDINGS'
      | 'ALL_REGISTERED'
      | 'RANDOM_DRAW';
    dateLabel?: string;
    startTime?: string;
    qfDurationMinutes?: number;
    sfFinalDurationMinutes?: number;
    cooldownMinutes?: number;
    venue?: string;
  }) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      let participants: BracketParticipant[] = [];

      if (params.source === 'TBD_EMPTY') {
        participants = [];
      } else if (params.category === '7aside') {
        if (params.source === 'TOP_8_STANDINGS') {
          participants = calculateLeagueStandings(prev.teams7Aside, prev.matches)
            .slice(0, 8)
            .map((r) => ({
              id: r.teamId,
              name: r.teamName,
              shortCode: r.shortCode,
              color: r.badgeColor,
            }));
        } else if (params.source === 'GROUP_STANDINGS') {
          const groups = Array.from(
            new Set(
              prev.teams7Aside
                .map((t) => t.groupId)
                .filter((g) => g && g.startsWith('Group '))
            )
          ).sort();
          const winners: BracketParticipant[] = [];
          const runnersUp: BracketParticipant[] = [];
          const others: BracketParticipant[] = [];

          for (const g of groups) {
            const rows = calculateGroupStandings(
              prev.teams7Aside,
              prev.matches,
              g
            );
            rows.forEach((r, idx) => {
              const p: BracketParticipant = {
                id: r.teamId,
                name: r.teamName,
                shortCode: r.shortCode,
                color: r.badgeColor,
              };
              if (idx === 0) winners.push(p);
              else if (idx === 1) runnersUp.push(p);
              else others.push(p);
            });
          }

          // Cross-pair group winners with runners-up from opposite groups
          const reversedRunners = [...runnersUp].reverse();
          const maxLen = Math.max(winners.length, reversedRunners.length);
          for (let i = 0; i < maxLen; i++) {
            if (winners[i]) participants.push(winners[i]);
            if (reversedRunners[i]) participants.push(reversedRunners[i]);
          }
          participants.push(...others);
        } else {
          participants = prev.teams7Aside.map((t) => ({
            id: t.id,
            name: t.name,
            shortCode: t.shortCode,
            color: t.badgeColor,
          }));
        }
      } else {
        participants = prev.players1v1.map((p) => ({
          id: p.id,
          name: p.name,
          shortCode: p.shortCode,
          color: p.badgeColor,
        }));
      }

      if (params.source === 'RANDOM_DRAW') {
        participants = [...participants].sort(() => Math.random() - 0.5);
      }

      const resolvedStartStage =
        params.startStage === 'AUTO'
          ? getRecommendedKnockoutStartStage(participants.length)
          : params.startStage;

      const maxParticipants =
        resolvedStartStage === 'R16'
          ? 16
          : resolvedStartStage === 'QF'
          ? 8
          : 4;

      const newKoMatches = generateKnockoutBracket({
        category: params.category,
        participants: participants.slice(0, maxParticipants),
        startStage: resolvedStartStage,
        venue:
          params.venue ||
          (params.category === '7aside'
            ? 'BALLMANIA RUNDA'
            : 'BALLMANIA 1V1 ARENA'),
        dateLabel: params.dateLabel,
        startTime: params.startTime,
        qfDurationMinutes: params.qfDurationMinutes,
        sfFinalDurationMinutes: params.sfFinalDurationMinutes,
        cooldownMinutes: params.cooldownMinutes,
        seedChampionshipOrder:
          params.source === 'TOP_8_STANDINGS' && resolvedStartStage === 'QF',
      });

      const retainedMatches = prev.matches.filter(
        (m) =>
          !(
            m.category === params.category &&
            m.stage !== 'GROUP' &&
            m.stage !== 'LEAGUE'
          )
      );

      return {
        ...prev,
        matches: [...retainedMatches, ...newKoMatches],
      };
    });
  };

  const assignSlotParticipant = (
    matchId: string,
    slot: 'HOME' | 'AWAY',
    participantId: string
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => {
      const targetMatch = prev.matches.find((m) => m.id === matchId);
      if (!targetMatch) return prev;

      const is7Aside = targetMatch.category === '7aside';
      const entity = is7Aside
        ? prev.teams7Aside.find((t) => t.id === participantId)
        : prev.players1v1.find((p) => p.id === participantId);

      const updatedMatches = prev.matches.map((m) => {
        if (m.id !== matchId) return m;
        if (!entity) {
          return slot === 'HOME'
            ? {
                ...m,
                homeId: 'TBD',
                homeName: 'TBD',
                homeShort: 'TBD',
                homeColor: '#32382D',
              }
            : {
                ...m,
                awayId: 'TBD',
                awayName: 'TBD',
                awayShort: 'TBD',
                awayColor: '#32382D',
              };
        }
        return slot === 'HOME'
          ? {
              ...m,
              homeId: entity.id,
              homeName: entity.name,
              homeShort: entity.shortCode,
              homeColor: entity.badgeColor,
            }
          : {
              ...m,
              awayId: entity.id,
              awayName: entity.name,
              awayShort: entity.shortCode,
              awayColor: entity.badgeColor,
            };
      });

      return { ...prev, matches: updatedMatches };
    });
  };

  const registerTeam7Aside = (input: {
    name: string;
    shortCode: string;
    badgeColor: string;
    groupId?: string;
    captainName: string;
    captainPhone?: string;
    playerNames: string[];
    mpesaReference?: string;
    registrationStatus?: RegistrationStatus;
  }): Team7Aside | null => {
    if (session.role !== 'ADMIN') return null;

    const id = `team-${Date.now()}`;
    const cleanShort =
      input.shortCode.trim().toUpperCase().slice(0, 4) ||
      input.name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) ||
      'KSC';

    const players = Array.from({ length: 10 }, (_, idx) => ({
      id: `${id}-p${idx + 1}`,
      name: input.playerNames[idx]?.trim() || `Player ${idx + 1}`,
      jerseyNumber: idx + 1,
      goals: 0,
      assists: 0,
      yellowCards: 0,
      redCards: 0,
    }));

    const newTeam: Team7Aside = {
      id,
      name: input.name.trim(),
      shortCode: cleanShort,
      badgeColor: input.badgeColor || '#C8F558',
      groupId: input.groupId || 'League',
      captainName: input.captainName.trim(),
      captainPhone: (input.captainPhone || '').trim(),
      players,
      registrationStatus:
        input.registrationStatus ||
        (input.mpesaReference?.trim() ? 'CONFIRMED' : 'PENDING'),
      mpesaReference: input.mpesaReference?.trim().toUpperCase() || '',
      createdAt: new Date().toISOString(),
    };

    commitData((prev) => ({
      ...prev,
      teams7Aside: [newTeam, ...prev.teams7Aside],
    }));

    return newTeam;
  };

  const updateTeam7Aside = (
    teamId: string,
    patch: Partial<
      Pick<
        Team7Aside,
        | 'name'
        | 'shortCode'
        | 'badgeColor'
        | 'groupId'
        | 'captainName'
        | 'captainPhone'
        | 'registrationStatus'
        | 'mpesaReference'
        | 'players'
      >
    >
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      teams7Aside: prev.teams7Aside.map((t) =>
        t.id === teamId ? { ...t, ...patch } : t
      ),
      matches: patch.badgeColor
        ? prev.matches.map((m) =>
            m.homeId === teamId
              ? { ...m, homeColor: patch.badgeColor! }
              : m.awayId === teamId
              ? { ...m, awayColor: patch.badgeColor! }
              : m
          )
        : prev.matches,
    }));
  };

  const deleteTeam7Aside = (teamId: string) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      teams7Aside: prev.teams7Aside.filter((t) => t.id !== teamId),
    }));
  };

  const registerPlayer1v1 = (input: {
    name: string;
    shortCode: string;
    badgeColor: string;
    phone: string;
    mpesaReference?: string;
    registrationStatus?: RegistrationStatus;
  }): Player1v1 | null => {
    if (session.role !== 'ADMIN') return null;

    const id = `p1v1-${Date.now()}`;
    const cleanShort =
      input.shortCode.trim().toUpperCase().slice(0, 4) ||
      input.name.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 3) ||
      '1V1';

    const newPlayer: Player1v1 = {
      id,
      name: input.name.trim(),
      shortCode: cleanShort,
      badgeColor: input.badgeColor || '#C8F558',
      phone: input.phone.trim(),
      registrationStatus:
        input.registrationStatus ||
        (input.mpesaReference?.trim() ? 'CONFIRMED' : 'PENDING'),
      mpesaReference: input.mpesaReference?.trim().toUpperCase() || '',
      goalsScored: 0,
      goalsConceded: 0,
      wins: 0,
      losses: 0,
      yellowCards: 0,
      redCards: 0,
      createdAt: new Date().toISOString(),
    };

    commitData((prev) => ({
      ...prev,
      players1v1: [newPlayer, ...prev.players1v1],
    }));

    return newPlayer;
  };

  const updatePlayer1v1Status = (
    playerId: string,
    status: RegistrationStatus,
    mpesaReference?: string
  ) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      players1v1: prev.players1v1.map((p) =>
        p.id === playerId
          ? {
              ...p,
              registrationStatus: status,
              mpesaReference:
                mpesaReference !== undefined
                  ? mpesaReference.toUpperCase()
                  : p.mpesaReference,
            }
          : p
      ),
    }));
  };

  const deletePlayer1v1 = (playerId: string) => {
    if (session.role !== 'ADMIN') return;
    commitData((prev) => ({
      ...prev,
      players1v1: prev.players1v1.filter((p) => p.id !== playerId),
    }));
  };

  const resetTournamentData = () => {
    if (session.role !== 'ADMIN') return;
    lastLocalMutationAtRef.current = Date.now();
    localStorage.removeItem(STORAGE_KEY);
    const freshData: PersistedTournamentData = {
      teams7Aside: INITIAL_TEAMS_7ASIDE,
      players1v1: INITIAL_PLAYERS_1V1,
      matches: normalizeLiveMatchClocks(INITIAL_MATCHES),
      pastSearches: ['Runda Royals', 'League', '1v1', 'Oyster Bay'],
    };
    setData(freshData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(freshData));
    } catch {
      // ignore storage error
    }
    if (supabase) {
      void pushStateToSupabase(freshData);
    }
  };

  const clearAllTournamentData = () => {
    if (session.role !== 'ADMIN') return;
    const blankData: PersistedTournamentData = {
      teams7Aside: [],
      players1v1: [],
      matches: [],
      pastSearches: [],
    };
    commitData(() => blankData);
  };

  const value = useMemo<TournamentContextValue>(
    () => ({
      session,
      theme,
      syncStatus,
      teams7Aside: data.teams7Aside,
      players1v1: data.players1v1,
      matches: data.matches,
      pastSearches: data.pastSearches,
      isClockRunning,
      toggleTheme,
      signIn,
      signUpSpectator,
      signOut,
      updateDisplayName,
      toggleClockRunning,
      adjustMatchClock,
      addPastSearch,
      exportTournamentBackup,
      importTournamentBackup,
      setMatchStatus,
      deleteCustomMatch,
      recordMatchEvent,
      removeMatchEvent,
      updateMatchStat,
      setPenaltyScore,
      updateMatchDetails,
      createCustomMatch,
      runAutomatedLeagueFixtures,
      runAutomatedGroupDrawAndFixtures,
      assignTeamGroupAndSyncFixtures,
      regenerateKnockoutDraw,
      assignSlotParticipant,
      registerTeam7Aside,
      updateTeam7Aside,
      deleteTeam7Aside,
      registerPlayer1v1,
      updatePlayer1v1Status,
      deletePlayer1v1,
      resetTournamentData,
      clearAllTournamentData,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      session,
      theme,
      syncStatus,
      data,
      spectatorAccounts,
      isClockRunning,
      clockTick,
    ]
  );

  return (
    <TournamentContext.Provider value={value}>
      {children}
    </TournamentContext.Provider>
  );
};

export function useTournament(): TournamentContextValue {
  const ctx = useContext(TournamentContext);
  if (!ctx) {
    throw new Error('useTournament must be used inside TournamentProvider');
  }
  return ctx;
}
