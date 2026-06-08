import { useCallback } from 'react';
import type { ReactNode } from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;
const ROLES_CLAIM = import.meta.env.VITE_AUTH0_ROLES_CLAIM || 'https://itineraryplanner/roles';

/** Only accounts on this email domain may use the app. */
export const ALLOWED_EMAIL_DOMAIN = (import.meta.env.VITE_ALLOWED_EMAIL_DOMAIN || 'savacations.com').toLowerCase();

export function isEmailAllowed(email?: string | null): boolean {
  if (!email) return false;
  return email.toLowerCase().endsWith('@' + ALLOWED_EMAIL_DOMAIN);
}

/**
 * Auth is enforced when an Auth0 domain + client id are configured. Without
 * them (local dev) the app falls back to a permissive dev identity so it stays
 * runnable without an Auth0 tenant. In production these env vars MUST be set.
 */
export const authConfigured = Boolean(domain && clientId);

export type AuthUser = { name: string; email?: string; picture?: string };

export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  user: AuthUser | null;
  email: string | null;
  emailVerified: boolean;
  emailAllowed: boolean;
  roles: string[];
  isAdmin: boolean;
  login: () => void;
  signup: () => void;
  logout: () => void;
  getToken: () => Promise<string | null>;
  refresh: () => Promise<void>;
};

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (!authConfigured) return <>{children}</>;
  return (
    <Auth0Provider
      domain={domain!}
      clientId={clientId!}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
      }}
      cacheLocation="localstorage"
      useRefreshTokens
    >
      {children}
    </Auth0Provider>
  );
}

function useRealAuth(): AuthState {
  const a = useAuth0();
  const roles = (a.user?.[ROLES_CLAIM] as string[] | undefined) ?? [];
  const email = typeof a.user?.email === 'string' ? a.user.email : null;
  const emailVerified = a.user?.email_verified === true;
  const getToken = useCallback(async () => {
    try {
      return await a.getAccessTokenSilently();
    } catch {
      return null;
    }
  }, [a]);
  const refresh = useCallback(async () => {
    try {
      await a.getAccessTokenSilently({ cacheMode: 'off' });
    } catch {
      /* ignore; caller typically reloads afterwards */
    }
  }, [a]);
  return {
    isLoading: a.isLoading,
    isAuthenticated: a.isAuthenticated,
    error: a.error ? a.error.message : null,
    user: a.user
      ? { name: a.user.name ?? a.user.email ?? 'User', email: a.user.email, picture: a.user.picture }
      : null,
    email,
    emailVerified,
    emailAllowed: isEmailAllowed(email),
    roles,
    isAdmin: roles.includes('admin'),
    login: () => void a.loginWithRedirect(),
    signup: () => void a.loginWithRedirect({ authorizationParams: { screen_hint: 'signup' } }),
    logout: () => a.logout({ logoutParams: { returnTo: window.location.origin } }),
    getToken,
    refresh,
  };
}

function useDevAuth(): AuthState {
  return {
    isLoading: false,
    isAuthenticated: true,
    error: null,
    user: { name: 'Local Dev', email: 'dev@local.test' },
    email: 'dev@local.test',
    emailVerified: true,
    emailAllowed: true,
    roles: ['admin', 'user'],
    isAdmin: true,
    login: () => {},
    signup: () => {},
    logout: () => {},
    getToken: async () => null,
    refresh: async () => {},
  };
}

/**
 * Single source of truth for auth state across the app. Resolves to the real
 * Auth0-backed hook when configured, or a dev identity otherwise. The choice is
 * fixed at module load, so this is hook-rules safe.
 */
export const useAuth: () => AuthState = authConfigured ? useRealAuth : useDevAuth;
