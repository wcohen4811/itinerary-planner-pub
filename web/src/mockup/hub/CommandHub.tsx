import { useMemo } from 'react';
import CommandPalette from '../components/CommandPalette';
import DailyBriefing from '../components/DailyBriefing';
import NodeCard from '../components/NodeCard';
import { hubNodes, type MockAiBriefing, type MockSalesSnapshot, type MockView } from '../mockData';

const CX = 50;
const CY = 50;
const R = 28;

function polar(angleDeg: number, radius = R) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: CX + radius * Math.cos(rad),
    y: CY + radius * Math.sin(rad),
  };
}

export default function CommandHub({
  query,
  onQuery,
  onEnter,
  onOpenNewClients,
  unreadCount = 0,
  sales,
  briefing,
  followUpsDue = 0,
  onOpenFollowUps,
}: {
  query: string;
  onQuery: (v: string) => void;
  onEnter: (view: Exclude<MockView, 'hub'>) => void;
  onOpenNewClients?: () => void;
  unreadCount?: number;
  sales: MockSalesSnapshot;
  briefing: MockAiBriefing;
  followUpsDue?: number;
  onOpenFollowUps?: () => void;
}) {
  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      hubNodes.map((n) => ({
        ...n,
        match: !q || n.label.toLowerCase().includes(q) || n.id.includes(q) || (n.id === 'clients' && (q.includes('new') || q.includes('intake'))),
        stat:
          n.id === 'clients'
            ? unreadCount > 0
              ? `${unreadCount} new leads`
              : 'All caught up'
            : n.id === 'proposals'
              ? `${sales.conversionPct}% conversion`
              : n.stat,
      })),
    [q, unreadCount, sales.conversionPct],
  );

  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 cmd-void" />
      <div className="absolute inset-0 cmd-aurora" />
      <div className="absolute inset-0 cmd-dust" />
      <div className="absolute inset-0 cmd-scan opacity-40" />
      <div className="absolute inset-0 cmd-sweep opacity-50" />

      <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 w-full px-4 flex justify-center pointer-events-none">
        <div className="pointer-events-auto w-full max-w-lg">
          <DailyBriefing
            briefing={briefing}
            newClients={unreadCount}
            salesMonth={sales.totalSalesMonth}
            salesYtd={sales.totalSalesYtd}
            conversionPct={sales.conversionPct}
            followUpsDue={followUpsDue}
            onNewClients={onOpenNewClients}
            onProposals={() => onEnter('proposals')}
            onFollowUps={onOpenFollowUps}
          />
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[min(720px,92vw,72vh)] aspect-square">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="cmdCoreGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(186,230,253,0.55)" />
              <stop offset="40%" stopColor="rgba(56,189,248,0.22)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r="22" fill="url(#cmdCoreGlow)" />
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(125,211,252,0.45)" strokeWidth="0.22" />
          <circle
            cx={CX}
            cy={CY}
            r={R + 5}
            fill="none"
            stroke="rgba(186,230,253,0.4)"
            strokeWidth="0.16"
            strokeDasharray="1.6 2"
            className="cmd-orbit-fast"
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />
          <circle
            cx={CX}
            cy={CY}
            r={R + 8.5}
            fill="none"
            stroke="rgba(251,191,36,0.35)"
            strokeWidth="0.12"
            strokeDasharray="0.6 3.2"
            className="cmd-orbit-rev"
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          />
          {Array.from({ length: 36 }, (_, i) => {
            const a = (i / 36) * Math.PI * 2;
            const inner = 10.6;
            const outer = i % 6 === 0 ? 12.4 : 11.5;
            return (
              <line
                key={`tick-${i}`}
                x1={CX + inner * Math.cos(a)}
                y1={CY + inner * Math.sin(a)}
                x2={CX + outer * Math.cos(a)}
                y2={CY + outer * Math.sin(a)}
                stroke={i % 6 === 0 ? 'rgba(251,191,36,0.85)' : 'rgba(186,230,253,0.7)'}
                strokeWidth={i % 6 === 0 ? 0.22 : 0.12}
              />
            );
          })}
          <g className="cmd-orbit" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <circle cx={CX} cy={CY - (R + 5)} r="0.7" fill="#e0f2fe" />
            <circle cx={CX + (R + 5)} cy={CY} r="0.5" fill="#38bdf8" />
          </g>
          <g className="cmd-orbit-rev" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <circle cx={CX} cy={CY + (R + 8.5)} r="0.5" fill="#fbbf24" />
          </g>
          {visible.map((n) => {
            const p = polar(n.angle);
            return (
              <line
                key={n.id}
                className={n.match ? 'cmd-spoke' : undefined}
                x1={CX}
                y1={CY}
                x2={p.x}
                y2={p.y}
                stroke={n.match ? 'rgba(125,211,252,0.85)' : 'rgba(125,211,252,0.12)'}
                strokeWidth="0.28"
              />
            );
          })}
        </svg>

        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="cmd-hover-core relative size-44 md:size-48">
            <div className="absolute -inset-4 rounded-full bg-sky-300/20 cmd-core-aura" />
            <div className="absolute inset-0 rounded-full border-2 border-sky-200/80 cmd-core-ring" />
            <div className="absolute inset-2 rounded-full border border-amber-300/50 cmd-orbit-rev" />
            <div className="cmd-core-face absolute inset-4 rounded-full bg-gradient-to-b from-sky-200 to-sky-400 text-slate-900 shadow-[0_0_40px_rgba(186,230,253,0.85)] flex flex-col items-center justify-center text-center px-3">
              <span className="material-symbols-outlined text-sky-950 text-[30px] cmd-pulse">travel_explore</span>
              <div className="text-[10px] uppercase tracking-[0.18em] text-sky-900/80 mt-1">Core</div>
              <div className="text-sm font-bold text-slate-900">Savtrails</div>
              <div className="text-[10px] text-emerald-800 font-semibold mt-0.5 tracking-widest">ONLINE</div>
            </div>
          </div>
        </div>

        {visible.map((n, i) => {
          const p = polar(n.angle, 34);
          return (
            <div
              key={n.id}
              className="absolute z-30 -translate-x-1/2 -translate-y-1/2 hidden lg:block"
              style={{ left: `${p.x}%`, top: `${p.y}%` }}
            >
              <NodeCard
                icon={n.icon}
                label={n.label}
                stat={n.stat}
                dimmed={!n.match}
                delayMs={i * 70}
                badge={n.id === 'clients' ? unreadCount : undefined}
                onClick={() => (n.id === 'clients' && unreadCount > 0 && onOpenNewClients ? onOpenNewClients() : onEnter(n.id))}
              />
            </div>
          );
        })}
      </div>

      <div className="absolute z-20 lg:hidden left-4 right-4 top-[9.5rem] bottom-28 overflow-y-auto cmd-scroll grid grid-cols-2 gap-2 content-start">
        {visible
          .filter((n) => n.match)
          .map((n) => (
            <NodeCard
              key={`m-${n.id}`}
              icon={n.icon}
              label={n.label}
              stat={n.stat}
              badge={n.id === 'clients' ? unreadCount : undefined}
              onClick={() => (n.id === 'clients' && unreadCount > 0 && onOpenNewClients ? onOpenNewClients() : onEnter(n.id))}
            />
          ))}
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-full px-4 flex flex-col items-center">
        <CommandPalette value={query} onChange={onQuery} onEnter={onEnter} onOpenNewClients={onOpenNewClients} />
        <p className="text-center text-xs text-[#d5e2f2] mt-2">Visual mockup only — no backend, no live data</p>
      </div>
    </div>
  );
}
