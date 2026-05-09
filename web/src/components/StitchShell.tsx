import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

type StitchShellProps = {
  active: 'itineraries' | 'proposals' | 'clients';
  children: ReactNode;
};

export default function StitchShell({ active, children }: StitchShellProps) {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display">
      <aside className="w-64 flex flex-col bg-white dark:bg-background-dark border-r border-gray-200 dark:border-gray-800 shrink-0 z-20">
        <div className="p-4">
          <div className="flex gap-3 items-center mb-6">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-10 shrink-0"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCWX6xz2ulhYvCw3tFzNVHjW1C6p3CIFSxlDwhADfCrre9Uk1aE7E3Cqvw3OI1wJUCQN-A2V1Xye7RH3O5oa5qdo-I4GGOR6GgiPU2bbeq6thws8NGcrY7lhAq_iAu8ZzWlp-TX6Kk9Udj38FGQDWLMH4hOpRQMfNLcSj-BGK_fmdOjJsmLGg1iLPMvPiQwAWaV809bUiucH4uNV2Cla5Z4gylJxWbbe_luymUDlWHcE7WfHLVXo45ypYPAC_Wj5hYWhydecdvauwQ")',
              }}
            ></div>
            <div className="flex flex-col overflow-hidden">
              <h1 className="text-[#111418] dark:text-white text-base font-bold leading-tight truncate">Travel Dashboard</h1>
              <p className="text-[#617589] dark:text-gray-400 text-xs font-normal leading-normal">Admin Panel</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">home</span>
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                active === 'itineraries'
                  ? 'bg-primary/10 text-primary dark:text-blue-400'
                  : 'text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              }`}
              onClick={() => navigate('/')}
            >
              <span className={`material-symbols-outlined ${active === 'itineraries' ? 'icon-fill' : ''}`}>map</span>
              <span className="text-sm font-medium">Itineraries</span>
            </button>
            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                active === 'proposals'
                  ? 'bg-primary/10 text-primary dark:text-blue-400'
                  : 'text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              }`}
              onClick={() => navigate('/proposals')}
            >
              <span className={`material-symbols-outlined ${active === 'proposals' ? 'icon-fill' : ''}`}>description</span>
              <span className="text-sm font-medium">Proposals</span>
            </button>
            <button
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${
                active === 'clients'
                  ? 'bg-primary/10 text-primary dark:text-blue-400'
                  : 'text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              }`}
              onClick={() => navigate('/clients')}
            >
              <span className={`material-symbols-outlined ${active === 'clients' ? 'icon-fill' : ''}`}>people</span>
              <span className="text-sm font-medium">Clients</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">calendar_month</span>
              <span className="text-sm font-medium">Bookings</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">group</span>
              <span className="text-sm font-medium">Customers</span>
            </button>
            <button className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#617589] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-symbols-outlined">settings</span>
              <span className="text-sm font-medium">Settings</span>
            </button>
          </nav>
        </div>
        <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 px-3 py-2">
            <div
              className="bg-center bg-no-repeat bg-cover rounded-full size-8"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDaIEJZ9jiEG713wZxnZqxiohu0CxOQnuV2IoVe9KGmRlalgb2FkT5ccYzfdlKmIt-E0QOY6HHRv0Un-mgbyYpUrFoAsJiUR_77nyjNpGZ0P4mbnDNIoQNOD2W8j_mWeCiW2q9TbVInXM8Zm2_jdosUngygoDzYPqZWQZ7URcYUFUIqDRO78tghSNAAl-cD-kJL5C_2Ewc9puoaDZFxOlUhvslweXJi8F4lijmk4Nfi9B57hhyQ1Ebh0V2KJ_X02rVwXfNoH12Kqlc")',
              }}
            ></div>
            <div className="flex flex-col">
              <p className="text-[#111418] dark:text-white text-sm font-medium">Demo User</p>
              <p className="text-[#617589] dark:text-gray-400 text-xs">demo@example.com</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex min-w-0 relative">{children}</main>
    </div>
  );
}

