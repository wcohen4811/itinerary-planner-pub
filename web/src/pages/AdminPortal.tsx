import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/auth';

type AdminCard = {
  title: string;
  description: string;
  icon: string;
  action: () => void;
  cta: string;
};

export default function AdminPortal() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const cards: AdminCard[] = [
    {
      title: 'Providers & Destinations',
      description: 'Manage the provider catalog and destination pricing used across itineraries.',
      icon: 'storefront',
      cta: 'Open catalog',
      action: () => navigate('/providers'),
    },
    {
      title: 'Itineraries',
      description: 'Create, edit, and delete itineraries. Deletions are restricted to admins.',
      icon: 'map',
      cta: 'Open itineraries',
      action: () => navigate('/'),
    },
    {
      title: 'Pricing templates & imports',
      description: 'Maintain the pricing template library and run Excel/JSON itinerary imports from the itinerary pricing tools.',
      icon: 'request_quote',
      cta: 'Open dashboard',
      action: () => navigate('/'),
    },
  ];

  return (
    <div className="h-screen w-screen overflow-auto bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary">
              <span className="material-symbols-outlined">admin_panel_settings</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Portal</h1>
              <p className="text-sm text-[#617589] dark:text-gray-400">
                Signed in as {user?.name ?? 'admin'} · administrator
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-[#f0f2f4] dark:bg-[#24303f] hover:bg-[#e7eaee] dark:hover:bg-[#2c3a4b] transition-colors"
              onClick={() => navigate('/')}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to app
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              onClick={logout}
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Log out
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((c) => (
            <div
              key={c.title}
              className="flex flex-col rounded-xl bg-white dark:bg-[#1A2633] border border-gray-200 dark:border-gray-800 shadow-sm p-5"
            >
              <div className="flex items-center justify-center size-10 rounded-lg bg-primary/10 text-primary mb-4">
                <span className="material-symbols-outlined">{c.icon}</span>
              </div>
              <h2 className="text-base font-bold">{c.title}</h2>
              <p className="mt-1 text-sm text-[#617589] dark:text-gray-400 flex-1">{c.description}</p>
              <button
                className="mt-4 self-start flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-600 transition-colors"
                onClick={c.action}
              >
                {c.cta}
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
