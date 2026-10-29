import { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import type { MockNotification } from '../mockData';

export default function StatusBar({
  crumb,
  onHome,
  unreadCount = 0,
  notifications = [],
  onMarkAllRead,
  onOpenNotification,
}: {
  crumb: string;
  onHome: () => void;
  unreadCount?: number;
  notifications?: MockNotification[];
  onMarkAllRead?: () => void;
  onOpenNotification?: (item: MockNotification) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative flex items-center justify-between gap-4 px-4 h-12 shrink-0 border-b border-[rgba(19,127,236,0.32)] bg-[#2a3d64]/95 backdrop-blur-sm">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onHome}
          className="cmd-hover-home flex items-center justify-center size-8 rounded-full border border-[rgba(19,127,236,0.45)] text-[#137fec] cmd-pulse"
          title="Return to command hub"
        >
          <span className="material-symbols-outlined text-[18px]">hub</span>
        </button>
        <div className="text-xs font-medium text-[#e8f1fb] truncate">
          Savtrails <span className="text-sky-300">/</span> Command
          <span className="text-white"> {crumb.replace('/', '·')}</span>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-[#e8f1fb] shrink-0">
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className="cmd-hover-icon relative flex items-center justify-center size-8 rounded-full text-sky-200 hover:bg-sky-400/10"
            title="Notifications"
          >
            <span className="material-symbols-outlined text-[20px]">notifications</span>
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-sky-300 text-slate-900 text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <NotificationPanel
            open={open}
            items={notifications}
            onClose={() => setOpen(false)}
            onMarkAllRead={() => {
              onMarkAllRead?.();
            }}
            onOpen={(item) => {
              setOpen(false);
              onOpenNotification?.(item);
            }}
          />
        </div>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-[#34d399] cmd-pulse" />
          Link live
        </span>
        <span>SYS 98%</span>
        <span>14 OCT 26</span>
      </div>
    </div>
  );
}
