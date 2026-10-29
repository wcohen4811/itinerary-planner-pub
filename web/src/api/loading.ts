// Lightweight global "is a request in flight?" store that drives the app-wide
// loading overlay. Every request made through the api client (`http`) increments
// a counter when it starts and decrements it when it settles. Because all
// current — and future — features talk to the backend through that single
// choke point, they automatically get a loading indicator with zero extra
// wiring.
//
// For background work that should NOT interrupt the user with an overlay
// (e.g. debounced autosave or polling), wrap the calls in `runSilently()` or
// bracket them with `beginSilent()` / `endSilent()`.

type Listener = () => void;

let pending = 0;
let silentDepth = 0;
const listeners = new Set<Listener>();

function emit(): void {
  for (const listener of listeners) listener();
}

/** Subscribe to loading-count changes. Returns an unsubscribe function. */
export function subscribeLoading(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Current number of tracked in-flight requests. */
export function getPendingCount(): number {
  return pending;
}

/**
 * Called by the api client when a request starts. Returns whether the request
 * was counted (false when inside a silent scope), so the matching
 * `endRequest` call knows whether to decrement.
 */
export function beginRequest(): boolean {
  if (silentDepth > 0) return false;
  pending += 1;
  emit();
  return true;
}

/** Called by the api client when a request settles (success or error). */
export function endRequest(counted: boolean): void {
  if (!counted) return;
  pending = Math.max(0, pending - 1);
  emit();
}

/**
 * Begin a scope whose API requests should not show the global loading overlay.
 * Always pair with `endSilent()` (use a try/finally).
 */
export function beginSilent(): void {
  silentDepth += 1;
}

export function endSilent(): void {
  silentDepth = Math.max(0, silentDepth - 1);
}

/** Run an async function with its API requests excluded from the overlay. */
export async function runSilently<T>(fn: () => Promise<T>): Promise<T> {
  beginSilent();
  try {
    return await fn();
  } finally {
    endSilent();
  }
}
