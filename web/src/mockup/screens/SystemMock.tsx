import { useState } from 'react';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';

type Gate = 'login' | 'verify' | 'denied';

export default function SystemMock() {
  const [gate, setGate] = useState<Gate>('login');

  return (
    <div className="flex-1 overflow-y-auto cmd-scroll p-6 space-y-5">
      <div className="flex gap-2 justify-center">
        {(['login', 'verify', 'denied'] as const).map((g) => (
          <HudButton key={g} tone={gate === g ? 'primary' : 'ghost'} onClick={() => setGate(g)}>
            {g === 'login' ? 'Login' : g === 'verify' ? 'Verify email' : 'Access denied'}
          </HudButton>
        ))}
      </div>
      <div className="flex justify-center py-8">
        <HudPanel className="w-full max-w-md text-center">
          {gate === 'login' ? (
            <>
              <span className="mx-auto size-12 rounded-xl bg-[#137fec]/15 text-[#137fec] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined">travel_explore</span>
              </span>
              <h2 className="text-xl font-black">Itinerary Planner</h2>
              <p className="text-sm text-[#d5e2f2] mt-2 mb-5">Log in to Auth0 to continue to Savtrails command.</p>
              <div className="rounded-lg bg-[#263858] p-3 mb-4 flex items-center gap-3 text-left">
                <span className="size-9 rounded-full bg-[#137fec]/20 text-[#137fec] flex items-center justify-center font-bold">W</span>
                <div>
                  <p className="text-sm font-semibold">Demo Planner</p>
                  <p className="text-xs text-[#d5e2f2]">planner@example.com · administrator</p>
                </div>
              </div>
              <HudButton tone="primary" icon="login" className="w-full">
                Log in
              </HudButton>
            </>
          ) : null}
          {gate === 'verify' ? (
            <>
              <span className="mx-auto size-12 rounded-xl bg-[#137fec]/15 text-[#137fec] flex items-center justify-center mb-3">
                <span className="material-symbols-outlined">mark_email_unread</span>
              </span>
              <h2 className="text-xl font-black">Verify your email</h2>
              <p className="text-sm text-[#d5e2f2] mt-2 mb-5">A verification message was sent to planner@example.com.</p>
              <div className="flex flex-col gap-2">
                <HudButton tone="primary" icon="refresh">
                  I've verified — check again
                </HudButton>
                <HudButton icon="logout">Log out</HudButton>
              </div>
            </>
          ) : null}
          {gate === 'denied' ? (
            <>
              <span className="mx-auto size-12 rounded-xl bg-red-500/15 text-red-400 flex items-center justify-center mb-3">
                <span className="material-symbols-outlined">block</span>
              </span>
              <h2 className="text-xl font-black">Access restricted</h2>
              <p className="text-sm text-[#d5e2f2] mt-2 mb-5">
                This Auth0 account is not permitted to use the app. Ask an administrator to grant access.
              </p>
              <HudButton tone="danger" icon="logout" className="w-full">
                Log out and use a different account
              </HudButton>
            </>
          ) : null}
        </HudPanel>
      </div>
    </div>
  );
}
