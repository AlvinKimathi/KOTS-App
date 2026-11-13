export type TournamentCategory = '7aside' | '1v1';

export type KnockoutStage = 'LEAGUE' | 'GROUP' | 'R16' | 'QF' | 'SF' | 'FINAL';

export type RegistrationStatus = 'CONFIRMED' | 'PENDING';

export type MatchStatus = 'UPCOMING' | 'LIVE' | 'HT' | 'FT';

export type AppNavTab =
  | 'home'
  | '1v1'
  | 'tournament'
  | 'teams'
  | 'register'
  | 'admin'
  | 'settings';

export type ThemeMode = 'dark' | 'light';

export type SyncStatus = 'LIVE_CLOUD' | 'LOCAL_ONLY' | 'SYNCING';

export interface UserSession {
  isAuthenticated: boolean;
  username: string;
  contact?: string;
  role: 'SPECTATOR' | 'ADMIN';
}

export interface StoredUserAccount {
  id: string;
  username: string;
  contact: string;
  password: string;
  role: 'SPECTATOR' | 'ADMIN';
  createdAt: string;
}

export interface SquadPlayer {
  id: string;
  name: string;
  jerseyNumber: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
}

export interface Team7Aside {
  id: string;
  name: string;
  shortCode: string; // e.g. "RND", "OYB", "KSC"
  badgeColor: string;
  secondaryColor?: string;
  groupId: string; // "Group A", "Group B", "Group C", "Group D"
  captainName: string;
  captainPhone: string;
  players: SquadPlayer[]; // Standard 10-player squad list
  registrationStatus: RegistrationStatus;
  mpesaReference?: string;
  createdAt: string;
}

export interface Player1v1 {
  id: string;
  name: string;
  shortCode: string;
  badgeColor: string;
  phone: string;
  registrationStatus: RegistrationStatus;
  mpesaReference?: string;
  goalsScored: number;
  goalsConceded: number;
  wins: number;
  losses: number;
  yellowCards: number;
  redCards: number;
  createdAt: string;
}

export interface MatchStats {
  shotsOnTarget: [number, number];
  shotsOffTarget: [number, number];
  blockedShots: [number, number];
  possession: [number, number]; // [home%, away%] summing to 100
  corners: [number, number];
  fouls: [number, number];
  yellowCards: [number, number];
  redCards: [number, number];
}

export type MatchEventType = 'GOAL' | 'YELLOW_CARD' | 'RED_CARD';

export interface MatchEvent {
  id: string;
  minute: number;
  type: MatchEventType;
  side: 'HOME' | 'AWAY';
  playerId?: string;
  playerName: string;
  assistPlayerId?: string;
  assistPlayerName?: string;
}

export interface Match {
  id: string;
  category: TournamentCategory;
  stage: KnockoutStage;
  groupId?: string; // e.g., "League" for LEAGUE stage, or "Group A" / "R16" / "FINAL"
  matchday?: number; // Round / Matchday number for league fixtures
  bracketOrder?: number; // 1..8 for R16, 1..4 for QF, 1..2 for SF, 1 for FINAL
  nextMatchId?: string;
  nextMatchSlot?: 'HOME' | 'AWAY';
  venue: string;
  scheduledTime: string;
  status: MatchStatus;
  elapsedSeconds: number;
  clockStartedAt?: number | null;
  durationMinutes: number;
  homeId: string;
  awayId: string;
  homeName: string;
  awayName: string;
  homeShort: string;
  awayShort: string;
  homeColor: string;
  awayColor: string;
  homeScore: number;
  awayScore: number;
  homePenalties?: number;
  awayPenalties?: number;
  stats: MatchStats;
  events: MatchEvent[];
}

export interface StandingRow {
  teamId: string;
  teamName: string;
  shortCode: string;
  badgeColor: string;
  groupId: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  yellowCards: number;
  redCards: number;
  disciplineScore: number; // YC * 1 + RC * 3 (lower is better)
  form: ('W' | 'D' | 'L')[];
}
