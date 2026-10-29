import FollowUpSequenceEditor from '../components/FollowUpSequenceEditor';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';
import {
  formatUsd,
  mockAiBriefing,
  type MockClientRow,
  type MockEmailFormat,
  type MockFollowUpJob,
  type MockFollowUpSequence,
  type MockSalesSnapshot,
  type MockView,
} from '../mockData';

export default function AdminMock({
  onEnter,
  sales,
  formats,
  sequence,
  onSaveSequence,
  jobs,
  clients,
  dueCount,
  onAdvanceDay,
  onRunDue,
  onSendFollowUp,
  onSkipFollowUp,
  onOpenClient,
}: {
  onEnter: (v: Exclude<MockView, 'hub'>) => void;
  sales: MockSalesSnapshot;
  formats: MockEmailFormat[];
  sequence: MockFollowUpSequence;
  onSaveSequence: (next: MockFollowUpSequence) => void;
  jobs: MockFollowUpJob[];
  clients: MockClientRow[];
  dueCount: number;
  onAdvanceDay: () => void;
  onRunDue: () => void;
  onSendFollowUp: (id: string) => void;
  onSkipFollowUp: (id: string) => void;
  onOpenClient: (clientId: string) => void;
}) {
  const cards = [
    { icon: 'storefront', title: 'Providers catalog', desc: 'Partners, destinations, and published rates.', go: 'providers' as const },
    { icon: 'map', title: 'Itineraries', desc: 'Open the live trip workshop.', go: 'itineraries' as const },
    { icon: 'request_quote', title: 'Dashboard', desc: 'Return to the CRM itinerary workspace.', go: 'itineraries' as const },
  ];
  const queue = jobs
    .filter(
      (j) =>
        j.status === 'scheduled' ||
        j.status === 'due' ||
        j.status === 'sent' ||
        (j.status === 'cancelled' && Boolean(j.rewrittenFrom)),
    )
    .slice(0, 12);

  return (
    <div className="flex-1 overflow-y-auto cmd-scroll p-8 max-w-5xl mx-auto w-full space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="size-11 rounded-xl bg-[#137fec]/15 text-[#137fec] flex items-center justify-center">
            <span className="material-symbols-outlined">admin_panel_settings</span>
          </span>
          <div>
            <h2 className="text-2xl font-black">Admin</h2>
            <p className="text-sm text-[#d5e2f2]">Signed in as William Cohen · administrator</p>
          </div>
        </div>
        <HudButton icon="logout">Log out</HudButton>
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <HudPanel key={c.title}>
            <span className="size-10 rounded-lg bg-[#137fec]/15 text-[#137fec] flex items-center justify-center mb-3">
              <span className="material-symbols-outlined">{c.icon}</span>
            </span>
            <h3 className="font-bold">{c.title}</h3>
            <p className="text-sm text-[#d5e2f2] mt-1 mb-4">{c.desc}</p>
            <button type="button" className="text-sm text-[#137fec] font-semibold inline-flex items-center gap-1" onClick={() => onEnter(c.go)}>
              Open <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
          </HudPanel>
        ))}
      </div>
      <HudPanel title="System status" icon="monitoring">
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Stat k="API" v="Healthy" ok />
          <Stat k="Postgres" v="Persistent volume" ok />
          <Stat k="Auth0" v="Tenant ready" ok />
          <Stat k="Staging" v="Mirror of prod data" ok />
          <Stat k="Backups" v="Daily 07:00 UTC" ok />
          <Stat k="Follow-up scheduler" v={sequence.enabled ? `Scaffolded · ${dueCount} due` : 'Paused'} ok={sequence.enabled && dueCount === 0} />
        </div>
      </HudPanel>
      <HudPanel title="Automated follow-ups" icon="schedule">
        <div className="flex flex-wrap gap-2 mb-4">
          <HudButton icon="fast_forward" onClick={onAdvanceDay}>
            Advance 1 day
          </HudButton>
          <HudButton tone="primary" icon="send" onClick={onRunDue}>
            Send due now
          </HudButton>
        </div>
        <FollowUpSequenceEditor sequence={sequence} formats={formats} onChange={onSaveSequence} />
        <p className="text-[11px] uppercase tracking-wider text-[#d5e2f2] mt-5 mb-2">Queue</p>
        <div className="space-y-2">
          {queue.length === 0 ? (
            <p className="text-sm text-[#d5e2f2]">No follow-ups queued.</p>
          ) : (
            queue.map((job) => {
              const client = clients.find((c) => c.id === job.clientId);
              const fmt = formats.find((f) => f.id === job.formatId);
              return (
                <div key={job.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#263858] px-3 py-2 text-sm">
                  <button type="button" className="font-semibold text-left" onClick={() => onOpenClient(job.clientId)}>
                    {client ? `${client.first} ${client.last}` : job.clientId}
                  </button>
                  <span className="cmd-chip bg-sky-400/15 text-sky-200">{fmt?.name ?? job.formatId}</span>
                  <span
                    className={`cmd-chip ${
                      job.status === 'due'
                        ? 'bg-amber-400/20 text-amber-200'
                        : job.status === 'sent'
                          ? 'bg-emerald-400/15 text-emerald-200'
                          : job.status === 'cancelled'
                            ? 'bg-white/10 text-slate-300'
                            : 'bg-white/10 text-white'
                    }`}
                  >
                    {job.status === 'sent' || job.status === 'cancelled'
                      ? job.dueLabel
                      : `${job.status} · ${job.dueLabel} · ${job.origin}${job.rewrittenFrom ? ' · rewritten' : ''}`}
                  </span>
                  {job.status === 'due' || job.status === 'scheduled' ? (
                    <>
                      <HudButton onClick={() => onSendFollowUp(job.id)}>Send now</HudButton>
                      <HudButton onClick={() => onSkipFollowUp(job.id)}>Skip</HudButton>
                    </>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </HudPanel>
      <HudPanel title="Sales & email tracking" icon="monitoring">
        <p className="text-sm text-[#d5e2f2] mb-3">Future GET /metrics/sales and inbound email open/click webhooks. Same numbers feed the hub briefing.</p>
        <div className="grid sm:grid-cols-3 gap-3 text-sm">
          <Stat k="Conversion" v={`${sales.conversionPct}%`} ok />
          <Stat k="Month sales" v={formatUsd(sales.totalSalesMonth)} ok />
          <Stat k="YTD sales" v={formatUsd(sales.totalSalesYtd)} ok />
          <Stat k="Avg margin" v={`${sales.avgMarginPct}%`} ok />
          <Stat k="Email opens" v={String(sales.emailsOpened)} ok />
          <Stat k="Last briefing" v={mockAiBriefing.date} ok />
        </div>
      </HudPanel>
    </div>
  );
}

function Stat({ k, v, ok }: { k: string; v: string; ok: boolean }) {
  return (
    <div className="rounded-lg bg-[#263858] border border-[rgba(19,127,236,0.15)] p-3">
      <p className="text-[11px] uppercase tracking-widest text-[#d5e2f2]">{k}</p>
      <p className={`mt-1 font-semibold ${ok ? 'text-[#34d399]' : 'text-[#fbbf24]'}`}>{v}</p>
    </div>
  );
}
