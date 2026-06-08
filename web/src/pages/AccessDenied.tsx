import { useAuth, ALLOWED_EMAIL_DOMAIN } from '../auth/auth';

export default function AccessDenied() {
  const { email, logout } = useAuth();

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark font-display px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A2633] shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 mb-5 mx-auto">
          <span className="material-symbols-outlined text-3xl">block</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Access restricted</h1>
        <p className="mt-3 text-sm text-[#617589] dark:text-gray-400">
          This app is limited to <span className="font-medium">@{ALLOWED_EMAIL_DOMAIN}</span> accounts.
          {email ? (
            <>
              {' '}You're signed in as <span className="font-medium">{email}</span>, which isn't permitted.
            </>
          ) : null}
        </p>

        <button
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors"
          onClick={logout}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Log out and use a different account
        </button>
      </div>
    </div>
  );
}
