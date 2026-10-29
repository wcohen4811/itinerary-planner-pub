import { useState } from 'react';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';
import MockModal from '../components/MockModal';
import DataTable from '../components/DataTable';
import {
  formatUsd,
  mockDrafts,
  mockFlights,
  mockItineraries,
  type MockClientRow,
  type MockFollowUpJob,
  type MockSalesSnapshot,
  type MockTrackedProposal,
} from '../mockData';

type Mode = 'selection' | 'editor' | 'send' | 'performance';

export default function ProposalsMock({
  clients,
  tracked,
  sales,
  onOpenTracked,
  onConfirmSale,
  onMarkLost,
  onSendProposal,
  jobs,
  onSendFollowUp,
}: {
  clients: MockClientRow[];
  tracked: MockTrackedProposal[];
  sales: MockSalesSnapshot;
  onOpenTracked: (row: MockTrackedProposal) => void;
  onConfirmSale: (id: string) => void;
  onMarkLost: (id: string) => void;
  onSendProposal: (clientId: string) => void;
  jobs: MockFollowUpJob[];
  onSendFollowUp: (id: string) => void;
}) {
  const [mode, setMode] = useState<Mode>('selection');
  const [saveOpen, setSaveOpen] = useState(false);
  const [split, setSplit] = useState(55);
  const [clientId, setClientId] = useState(clients[0]?.id ?? '');
  const client = clients.find((c) => c.id === clientId) ?? clients[0];

  if (mode === 'selection') {
    return (
      <div className="flex-1 overflow-y-auto cmd-scroll p-8 max-w-5xl mx-auto w-full space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black">Create Proposal</h2>
            <p className="text-[#d5e2f2] mt-1">Choose how you would like to start building your new travel itinerary.</p>
          </div>
          <HudButton icon="monitoring" onClick={() => setMode('performance')}>
            Sent & conversion
          </HudButton>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <Metric k="Conversion" v={`${sales.conversionPct}%`} />
          <Metric k="Sent" v={String(sales.proposalsSent)} />
          <Metric k="Avg margin" v={`${sales.avgMarginPct}%`} />
          <Metric k="Sales YTD" v={formatUsd(sales.totalSalesYtd)} />
        </div>
        <div className="grid lg:grid-cols-2 gap-5">
          <HudPanel>
            <div className="flex items-center gap-3 mb-3">
              <span className="size-12 rounded-xl bg-white/5 flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">add</span>
              </span>
              <h3 className="text-lg font-bold">Manual Creation</h3>
            </div>
            <p className="text-sm text-[#d5e2f2] mb-4">Build a custom proposal from a client, itinerary, and airfare quote.</p>
            <HudButton className="w-full" onClick={() => setMode('editor')}>
              Start Manual Draft
            </HudButton>
          </HudPanel>
          <HudPanel className="cmd-glow-strong">
            <div className="h-1 -mt-4 -mx-4 mb-4 rounded-t-xl bg-gradient-to-r from-[#137fec] to-purple-500" />
            <div className="flex items-center gap-3 mb-2">
              <span className="size-12 rounded-xl bg-[#137fec]/15 text-[#137fec] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
              </span>
              <div>
                <span className="cmd-chip bg-emerald-500/15 text-emerald-300">Recommended</span>
                <h3 className="text-lg font-bold">AI Agent Creation</h3>
              </div>
            </div>
            <textarea className="cmd-textarea h-20 mb-3" placeholder="e.g., 10 day honeymoon in Italy…" defaultValue="12-day Garden Route honeymoon, luxury lodges, private transfers." />
            <HudButton tone="primary" icon="auto_awesome" className="w-full" onClick={() => setMode('editor')}>
              Generate with AI
            </HudButton>
          </HudPanel>
        </div>
        <HudPanel title="Recent Drafts" icon="history" actions={<button type="button" className="text-xs text-[#137fec]">Refresh</button>}>
          <div className="divide-y divide-[rgba(19,127,236,0.12)]">
            {mockDrafts.map((d) => (
              <button key={d.title} type="button" className="cmd-hover-row w-full flex items-center justify-between py-3 text-left" onClick={() => setMode('editor')}>
                <div>
                  <p className="text-sm font-semibold">{d.title}</p>
                  <p className="text-xs text-[#d5e2f2]">Last updated {d.updated}</p>
                </div>
                <span className="material-symbols-outlined text-[#d5e2f2]">arrow_forward</span>
              </button>
            ))}
          </div>
        </HudPanel>
      </div>
    );
  }

  if (mode === 'performance') {
    return (
      <div className="flex-1 overflow-y-auto cmd-scroll p-6 space-y-4">
        <div className="flex items-center gap-3">
          <HudButton icon="arrow_back" onClick={() => setMode('selection')}>Back</HudButton>
          <div>
            <h2 className="text-2xl font-black">Sent proposals</h2>
            <p className="text-sm text-[#d5e2f2]">Email tracking, margin, booked sales, and automated follow-ups.</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-4 gap-3">
          <Metric k="Won / sent" v={`${sales.proposalsWon} / ${sales.proposalsSent}`} />
          <Metric k="Opens / clicks" v={`${sales.emailsOpened} / ${sales.emailsClicked}`} />
          <Metric k="Avg margin" v={`${sales.avgMarginPct}%`} />
          <Metric k="Booked this month" v={formatUsd(sales.totalSalesMonth)} />
        </div>
        <HudPanel title="Tracked sends" icon="mark_email_read">
          <p className="text-xs text-[#d5e2f2] mb-3">Click a row to open that client’s email history.</p>
          <DataTable
            columns={['Proposal', 'Client', 'Sent', 'Email', 'Follow-up', 'Quoted', 'Margin', 'Booked', 'Sale']}
            onRowClick={(i) => {
              const row = tracked[i];
              if (row) onOpenTracked(row);
            }}
            rows={tracked.map((p) => [
              p.title,
              p.client,
              p.sentAt,
              <span className="cmd-chip bg-sky-400/15 text-sky-200">{p.status} · {p.opens} open · {p.clicks} click</span>,
              (() => {
                const fu = jobs.find((j) => j.proposalId === p.id && (j.status === 'due' || j.status === 'scheduled'));
                if (!fu) return '—';
                return (
                  <button
                    type="button"
                    className="text-xs text-amber-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSendFollowUp(fu.id);
                    }}
                  >
                    {fu.dueLabel} · send
                  </button>
                );
              })(),
              formatUsd(p.quotedUsd),
              `${p.marginPct}%`,
              p.bookedUsd ? formatUsd(p.bookedUsd) : '—',
              <div className="flex gap-1">
                <button
                  type="button"
                  className="text-xs text-emerald-300"
                  onClick={(e) => {
                    e.stopPropagation();
                    onConfirmSale(p.id);
                  }}
                >
                  Confirm
                </button>
                <button
                  type="button"
                  className="text-xs text-[#d5e2f2]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkLost(p.id);
                  }}
                >
                  Lost
                </button>
              </div>,
            ])}
          />
        </HudPanel>
      </div>
    );
  }

  if (mode === 'send') {
    return (
      <div className="flex-1 min-h-0 flex flex-col">
        <header className="px-5 py-3 border-b border-[rgba(19,127,236,0.2)] bg-[#2a3d64] space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <HudButton icon="arrow_back" onClick={() => setMode('editor')}>
              Back
            </HudButton>
            <h2 className="font-bold flex-1">Sending Proposal to {client ? `${client.first} ${client.last}` : 'client'}</h2>
            <HudButton icon="experiment">Send Test Email</HudButton>
            <HudButton tone="primary" icon="send" onClick={() => client && onSendProposal(client.id)}>
              Send Email
            </HudButton>
            <span className="text-xs text-[#d5e2f2]">Tracking pixel + follow-up sequence will attach after send.</span>
          </div>
          <div className="grid md:grid-cols-4 gap-2">
            <input className="cmd-input" defaultValue="Your Garden Route honeymoon proposal" />
            <input className="cmd-input" defaultValue="hello@savtrails.com" />
            <input className="cmd-input" defaultValue={client?.email ?? ''} />
            <input className="cmd-input" placeholder="CC (comma-separated)" />
          </div>
        </header>
        <div className="flex-1 overflow-y-auto cmd-scroll p-6">
          <div className="max-w-4xl mx-auto rounded-xl bg-[#f8fafc] text-[#111418] p-8 grid md:grid-cols-[1.6fr_1fr] gap-6">
            <div className="space-y-4 text-sm">
              <p className="italic">Dear Amelia — a tailored Garden Route for two, November 12.</p>
              <div className="rounded-lg bg-blue-50 p-3">
                <div className="font-bold flex items-center gap-2">Flight itinerary · $2,180 pp</div>
                {mockFlights.map((f) => (
                  <p key={f.time}>{f.airline} {f.from} → {f.to} · {f.time}</p>
                ))}
              </div>
              <div>
                <p className="font-bold mb-2">Itinerary highlights</p>
                {['Arrival in Cape Town', 'Table Mountain & City', 'Cape Peninsula'].map((t, i) => (
                  <p key={t} className="border-l-2 border-[#137fec] pl-3 py-1">Day {i + 1} — {t}</p>
                ))}
              </div>
            </div>
            <aside className="rounded-xl bg-slate-50 p-4 text-sm space-y-3">
              <p className="font-bold text-emerald-700">What’s Included</p>
              <ul className="list-disc pl-4 text-slate-600">
                <li>Lodging & breakfast</li>
                <li>Private transfers</li>
                <li>Guided peninsula day</li>
              </ul>
              <p className="font-bold text-slate-500">Not Included</p>
              <ul className="list-disc pl-4 text-slate-500">
                <li>International flights (quoted separately)</li>
              </ul>
              <div className="rounded-lg bg-white p-3 border">
                <p className="text-xs uppercase text-slate-400">Total investment</p>
                <p className="text-2xl font-black text-[#137fec]">$6,740 pp</p>
                <p className="text-xs">Total for 2 Pax: $13,480</p>
              </div>
              <button type="button" className="w-full bg-[#137fec] text-white font-black py-2 rounded-lg text-xs tracking-widest">
                RESERVE THIS TRIP
              </button>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <header className="h-14 shrink-0 flex items-center gap-3 px-4 border-b border-[rgba(19,127,236,0.2)] bg-[#2a3d64]">
        <HudButton icon="arrow_back" onClick={() => setMode('selection')}>
          Back
        </HudButton>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">Proposal Editor: Amelia's Trip to Garden Route</p>
          <p className="text-[11px] text-[#d5e2f2]">
            Drafting for <span className="cmd-chip bg-[#137fec]/20 text-[#137fec]">{client ? `${client.first} ${client.last}` : '—'}</span>
          </p>
        </div>
        <HudButton icon="picture_as_pdf">Save as PDF</HudButton>
        <HudButton icon="save" onClick={() => setSaveOpen(true)}>
          Save Proposal
        </HudButton>
        <HudButton tone="primary" icon="send" onClick={() => setMode('send')}>
          Send Proposal
        </HudButton>
      </header>
      <div className="flex-1 min-h-0 flex">
        <div className="overflow-y-auto cmd-scroll p-4 space-y-3" style={{ width: `${split}%` }}>
          <HudPanel title="Lead & Configuration" icon="person_search">
            <div className="grid md:grid-cols-2 gap-3">
              <select className="cmd-select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.first} {c.last}</option>
                ))}
              </select>
              <input className="cmd-input" defaultValue="William Cohen" />
              <input className="cmd-input" defaultValue="2" />
              <input type="date" className="cmd-input" defaultValue="2026-11-12" />
              <select className="cmd-select md:col-span-2">
                {mockItineraries.map((i) => (
                  <option key={i.id}>{i.title} ({i.days} days)</option>
                ))}
              </select>
            </div>
          </HudPanel>
          <HudPanel title="Personalized Message" icon="edit_note" actions={<HudButton icon="auto_awesome">Generate</HudButton>}>
            <textarea className="cmd-textarea h-28" defaultValue="Dear Amelia — I put together a Garden Route that keeps the pace unhurried and the lodges exceptional…" />
          </HudPanel>
          <HudPanel title="Airfare Quote" icon="flight">
            <textarea className="cmd-textarea h-16 font-mono text-xs mb-2" placeholder="Paste raw GDS flight data here" />
            <div className="flex items-center gap-2 mb-2">
              <HudButton icon="table_view">Format</HudButton>
              <input className="cmd-input max-w-[140px]" defaultValue="2180" />
            </div>
            {mockFlights.map((f) => (
              <div key={f.time} className="flex items-center gap-3 py-1.5 text-sm">
                <span className="size-6 rounded bg-red-800 text-white text-[10px] flex items-center justify-center">{f.airline}</span>
                <span>{f.from} → {f.to}</span>
                <span className="text-[#d5e2f2]">{f.time}</span>
              </div>
            ))}
          </HudPanel>
          <HudPanel title="Pricing Summary" icon="payments">
            <select className="cmd-select mb-3">
              <option>5 Star · double</option>
              <option>Deluxe · double</option>
            </select>
            <p className="text-sm">Base itinerary $4,560</p>
            <label className="block text-xs text-[#d5e2f2] mt-2">
              Margin 12%
              <input type="range" className="w-full accent-[#137fec]" defaultValue={12} />
            </label>
            <label className="block text-xs text-[#d5e2f2]">
              Discount 5%
              <input type="range" className="w-full accent-[#137fec]" defaultValue={5} />
            </label>
            <p className="text-2xl font-black text-[#137fec] mt-2">$6,740 pp</p>
            <p className="text-xs text-[#d5e2f2] mt-2">Quoted $13,480 · target margin feeds booked sales on win. Month {formatUsd(sales.totalSalesMonth)} · avg {sales.avgMarginPct}%.</p>
          </HudPanel>
        </div>
        <div
          className="w-2 cursor-col-resize bg-[rgba(19,127,236,0.15)] hover:bg-[#137fec]/40"
          onMouseDown={(e) => {
            const startX = e.clientX;
            const start = split;
            const move = (ev: MouseEvent) => {
              const dx = ((ev.clientX - startX) / window.innerWidth) * 100;
              setSplit(Math.min(70, Math.max(35, start + dx)));
            };
            const up = () => {
              window.removeEventListener('mousemove', move);
              window.removeEventListener('mouseup', up);
            };
            window.addEventListener('mousemove', move);
            window.addEventListener('mouseup', up);
          }}
        />
        <div className="flex-1 overflow-y-auto cmd-scroll bg-[#0a1016] p-4">
          <p className="text-[11px] uppercase tracking-widest text-[#d5e2f2] mb-3 flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">visibility</span> Live Client View
          </p>
          <div className="bg-white text-[#111418] min-h-[640px] rounded-sm shadow-xl p-8 space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">SA Vacations</p>
                <p className="font-black text-xl">Garden Route Honeymoon</p>
              </div>
              <p className="text-xs text-slate-500">Prepared by William Cohen</p>
            </div>
            <p className="italic text-slate-600">Dear Amelia — a tailored Garden Route for two…</p>
            <div className="bg-blue-50/80 p-3 rounded">
              {mockFlights.map((f) => (
                <p key={f.time} className="text-sm">{f.from} → {f.to} · {f.time}</p>
              ))}
            </div>
            <div className="border-t pt-3">
              <p className="text-xs uppercase text-slate-400">Final total</p>
              <p className="text-3xl font-black text-[#137fec]">$6,740 pp</p>
            </div>
          </div>
        </div>
      </div>
      <MockModal
        open={saveOpen}
        title="Saving Proposal"
        onClose={() => setSaveOpen(false)}
        footer={
          <HudButton tone="primary" onClick={() => setSaveOpen(false)}>
            Confirm
          </HudButton>
        }
      >
        Draft stored. This mock does not persist.
      </MockModal>
    </div>
  );
}

function Metric({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-xl bg-[#1e2d4a] border border-sky-400/20 px-3 py-3">
      <p className="text-[11px] uppercase tracking-wider text-[#d5e2f2]">{k}</p>
      <p className="text-lg font-bold mt-0.5">{v}</p>
    </div>
  );
}
