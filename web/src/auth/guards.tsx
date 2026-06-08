import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, authConfigured } from './auth';
import { setAuthTokenProvider } from '../api/client';
import VerifyEmail from '../pages/VerifyEmail';
import AccessDenied from '../pages/AccessDenied';

function FullScreen({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark text-[#617589] dark:text-gray-400">
      {children}
    </div>
  );
}

/**
 * Bridges the active auth state into the API client so every request carries a
 * fresh Bearer token. Renders nothing.
 */
export function AuthBridge() {
  const { getToken } = useAuth();
  useEffect(() => {
    setAuthTokenProvider(getToken);
    return () => setAuthTokenProvider(null);
  }, [getToken]);
  return null;
}

type Decision = 'loading' | 'login' | 'denied-domain' | 'verify' | 'forbidden' | 'ok';

function useAccessDecision(requireAdmin: boolean): Decision {
  const { isLoading, isAuthenticated, emailVerified, emailAllowed, isAdmin } = useAuth();
  if (isLoading) return 'loading';
  if (!isAuthenticated) return 'login';
  // Domain + verification are enforced only against a real Auth0 session.
  if (authConfigured) {
    if (!emailAllowed) return 'denied-domain';
    if (!emailVerified) return 'verify';
  }
  if (requireAdmin && !isAdmin) return 'forbidden';
  return 'ok';
}

function render(decision: Decision, children: ReactNode) {
  switch (decision) {
    case 'loading':
      return <FullScreen>Loading…</FullScreen>;
    case 'login':
      return <Navigate to="/login" replace />;
    case 'denied-domain':
      return <AccessDenied />;
    case 'verify':
      return <VerifyEmail />;
    case 'forbidden':
      return <Navigate to="/" replace />;
    case 'ok':
      return <>{children}</>;
  }
}

/** Requires an authenticated, allowed-domain, email-verified session. */
export function RequireAuth({ children }: { children: ReactNode }) {
  return render(useAccessDecision(false), children);
}

/** Same as RequireAuth, plus the `admin` role. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  return render(useAccessDecision(true), children);
}
