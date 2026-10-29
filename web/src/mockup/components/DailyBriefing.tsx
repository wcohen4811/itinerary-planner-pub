import { formatUsd, type MockAiBriefing } from '../mockData';

export default function DailyBriefing({
  briefing,
  newClients,
  salesMonth,
  salesYtd,
  conversionPct,
  followUpsDue = 0,
  onNewClients,
  onProposals,
  onFollowUps,
}: {
  briefing: MockAiBriefing;
  newClients: number;
  salesMonth: number;
  salesYtd: number;
  conversionPct: number;
  followUpsDue?: number;
  onNewClients?: () => void;
  onProposals?: () => void;
  onFollowUps?: () => void;
}) {
  return (
    <div className="cmd-welcome-title cmd-glow cmd-brackets w-full max-w-lg rounded-lg bg-[#1e2d4a] px-3 py-2 text-left shadow-[0_8px_24px_rgba(8,18,36,0.45)]">
      <div className="flex items-center justify-between gap-2 min-w-0">
        <h1 className="text-sm font-semibold text-white truncate">{briefing.greeting}</h1>
        <p className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-sky-300/80">Briefing</p>
      </div>
      <p className="text-[11px] text-[#d5e2f2] mt-0.5 truncate leading-snug">{briefing.body}</p>
      <div className="flex flex-wrap items-center gap-1 mt-1.5">
        <button
          type="button"
          onClick={onNewClients}
          className="cmd-hover-nav rounded px-1.5 py-0.5 text-[10px] bg-sky-300 text-slate-900 font-semibold"
        >
          {newClients} new
        </button>
        <button
          type="button"
          onClick={onProposals}
          className="cmd-hover-nav rounded px-1.5 py-0.5 text-[10px] bg-white/10 text-white"
        >
          {conversionPct}% conv.
        </button>
        {followUpsDue > 0 ? (
          <button
            type="button"
            onClick={onFollowUps}
            className="cmd-hover-nav rounded px-1.5 py-0.5 text-[10px] bg-amber-300 text-slate-900 font-semibold"
          >
            {followUpsDue} due
          </button>
        ) : null}
        <span className="text-[10px] text-sky-100/85 ml-0.5">
          {formatUsd(salesMonth)} mo · {formatUsd(salesYtd)} YTD
        </span>
      </div>
    </div>
  );
}
