import { useNavigate } from 'react-router-dom';
import { useAuth, authConfigured } from '../auth/auth';

export default function Login() {
  const navigate = useNavigate();
  const { isLoading, isAuthenticated, error, user, roles, isAdmin, login, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark font-display px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A2633] shadow-xl border border-gray-200 dark:border-gray-800 p-8">
        <div className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-5">
            <span className="material-symbols-outlined text-3xl">travel_explore</span>
          </div>
          <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Itinerary Planner</h1>

          {/* Not configured: show a clear hint instead of a broken login */}
          {!authConfigured ? (
            <>
              <p className="mt-2 text-sm text-[#617589] dark:text-gray-400">
                Auth0 is not configured, so the app is running with a local development identity (admin).
              </p>
              <button
                className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                onClick={() => navigate('/')}
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Enter app
              </button>
            </>
          ) : isLoading ? (
            <p className="mt-6 text-sm text-[#617589] dark:text-gray-400">Loading…</p>
          ) : isAuthenticated ? (
            <>
              <p className="mt-2 text-sm text-[#617589] dark:text-gray-400">You are signed in.</p>

              <div className="mt-6 w-full rounded-xl border border-gray-200 dark:border-gray-800 p-4 text-left">
                <div className="flex items-center gap-3">
                  {user?.picture ? (
                    <img src={user.picture} alt="" className="size-10 rounded-full" />
                  ) : (
                    <div className="flex items-center justify-center size-10 rounded-full bg-primary/10 text-primary font-semibold">
                      {(user?.name ?? 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111418] dark:text-white truncate">{user?.name ?? 'User'}</p>
                    <p className="text-xs text-[#617589] dark:text-gray-400 truncate">{user?.email ?? ''}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#617589] dark:text-gray-400">
                  Role: <span className="font-medium">{isAdmin ? 'admin' : roles.length ? roles.join(', ') : 'user (no roles claim)'}</span>
                </p>
              </div>

              <button
                className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                onClick={() => navigate('/')}
              >
                <span className="material-symbols-outlined text-lg">arrow_forward</span>
                Enter app
              </button>
              <button
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-[#111418] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                onClick={logout}
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                Log out
              </button>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#617589] dark:text-gray-400">
                Sign in to access proposals, clients, and itineraries. Your role determines what you can manage.
              </p>

              {error ? (
                <div className="mt-5 w-full rounded-lg border border-red-200 bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 px-4 py-3 text-left text-sm text-red-700 dark:text-red-300">
                  {error}
                </div>
              ) : null}

              <button
                className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
                onClick={login}
              >
                <span className="material-symbols-outlined text-lg">login</span>
                Log in
              </button>

              <p className="mt-6 text-xs text-[#617589] dark:text-gray-500">
                Secured by Auth0. Accounts are provisioned by an administrator — contact your admin for access.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
