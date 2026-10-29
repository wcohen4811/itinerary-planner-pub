import type { MockNotification } from '../mockData';

export default function NotificationPanel({
  open,
  items,
  onClose,
  onMarkAllRead,
  onOpen,
}: {
  open: boolean;
  items: MockNotification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onOpen: (item: MockNotification) => void;
}) {
  if (!open) return null;
  return (
    <div className="absolute right-0 top-11 z-[70] w-[360px] max-w-[92vw] cmd-glow cmd-brackets rounded-xl bg-[#1e2d4a] shadow-2xl">
      <header className="flex items-center justify-between px-4 py-3 border-b border-sky-400/20">
        <p className="text-sm font-semibold">Notifications</p>
        <div className="flex items-center gap-2">
          <button type="button" className="text-xs text-sky-300 hover:underline" onClick={onMarkAllRead}>
            Mark all read
          </button>
          <button type="button" className="text-[#d5e2f2]" onClick={onClose}>
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </header>
      <div className="max-h-80 overflow-y-auto cmd-scroll">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-[#d5e2f2] text-center">No inbound notifications.</p>
        ) : (
          items.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onOpen(n)}
              className={`w-full text-left px-4 py-3 border-b border-sky-400/10 last:border-0 hover:bg-sky-400/10 ${n.read ? 'opacity-70' : ''}`}
            >
              <div className="flex items-start gap-2">
                {!n.read ? <span className="mt-1.5 size-1.5 rounded-full bg-sky-300 shrink-0" /> : <span className="mt-1.5 size-1.5 shrink-0" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-[#d5e2f2] mt-0.5">{n.detail}</p>
                  <p className="text-[11px] text-sky-300 mt-1">{n.time} · {n.formName}</p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
