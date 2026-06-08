import { useState } from 'react';
import { useAuth } from '../auth/auth';

export default function VerifyEmail() {
  const { email, refresh, logout } = useAuth();
  const [checking, setChecking] = useState(false);

  async function checkAgain() {
    setChecking(true);
    await refresh();
    // A fresh ID token (with the updated email_verified flag) is picked up on reload.
    window.location.reload();
  }

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-background-light dark:bg-background-dark font-display px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1A2633] shadow-xl border border-gray-200 dark:border-gray-800 p-8 text-center">
        <div className="flex items-center justify-center size-14 rounded-2xl bg-primary/10 text-primary mb-5 mx-auto">
          <span className="material-symbols-outlined text-3xl">mark_email_unread</span>
        </div>
        <h1 className="text-2xl font-bold text-[#111418] dark:text-white">Verify your email</h1>
        <p className="mt-3 text-sm text-[#617589] dark:text-gray-400">
          We sent a verification link to {email ? <span className="font-medium">{email}</span> : 'your email'}. Open it
          to confirm your address, then come back and continue.
        </p>

        <button
          className="mt-8 w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-colors disabled:opacity-60"
          onClick={checkAgain}
          disabled={checking}
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          {checking ? 'Checking…' : "I've verified — check again"}
        </button>
        <button
          className="mt-2 w-full flex items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-5 py-3 text-sm font-semibold text-[#111418] dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          onClick={logout}
        >
          <span className="material-symbols-outlined text-lg">logout</span>
          Log out
        </button>

        <p className="mt-6 text-xs text-[#617589] dark:text-gray-500">
          Didn't get it? Check spam, or log out and sign in again to resend the verification email.
        </p>
      </div>
    </div>
  );
}
