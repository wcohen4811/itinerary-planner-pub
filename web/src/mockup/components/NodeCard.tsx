export default function NodeCard({
  icon,
  label,
  stat,
  dimmed,
  onClick,
  delayMs,
  badge,
}: {
  icon: string;
  label: string;
  stat: string;
  dimmed?: boolean;
  onClick: () => void;
  delayMs?: number;
  badge?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ animationDelay: `${delayMs ?? 0}ms` }}
      className={`cmd-node-in cmd-node-idle cmd-hover-node cmd-brackets group w-[168px] rounded-2xl bg-[#2a3d64] px-3 py-3 text-left relative ${
        dimmed ? 'opacity-25 pointer-events-none' : 'opacity-100'
      }`}
    >
      {badge && badge > 0 ? (
        <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-sky-300 text-slate-900 text-[11px] font-bold flex items-center justify-center">
          {badge}
        </span>
      ) : null}
      <div className="flex items-center gap-2.5">
        <span className="cmd-node-icon flex size-9 items-center justify-center rounded-lg bg-[#137fec]/25 text-[#8ec5ff]">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </span>
        <div className="min-w-0">
          <div className="text-[15px] font-semibold truncate">{label}</div>
          <div className="text-xs text-[#e8f1fb]">{stat}</div>
        </div>
      </div>
    </button>
  );
}
