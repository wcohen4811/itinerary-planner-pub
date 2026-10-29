import { useEffect, useState, useSyncExternalStore } from 'react';
import { subscribeLoading, getPendingCount } from '../api/loading';

// Only show the overlay once a request has been in flight for this long, so
// fast actions don't cause a distracting flash. Longer operations (e.g.
// duplicating an itinerary, which makes several sequential calls) will show it.
const SHOW_DELAY_MS = 300;

/**
 * App-wide loading popup. Driven entirely by the api client's in-flight
 * request count, so every current and future feature that talks to the backend
 * shows a loading indicator automatically — no per-feature wiring required.
 * Background work wrapped in `runSilently()` (e.g. autosave) is excluded.
 */
export default function GlobalLoadingOverlay() {
  const pending = useSyncExternalStore(subscribeLoading, getPendingCount, getPendingCount);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pending > 0) {
      const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
    setVisible(false);
    return undefined;
  }, [pending]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" aria-hidden="true" />
      <div className="relative flex items-center gap-3 rounded-xl bg-white dark:bg-gray-900 px-5 py-4 shadow-xl">
        <span
          className="inline-block size-5 shrink-0 rounded-full border-2 border-gray-300 border-t-primary animate-spin"
          aria-hidden="true"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Working…</span>
      </div>
    </div>
  );
}
