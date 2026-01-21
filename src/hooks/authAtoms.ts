import { atom } from 'jotai';
import { atomWithAsyncStorage } from './storage';

export interface SSOUser {
  id?: string;
  email?: string;
  name?: string;
  provider: 'openrouter' | 'custom';
}

export interface SSOAuthState {
  isAuthenticated: boolean;
  user: SSOUser | null;
  apiKey: string | null;
}

const defaultAuthState: SSOAuthState = {
  isAuthenticated: false,
  user: null,
  apiKey: null,
};

// Persisted auth state
export const ssoAuthStateAtom = atomWithAsyncStorage<SSOAuthState>(
  'compass_sso_auth_state',
  defaultAuthState,
);

// Derived atoms for convenience
export const isSSOAuthenticatedAtom = atom(
  async (get) => (await get(ssoAuthStateAtom)).isAuthenticated,
);

export const ssoUserAtom = atom(
  async (get) => (await get(ssoAuthStateAtom)).user,
);

export const ssoApiKeyAtom = atom(
  async (get) => (await get(ssoAuthStateAtom)).apiKey,
);
