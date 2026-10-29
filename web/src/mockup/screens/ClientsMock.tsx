import { useEffect, useMemo, useState, type ReactNode } from 'react';
import ClientEmailThread from '../components/ClientEmailThread';
import DataTable from '../components/DataTable';
import EmailFormatEditor from '../components/EmailFormatEditor';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';
import MockModal from '../components/MockModal';
import FollowUpSequenceEditor from '../components/FollowUpSequenceEditor';
import {
  mockJotformSpecs,
  type IntakeStatus,
  type MockClientRow,
  type MockEmailFormat,
  type MockEmailMessage,
  type MockFollowUpJob,
  type MockFollowUpSequence,
  type MockIntakeLead,
  type MockTrackedProposal,
} from '../mockData';

const statusLabel: Record<IntakeStatus, string> = {
  new: 'New',
  needs_review: 'Needs review',
  duplicate: 'Duplicate',
  accepted: 'Accepted',
  discarded: 'Discarded',
};

const statusTone: Record<IntakeStatus, string> = {
  new: 'bg-sky-400/20 text-sky-200',
  needs_review: 'bg-amber-400/20 text-amber-200',
  duplicate: 'bg-violet-400/20 text-violet-200',
  accepted: 'bg-emerald-400/20 text-emerald-200',
  discarded: 'bg-slate-500/20 text-slate-300',
};

type Filters = {
  form: string;
  itinerary: string;
  travel: string;
  pax: string;
  level: string;
  occupancy: string;
  tripType: string;
  status: string;
  search: string;
};

const emptyFilters: Filters = {
  form: '',
  itinerary: '',
  travel: 'any',
  pax: 'any',
  level: '',
  occupancy: '',
  tripType: '',
  status: '',
  search: '',
};

export default function ClientsMock({
  tab,
  onTab,
  clients,
  leads,
  initialFormFilter,
  selectedClientId,
  onSelectClient,
  onClearClient,
  messages,
  formats,
  tracked,
  focusMessageId,
  onSendEmail,
  onSimulateReply,
  onConfirmSale,
  onMarkLost,
  onSaveFormats,
  sequence,
  onSaveSequence,
  jobs,
  onScheduleEmail,
  onSendFollowUp,
  onSkipFollowUp,
  onUpdateJob,
  onAccept,
  onMerge,
  onDiscard,
  onNeedsReview,
  onSimulate,
}: {
  tab: 'roster' | 'new';
  onTab: (t: 'roster' | 'new') => void;
  clients: MockClientRow[];
  leads: MockIntakeLead[];
  initialFormFilter?: string;
  selectedClientId: string | null;
  onSelectClient: (id: string) => void;
  onClearClient: () => void;
  messages: MockEmailMessage[];
  formats: MockEmailFormat[];
  tracked: MockTrackedProposal[];
  focusMessageId?: string;
  onSendEmail: (clientId: string, draft: { subject: string; body: string; kind: 'note' | 'proposal' | 'followup' }) => void;
  onSimulateReply: (clientId: string) => void;
  onConfirmSale: (proposalId: string) => void;
  onMarkLost: (proposalId: string) => void;
  onSaveFormats: (next: MockEmailFormat[]) => void;
  sequence: MockFollowUpSequence;
  onSaveSequence: (next: MockFollowUpSequence) => void;
  jobs: MockFollowUpJob[];
  onScheduleEmail: (clientId: string, draft: { subject: string; body: string; delayDays: number; formatId: string }) => void;
  onSendFollowUp: (jobId: string) => void;
  onSkipFollowUp: (jobId: string) => void;
  onUpdateJob: (jobId: string, patch: Partial<MockFollowUpJob>) => void;
  onAccept: (id: string, draft: MockIntakeLead) => void;
  onMerge: (id: string) => void;
  onDiscard: (id: string) => void;
  onNeedsReview: (id: string) => void;
  onSimulate: () => void;
}) {
  const [openAdd, setOpenAdd] = useState(false);
  const [settings, setSettings] = useState(false);
  const [formatsOpen, setFormatsOpen] = useState(false);
  const [sequenceOpen, setSequenceOpen] = useState(false);
  const [discardId, setDiscardId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>({ ...emptyFilters, form: initialFormFilter ?? '' });
  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null;

  useEffect(() => {
    if (initialFormFilter) setFilters((s) => ({ ...s, form: initialFormFilter }));
  }, [initialFormFilter]);
  const [selectedId, setSelectedId] = useState(leads[0]?.id ?? '');
  const [draft, setDraft] = useState<MockIntakeLead | null>(leads[0] ?? null);
  const [payloadOpen, setPayloadOpen] = useState(false);
  const [bulk, setBulk] = useState<string[]>([]);

  const unread = leads.filter((l) => l.status === 'new' || l.status === 'needs_review' || l.status === 'duplicate').length;
  const roster = clients.filter((c) => `${c.first} ${c.last} ${c.email}`.toLowerCase().includes(q.toLowerCase()));

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (filters.form && l.formName !== filters.form) return false;
      if (filters.itinerary && l.itineraryTitle !== filters.itinerary) return false;
      if (filters.level && l.accommodationLevel !== filters.level) return false;
      if (filters.occupancy && l.occupancy !== filters.occupancy) return false;
      if (filters.tripType && l.tripType !== filters.tripType) return false;
      if (filters.status && l.status !== filters.status) return false;
      if (filters.pax !== 'any' && String(l.passengers) !== filters.pax) return false;
      if (filters.travel === 'tbd' && l.travelStartDate) return false;
      if (filters.travel === 'next90' && !l.travelStartDate) return false;
      if (filters.search) {
        const hay = `${l.firstName} ${l.lastName} ${l.email} ${l.formName}`.toLowerCase();
        if (!hay.includes(filters.search.toLowerCase())) return false;
      }
      return true;
    });
  }, [leads, filters]);

  const selected = filtered.find((l) => l.id === selectedId) ?? filtered[0] ?? null;

  function pick(lead: MockIntakeLead) {
    setSelectedId(lead.id);
    setDraft({ ...lead });
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-6 pt-5 pb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Clients</h2>
          <p className="text-sm text-[#d5e2f2]">Roster plus inbound Jotform leads.</p>
        </div>
        <div className="flex items-center gap-2">
          <HudButton icon="webhook" onClick={() => setSettings(true)}>
            Jotform source
          </HudButton>
          <HudButton icon="add_alert" onClick={onSimulate}>
            Simulate inbound
          </HudButton>
          {tab === 'roster' ? (
            <HudButton tone="primary" icon="person_add" onClick={() => setOpenAdd(true)}>
              Add Client
            </HudButton>
          ) : null}
        </div>
      </div>

      <div className="px-6 flex gap-1 border-b border-sky-400/20">
        <TabBtn active={tab === 'roster'} onClick={() => onTab('roster')}>
          Roster
        </TabBtn>
        <TabBtn active={tab === 'new'} onClick={() => onTab('new')}>
          New Clients
          {unread > 0 ? <span className="ml-2 min-w-5 h-5 px-1 rounded-full bg-sky-300 text-slate-900 text-[11px] font-bold inline-flex items-center justify-center">{unread}</span> : null}
        </TabBtn>
      </div>

      {tab === 'roster' && selectedClient ? (
        <ClientEmailThread
          client={selectedClient}
          messages={messages}
          formats={formats}
          tracked={tracked}
          jobs={jobs}
          sequence={sequence}
          focusMessageId={focusMessageId}
          onBack={onClearClient}
          onSend={(draft) => onSendEmail(selectedClient.id, draft)}
          onSchedule={(draft) => onScheduleEmail(selectedClient.id, draft)}
          onSimulateReply={() => onSimulateReply(selectedClient.id)}
          onConfirmSale={onConfirmSale}
          onMarkLost={onMarkLost}
          onEditFormats={() => setFormatsOpen(true)}
          onEditSequence={() => setSequenceOpen(true)}
          onSendFollowUp={onSendFollowUp}
          onSkipFollowUp={onSkipFollowUp}
          onUpdateJob={onUpdateJob}
        />
      ) : tab === 'roster' ? (
        <div className="flex-1 min-h-0 overflow-y-auto cmd-scroll p-6 space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 cmd-input !w-64">
              <span className="material-symbols-outlined text-[#d5e2f2]">search</span>
              <input className="bg-transparent border-none outline-none flex-1" placeholder="Search clients…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <span className="ml-auto text-sm text-[#d5e2f2]">{roster.length} Clients found · click a row for email history</span>
          </div>
          <HudPanel padded>
            <DataTable
              columns={['Client Name', 'Itinerary Interest', 'Travel Start', 'Pax', 'Follow-up', 'Added', '']}
              onRowClick={(i) => {
                const row = roster[i];
                if (row) onSelectClient(row.id);
              }}
              rows={roster.map((c) => [
                <div className="flex items-center gap-2">
                  <span className="size-9 rounded-full bg-[#137fec]/20 text-[#137fec] flex items-center justify-center text-xs font-bold">
                    {c.first[0]}
                    {c.last[0] ?? ''}
                  </span>
                  <div>
                    <p className="font-semibold">{c.first} {c.last}</p>
                    <p className="text-xs text-[#d5e2f2]">{c.email}</p>
                  </div>
                </div>,
                <span className="cmd-chip bg-[#137fec]/15 text-[#137fec]">{c.itinerary}</span>,
                c.start || 'Dates TBD',
                <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">group</span>{c.pax}</span>,
                (() => {
                  const next = jobs.find((j) => j.clientId === c.id && (j.status === 'due' || j.status === 'scheduled'));
                  return next ? <span className="cmd-chip bg-amber-400/15 text-amber-200">{next.dueLabel}</span> : '—';
                })(),
                <div>
                  <p className="text-xs text-[#d5e2f2]">{c.added}</p>
                  {c.fromIntake ? <span className="cmd-chip bg-sky-400/15 text-sky-200 mt-1">From Jotform</span> : null}
                </div>,
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenAdd(true);
                  }}
                >
                  <span className="material-symbols-outlined text-[18px] text-[#d5e2f2]">edit</span>
                </button>,
              ])}
              empty="No clients yet."
            />
          </HudPanel>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="px-6 py-3 flex flex-wrap gap-2 items-center border-b border-sky-400/10">
            <Filter label="Form" value={filters.form} onChange={(v) => setFilters((s) => ({ ...s, form: v }))} options={['', ...mockJotformSpecs.forms.map((f) => f.name)]} labels={{ '': 'All forms' }} />
            <Filter label="Trip interest" value={filters.itinerary} onChange={(v) => setFilters((s) => ({ ...s, itinerary: v }))} options={['', ...mockJotformSpecs.itineraries]} labels={{ '': 'Any trip' }} />
            <Filter label="Travel start" value={filters.travel} onChange={(v) => setFilters((s) => ({ ...s, travel: v }))} options={['any', 'next90', 'tbd']} labels={{ any: 'Any dates', next90: 'Has a start date', tbd: 'Dates TBD' }} />
            <Filter label="Pax" value={filters.pax} onChange={(v) => setFilters((s) => ({ ...s, pax: v }))} options={['any', '2', '4']} labels={{ any: 'Any pax' }} />
            <Filter label="Level" value={filters.level} onChange={(v) => setFilters((s) => ({ ...s, level: v }))} options={['', ...mockJotformSpecs.levels]} labels={{ '': 'Any level' }} />
            <Filter label="Occupancy" value={filters.occupancy} onChange={(v) => setFilters((s) => ({ ...s, occupancy: v }))} options={['', ...mockJotformSpecs.occupancy]} labels={{ '': 'Any occupancy' }} />
            <Filter label="Trip type" value={filters.tripType} onChange={(v) => setFilters((s) => ({ ...s, tripType: v }))} options={['', ...mockJotformSpecs.tripTypes]} labels={{ '': 'Any type' }} />
            <Filter label="Status" value={filters.status} onChange={(v) => setFilters((s) => ({ ...s, status: v }))} options={['', 'new', 'needs_review', 'duplicate', 'discarded']} labels={{ '': 'All statuses', new: 'New', needs_review: 'Needs review', duplicate: 'Duplicate', discarded: 'Discarded' }} />
            <input className="cmd-input !w-44" placeholder="Search leads…" value={filters.search} onChange={(e) => setFilters((s) => ({ ...s, search: e.target.value }))} />
            <button type="button" className="text-xs text-sky-300" onClick={() => setFilters(emptyFilters)}>Clear all</button>
            <span className="ml-auto text-sm text-[#e8f1fb]">{unread} new · matching {filtered.length}</span>
          </div>

          <div className="flex-1 min-h-0 grid lg:grid-cols-[320px_1fr]">
            <div className="border-r border-sky-400/15 overflow-y-auto cmd-scroll">
              {bulk.length > 0 ? (
                <div className="px-3 py-2 flex gap-2 border-b border-sky-400/15">
                  <HudButton onClick={() => bulk.forEach((id) => onAccept(id, leads.find((l) => l.id === id)!))}>Accept selected</HudButton>
                  <HudButton tone="danger" onClick={() => bulk.forEach(onDiscard)}>Discard</HudButton>
                </div>
              ) : null}
              {filtered.length === 0 ? (
                <p className="p-6 text-sm text-[#d5e2f2]">No leads match these Jotform specs.</p>
              ) : (
                filtered.map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => pick(l)}
                    className={`w-full text-left px-4 py-3 border-b border-sky-400/10 ${selected?.id === l.id ? 'bg-sky-400/10' : 'hover:bg-white/5'}`}
                  >
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={bulk.includes(l.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          setBulk((s) => (e.target.checked ? [...s, l.id] : s.filter((x) => x !== l.id)));
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold truncate">{l.firstName} {l.lastName || '(no last name)'}</p>
                          <span className={`cmd-chip ${statusTone[l.status]}`}>{statusLabel[l.status]}</span>
                        </div>
                        <p className="text-xs text-[#d5e2f2] truncate">{l.email}</p>
                        <p className="text-[11px] text-sky-300 mt-1">{l.formName} · {l.receivedLabel}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>

            <div className="overflow-y-auto cmd-scroll p-5">
              {!selected || !draft ? (
                <HudPanel>
                  <p className="text-sm text-[#d5e2f2]">All caught up. Simulate an inbound lead or wait for Jotform.</p>
                </HudPanel>
              ) : (
                <div className="space-y-4">
                  {selected.status === 'duplicate' || clients.some((c) => c.email === draft.email && selected.status !== 'accepted') ? (
                    <div className="rounded-xl border border-violet-400/40 bg-violet-500/10 px-4 py-3 text-sm">
                      This email already exists on the roster. Merge into the existing client, or create a new one.
                    </div>
                  ) : null}
                  <HudPanel title="Review lead" icon="person_search">
                    <div className="grid md:grid-cols-2 gap-3">
                      <Field label="First name" value={draft.firstName} onChange={(v) => setDraft({ ...draft, firstName: v })} />
                      <Field label="Last name" value={draft.lastName} onChange={(v) => setDraft({ ...draft, lastName: v })} />
                      <Field label="Email" value={draft.email} onChange={(v) => setDraft({ ...draft, email: v })} className="md:col-span-2" />
                      <label className="text-xs text-[#d5e2f2]">
                        Trip interest
                        <select className="cmd-select mt-1" value={draft.itineraryTitle} onChange={(e) => setDraft({ ...draft, itineraryTitle: e.target.value })}>
                          {mockJotformSpecs.itineraries.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <Field label="Travel start" value={draft.travelStartDate} onChange={(v) => setDraft({ ...draft, travelStartDate: v })} />
                      <Field label="Passengers" value={String(draft.passengers)} onChange={(v) => setDraft({ ...draft, passengers: Number(v) || 1 })} />
                      <label className="text-xs text-[#d5e2f2]">
                        Level
                        <select className="cmd-select mt-1" value={draft.accommodationLevel} onChange={(e) => setDraft({ ...draft, accommodationLevel: e.target.value })}>
                          {mockJotformSpecs.levels.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-[#d5e2f2]">
                        Occupancy
                        <select className="cmd-select mt-1" value={draft.occupancy} onChange={(e) => setDraft({ ...draft, occupancy: e.target.value })}>
                          {mockJotformSpecs.occupancy.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-[#d5e2f2]">
                        Trip type
                        <select className="cmd-select mt-1" value={draft.tripType} onChange={(e) => setDraft({ ...draft, tripType: e.target.value })}>
                          {mockJotformSpecs.tripTypes.map((t) => <option key={t}>{t}</option>)}
                        </select>
                      </label>
                      <label className="text-xs text-[#d5e2f2] md:col-span-2">
                        Notes
                        <textarea className="cmd-textarea mt-1 h-16" value={draft.notes} onChange={(e) => setDraft({ ...draft, notes: e.target.value })} />
                      </label>
                    </div>
                  </HudPanel>
                  <HudPanel title="Jotform source" icon="webhook">
                    <p className="text-sm">{selected.formName} · submission {selected.externalId}</p>
                    <p className="text-xs text-[#d5e2f2] mt-1">Received {selected.receivedLabel}</p>
                    <button type="button" className="text-xs text-sky-300 mt-2" onClick={() => setPayloadOpen((s) => !s)}>
                      {payloadOpen ? 'Hide' : 'Show'} sample payload
                    </button>
                    {payloadOpen ? (
                      <pre className="mt-2 text-xs bg-[#12203a] rounded-lg p-3 overflow-x-auto">{JSON.stringify({
                        formID: selected.formId,
                        submissionID: selected.externalId,
                        pretty: {
                          'Name.first': selected.firstName,
                          'Name.last': selected.lastName,
                          Email: selected.email,
                          'Trip interest': selected.itineraryTitle,
                        },
                      }, null, 2)}</pre>
                    ) : null}
                  </HudPanel>
                  <div className="flex flex-wrap gap-2">
                    <HudButton tone="primary" onClick={() => onAccept(selected.id, draft)}>Accept as client</HudButton>
                    <HudButton onClick={() => onMerge(selected.id)}>Merge into existing</HudButton>
                    <HudButton onClick={() => onNeedsReview(selected.id)}>Needs review</HudButton>
                    <HudButton tone="danger" onClick={() => setDiscardId(selected.id)}>Discard</HudButton>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <MockModal open={openAdd} title="Add New Client" onClose={() => setOpenAdd(false)} wide footer={<><HudButton onClick={() => setOpenAdd(false)}>Cancel</HudButton><HudButton tone="primary" onClick={() => setOpenAdd(false)}>Create Client</HudButton></>}>
        <div className="grid md:grid-cols-2 gap-3">
          <input className="cmd-input" placeholder="First name" defaultValue="Amelia" />
          <input className="cmd-input" placeholder="Last name" defaultValue="Hart" />
          <input className="cmd-input md:col-span-2" placeholder="Email" defaultValue="amelia.hart@example.com" />
        </div>
      </MockModal>

      <MockModal
        open={settings}
        title="Jotform webhook"
        onClose={() => setSettings(false)}
        wide
        footer={<HudButton onClick={() => setSettings(false)}>Done</HudButton>}
      >
        <div className="space-y-3 text-sm">
          <p>Source: Jotform · <span className="text-emerald-300">Online</span> · last ping {mockJotformSpecs.lastPing}</p>
          <p className="text-xs text-[#d5e2f2]">Jotform → Settings → Integrations → Webhooks → paste this URL</p>
          <div className="flex gap-2">
            <input className="cmd-input" readOnly value={mockJotformSpecs.webhookUrl} />
            <HudButton onClick={() => undefined}>Copy</HudButton>
          </div>
          <p className="text-xs uppercase tracking-wider text-[#d5e2f2] pt-2">Field map</p>
          {mockJotformSpecs.fieldMap.map((m) => (
            <div key={m.jotform} className="flex justify-between gap-3 text-xs border-b border-sky-400/10 py-1">
              <span>{m.jotform}</span>
              <span className="text-sky-300">{m.client}</span>
            </div>
          ))}
        </div>
      </MockModal>

      <MockModal
        open={!!discardId}
        title="Discard this lead?"
        onClose={() => setDiscardId(null)}
        footer={
          <>
            <HudButton onClick={() => setDiscardId(null)}>Cancel</HudButton>
            <HudButton tone="danger" onClick={() => { if (discardId) onDiscard(discardId); setDiscardId(null); }}>Discard</HudButton>
          </>
        }
      >
        This removes it from New Clients. You can still find it under the Discarded filter.
      </MockModal>

      <EmailFormatEditor open={formatsOpen} formats={formats} onClose={() => setFormatsOpen(false)} onSave={onSaveFormats} />
      <MockModal
        open={sequenceOpen}
        title="Automated follow-ups"
        onClose={() => setSequenceOpen(false)}
        wide
        footer={<HudButton tone="primary" onClick={() => setSequenceOpen(false)}>Done</HudButton>}
      >
        <FollowUpSequenceEditor sequence={sequence} formats={formats} onChange={onSaveSequence} />
      </MockModal>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-2 text-sm font-semibold border-b-2 ${active ? 'border-sky-300 text-white' : 'border-transparent text-[#d5e2f2]'}`}
    >
      {children}
    </button>
  );
}

function Filter({
  label,
  value,
  onChange,
  options,
  labels,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  labels?: Record<string, string>;
}) {
  return (
    <label className="text-[11px] text-[#d5e2f2]">
      {label}
      <select className="cmd-select mt-0.5 !w-auto min-w-[8rem]" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o || 'all'} value={o}>{labels?.[o] ?? o}</option>
        ))}
      </select>
    </label>
  );
}

function Field({ label, value, onChange, className = '' }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`text-xs text-[#d5e2f2] ${className}`}>
      {label}
      <input className="cmd-input mt-1" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
