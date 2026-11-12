import { StoredUserAccount, UserSession } from '../types/tournament';

export type AuthResult =
  | { ok: true; session: UserSession; createdAccount?: StoredUserAccount }
  | { ok: false; error: string };

/**
 * Authenticates an existing Spectator or protected Admin account (e.g. Kim / KOTS2026).
 */
export function authenticateAccount(params: {
  identifier: string;
  password: string;
  adminAccounts: StoredUserAccount[];
  spectatorAccounts: StoredUserAccount[];
}): AuthResult {
  const cleanId = params.identifier.trim().toLowerCase();
  const rawPass = params.password;

  if (!cleanId || !rawPass) {
    return {
      ok: false,
      error: 'Please enter both your username/contact and password.',
    };
  }

  // 1. Check built-in organizer Admin accounts first
  const matchedAdmin = params.adminAccounts.find(
    (acc) =>
      (acc.username.toLowerCase() === cleanId ||
        acc.contact.toLowerCase() === cleanId) &&
      acc.password === rawPass
  );

  if (matchedAdmin) {
    return {
      ok: true,
      session: {
        isAuthenticated: true,
        username: matchedAdmin.username,
        contact: matchedAdmin.contact,
        role: 'ADMIN',
      },
    };
  }

  // 2. Check registered Spectator accounts
  const matchedSpectator = params.spectatorAccounts.find(
    (acc) =>
      (acc.username.toLowerCase() === cleanId ||
        acc.contact.toLowerCase() === cleanId) &&
      acc.password === rawPass
  );

  if (matchedSpectator) {
    return {
      ok: true,
      session: {
        isAuthenticated: true,
        username: matchedSpectator.username,
        contact: matchedSpectator.contact,
        role: 'SPECTATOR',
      },
    };
  }

  return {
    ok: false,
    error: 'Invalid username/contact or password. Please check and try again.',
  };
}

/**
 * Registers a new Spectator account. Self-registration is strictly locked to SPECTATOR.
 */
export function createSpectatorAccount(params: {
  username: string;
  contact: string;
  password: string;
  adminAccounts: StoredUserAccount[];
  spectatorAccounts: StoredUserAccount[];
}): AuthResult {
  const cleanUsername = params.username.trim();
  const cleanContact = params.contact.trim();
  const rawPass = params.password;

  if (cleanUsername.length < 2) {
    return {
      ok: false,
      error: 'Username must be at least 2 characters.',
    };
  }

  if (!cleanContact) {
    return {
      ok: false,
      error: 'Please enter an email address or phone number.',
    };
  }

  if (rawPass.length < 4) {
    return {
      ok: false,
      error: 'Password must be at least 4 characters.',
    };
  }

  const allAccounts = [...params.adminAccounts, ...params.spectatorAccounts];
  const duplicateUser = allAccounts.some(
    (acc) =>
      acc.username.toLowerCase() === cleanUsername.toLowerCase() ||
      acc.contact.toLowerCase() === cleanContact.toLowerCase()
  );

  if (duplicateUser) {
    return {
      ok: false,
      error: 'An account with that username or contact already exists. Sign in instead.',
    };
  }

  const createdAccount: StoredUserAccount = {
    id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    username: cleanUsername,
    contact: cleanContact,
    password: rawPass,
    role: 'SPECTATOR',
    createdAt: new Date().toISOString(),
  };

  return {
    ok: true,
    createdAccount,
    session: {
      isAuthenticated: true,
      username: createdAccount.username,
      contact: createdAccount.contact,
      role: 'SPECTATOR',
    },
  };
}
