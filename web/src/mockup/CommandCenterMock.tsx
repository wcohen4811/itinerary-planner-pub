import { useMemo, useState } from 'react';
import './mockup.css';
import CommandHub from './hub/CommandHub';
import StatusBar from './components/StatusBar';
import ItinerariesMock from './screens/ItinerariesMock';
import PricingLibraryMock from './screens/PricingLibraryMock';
import ProposalsMock from './screens/ProposalsMock';
import ClientsMock from './screens/ClientsMock';
import ProvidersMock from './screens/ProvidersMock';
import AdminMock from './screens/AdminMock';
import SystemMock from './screens/SystemMock';
import {
  advanceFollowUpJobs,
  applyEmailTokens,
  applyManualFollowUp,
  applySaleStatus,
  clientFromLead,
  createInquiryMessage,
  createSimulatedLead,
  dueFollowUps,
  followUpDueLabel,
  formatUsd,
  jobsFromSequence,
  pendingFollowUps,
  mockAiBriefing,
  mockClients,
  mockTrackedProposals,
  rollupSales,
  salesLine,
  seedEmailFormats,
  seedEmailMessages,
  seedFollowUpJobs,
  seedFollowUpSequence,
  seedIntakeLeads,
  seedNotifications,
  unreadIntakeCount,
  type MockEmailMessage,
  type MockFollowUpJob,
  type MockNotification,
  type MockTrackedProposal,
  type MockView,
} from './mockData';

const crumbs: Record<MockView, string> = {
  hub: '/ CORE',
  itineraries: '/ ITINERARIES',
  pricing: '/ PRICING LIBRARY',
  proposals: '/ PROPOSALS',
  clients: '/ CLIENTS',
  providers: '/ PROVIDERS',
  admin: '/ ADMIN',
  system: '/ SYSTEM',
};

export default function CommandCenterMock() {
  const [view, setView] = useState<MockView>('hub');
  const [query, setQuery] = useState('');
  const [clientsTab, setClientsTab] = useState<'roster' | 'new'>('roster');
  const [formFilter, setFormFilter] = useState('');
  const [clients, setClients] = useState(mockClients);
  const [leads, setLeads] = useState(seedIntakeLeads);
  const [notes, setNotes] = useState<MockNotification[]>(seedNotifications);
  const [formats, setFormats] = useState(seedEmailFormats);
  const [messages, setMessages] = useState(seedEmailMessages);
  const [tracked, setTracked] = useState(mockTrackedProposals);
  const [sequence, setSequence] = useState(seedFollowUpSequence);
  const [jobs, setJobs] = useState(seedFollowUpJobs);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [focusMessageId, setFocusMessageId] = useState<string | undefined>();
  const [toast, setToast] = useState<{ title: string; detail?: string } | null>(null);
  const [simN, setSimN] = useState(1);

  const unread = useMemo(() => unreadIntakeCount(leads), [leads]);
  const sales = useMemo(() => rollupSales(tracked), [tracked]);
  const dueJobs = useMemo(() => dueFollowUps(jobs), [jobs]);
  const briefing = useMemo(
    () => ({
      ...mockAiBriefing,
      salesLine: salesLine(sales),
      body:
        dueJobs.length > 0
          ? `${mockAiBriefing.body} ${dueJobs.length} proposal follow-up${dueJobs.length === 1 ? '' : 's'} ${dueJobs.length === 1 ? 'is' : 'are'} due today.`
          : mockAiBriefing.body,
    }),
    [sales, dueJobs.length],
  );
  const bellCount = unread + notes.filter((n) => n.kind === 'followup' && !n.read).length;

  const enter = (next: Exclude<MockView, 'hub'>) => setView(next);

  function flash(title: string, detail?: string) {
    setToast({ title, detail });
    window.setTimeout(() => setToast(null), 2800);
  }

  function openNewClients(formName?: string) {
    setFormFilter(formName ?? '');
    setSelectedClientId(null);
    setClientsTab('new');
    setView('clients');
  }

  function openClientThread(clientId: string, messageId?: string) {
    setSelectedClientId(clientId);
    setFocusMessageId(messageId);
    setClientsTab('roster');
    setView('clients');
  }

  function acceptLead(id: string, draft: (typeof seedIntakeLeads)[number]) {
    const newId = `cl-${draft.email.split('@')[0].replace(/[^a-z0-9]+/gi, '-')}-${Date.now()}`;
    setLeads((s) => s.map((l) => (l.id === id ? { ...draft, status: 'accepted' } : l)));
    setClients((s) => [clientFromLead(draft, newId), ...s]);
    setMessages((s) => [createInquiryMessage(newId, draft), ...s]);
    setNotes((s) => s.map((n) => (n.leadId === id ? { ...n, read: true } : n)));
    flash(`${draft.firstName} added to roster`, 'Inquiry copied into their email thread');
  }

  function mergeLead(id: string) {
    const lead = leads.find((l) => l.id === id);
    const existing = lead ? clients.find((c) => c.email === lead.email) : undefined;
    setLeads((s) => s.map((l) => (l.id === id ? { ...l, status: 'accepted' } : l)));
    if (lead && existing) setMessages((s) => [createInquiryMessage(existing.id, lead), ...s]);
    setNotes((s) => s.map((n) => (n.leadId === id ? { ...n, read: true } : n)));
    flash('Merged into existing client', existing ? 'Added to their email thread' : undefined);
  }

  function discardLead(id: string) {
    setLeads((s) => s.map((l) => (l.id === id ? { ...l, status: 'discarded' } : l)));
    setNotes((s) => s.map((n) => (n.leadId === id ? { ...n, read: true } : n)));
  }

  function needsReview(id: string) {
    setLeads((s) => s.map((l) => (l.id === id ? { ...l, status: 'needs_review' } : l)));
  }

  function simulate() {
    const lead = createSimulatedLead(simN);
    setSimN((n) => n + 1);
    setLeads((s) => [lead, ...s]);
    setNotes((s) => [
      {
        id: `n-sim-${lead.id}`,
        leadId: lead.id,
        title: `${lead.firstName} ${lead.lastName} submitted ${lead.formName}`,
        detail: `${lead.itineraryTitle} · ${lead.passengers} pax`,
        time: 'just now',
        read: false,
        formName: lead.formName,
      },
      ...s,
    ]);
    flash('New client from Jotform', `${unread + 1} waiting in New Clients`);
  }

  function sendClientEmail(clientId: string, draft: { subject: string; body: string; kind: 'note' | 'proposal' | 'followup' }) {
    const client = clients.find((c) => c.id === clientId);
    const msgId = `em-${Date.now()}`;
    const proposalId = draft.kind === 'proposal' ? `pr-${Date.now()}` : undefined;
    const linkedProposal = tracked.find((p) => p.clientId === clientId);
    const msg: MockEmailMessage = {
      id: msgId,
      clientId,
      dir: 'out',
      kind: draft.kind,
      subject: draft.subject,
      body: draft.body,
      at: 'just now',
      proposalId: proposalId ?? linkedProposal?.id,
      tracking: draft.kind === 'proposal' ? 'sent' : draft.kind === 'followup' ? 'sent' : undefined,
      origin: draft.kind === 'followup' ? 'manual' : undefined,
    };
    setMessages((s) => [...s, msg]);
    if (draft.kind === 'followup') {
      setJobs((s) =>
        applyManualFollowUp(s, {
          clientId,
          proposalId: linkedProposal?.id,
          messageId: msgId,
          mode: sequence.onManual,
        }),
      );
      flash(
        'Manual follow-up sent',
        sequence.onManual === 'cancel' ? 'Remaining auto follow-ups cancelled' : 'Remaining auto steps rewritten from this message',
      );
      setFocusMessageId(msgId);
      return;
    }
    if (draft.kind === 'proposal' && client && proposalId) {
      const prev = tracked.find((p) => p.clientId === clientId);
      setTracked((s) => [
        ...s,
        {
          id: proposalId,
          title: draft.subject,
          client: `${client.first} ${client.last}`,
          clientId,
          messageId: msgId,
          sentAt: 'just now',
          status: 'sent',
          opens: 0,
          clicks: 0,
          quotedUsd: prev?.quotedUsd ?? 10000,
          marginPct: prev?.marginPct ?? 16,
          bookedUsd: 0,
        },
      ]);
      if (sequence.enabled) {
        const created: MockTrackedProposal = {
          id: proposalId,
          title: draft.subject,
          client: `${client.first} ${client.last}`,
          clientId,
          messageId: msgId,
          sentAt: 'just now',
          status: 'sent',
          opens: 0,
          clicks: 0,
          quotedUsd: prev?.quotedUsd ?? 10000,
          marginPct: prev?.marginPct ?? 16,
          bookedUsd: 0,
        };
        setJobs((s) => [...s, ...jobsFromSequence(sequence, created, clientId)]);
      }
    }
    setFocusMessageId(msgId);
    flash('Email sent', 'Logged on the client thread');
  }

  function simulateReply(clientId: string) {
    const id = `em-in-${Date.now()}`;
    setMessages((s) => [
      ...s,
      {
        id,
        clientId,
        dir: 'in',
        kind: 'note',
        subject: 'Re: your note',
        body: 'Thanks — we’ll look this over tonight and reply properly tomorrow.',
        at: 'just now',
      },
    ]);
    setFocusMessageId(id);
    if (sequence.cancelOnReply) {
      setJobs((s) =>
        s.map((j) =>
          j.clientId === clientId && (j.status === 'scheduled' || j.status === 'due')
            ? { ...j, status: 'cancelled', dueLabel: 'cancelled' }
            : j,
        ),
      );
    }
  }

  function setSale(proposalId: string, status: 'won' | 'lost') {
    const current = tracked.find((p) => p.id === proposalId);
    setTracked((s) => s.map((p) => (p.id === proposalId ? applySaleStatus(p, status) : p)));
    if (sequence.cancelOnSale) {
      setJobs((s) =>
        s.map((j) =>
          j.proposalId === proposalId && (j.status === 'scheduled' || j.status === 'due')
            ? { ...j, status: 'cancelled', dueLabel: 'cancelled' }
            : j,
        ),
      );
    }
    if (status === 'won') flash(`Sale confirmed — ${formatUsd(current?.quotedUsd ?? 0)} booked`);
    else flash('Proposal marked not sold');
  }

  function scheduleEmail(clientId: string, draft: { subject: string; body: string; delayDays: number; formatId: string }) {
    const proposal = tracked.find((p) => p.clientId === clientId);
    const dueInDays = draft.delayDays;
    const next = pendingFollowUps(jobs, clientId, proposal?.id)[0];
    const patch: MockFollowUpJob = {
      id: next?.id ?? `fu-manual-${Date.now()}`,
      clientId,
      proposalId: proposal?.id,
      stepId: next?.stepId ?? 'manual',
      formatId: draft.formatId,
      delayDays: dueInDays,
      dueInDays,
      dueLabel: followUpDueLabel(dueInDays),
      status: dueInDays <= 0 ? 'due' : 'scheduled',
      subject: draft.subject,
      body: draft.body,
      auto: false,
      origin: 'manual',
    };
    setJobs((s) => (next ? s.map((j) => (j.id === next.id ? { ...j, ...patch, id: next.id } : j)) : [...s, patch]));
    flash('Manual follow-up scheduled', next ? `Replaced next auto step · ${followUpDueLabel(dueInDays)}` : followUpDueLabel(dueInDays));
  }

  function sendFollowUpJob(jobId: string, auto = false) {
    const job = jobs.find((j) => j.id === jobId);
    const client = clients.find((c) => c.id === job?.clientId);
    if (!job || !client) return;
    const fmt = formats.find((f) => f.id === job.formatId);
    const proposal = tracked.find((p) => p.id === job.proposalId);
    const vars = { firstName: client.first, itinerary: client.itinerary, quoted: formatUsd(proposal?.quotedUsd ?? 0) };
    const subject = job.subject ?? (fmt ? applyEmailTokens(fmt.subject, vars) : 'Follow-up');
    const body = job.body ?? (fmt ? applyEmailTokens(fmt.body, vars) : '');
    const msgId = `em-fu-${Date.now()}-${jobId}`;
    setMessages((s) => [
      ...s,
      {
        id: msgId,
        clientId: client.id,
        dir: 'out',
        kind: 'followup',
        subject,
        body,
        at: auto ? 'auto-sent just now' : 'just now',
        proposalId: job.proposalId,
        tracking: 'sent',
        origin: auto ? 'auto' : 'manual',
      },
    ]);
    if (auto) {
      setJobs((s) => s.map((j) => (j.id === jobId ? { ...j, status: 'sent', sentBy: 'auto', dueLabel: 'sent · auto' } : j)));
      flash('Follow-up auto-sent', `${client.first} ${client.last}`);
    } else {
      setJobs((s) =>
        applyManualFollowUp(s, {
          clientId: client.id,
          proposalId: job.proposalId,
          consumedId: jobId,
          messageId: msgId,
          mode: sequence.onManual,
        }),
      );
      flash(
        'Manual follow-up sent',
        sequence.onManual === 'cancel' ? 'Remaining auto follow-ups cancelled' : 'Remaining auto steps rewritten from this message',
      );
    }
    setNotes((s) => s.map((n) => (n.kind === 'followup' && n.clientId === client.id ? { ...n, read: true } : n)));
    setFocusMessageId(msgId);
  }

  function skipFollowUp(jobId: string) {
    setJobs((s) => s.map((j) => (j.id === jobId ? { ...j, status: 'skipped', dueLabel: 'skipped' } : j)));
    flash('Follow-up skipped');
  }

  function updateJob(jobId: string, patch: Partial<MockFollowUpJob>) {
    setJobs((s) =>
      s.map((j) => {
        if (j.id !== jobId) return j;
        const next = { ...j, ...patch };
        if (patch.dueInDays != null) next.dueLabel = followUpDueLabel(patch.dueInDays);
        return next;
      }),
    );
  }

  function runDueFollowUps() {
    const due = dueFollowUps(jobs);
    if (!due.length) {
      flash('No follow-ups due');
      return;
    }
    due.forEach((job, i) => {
      window.setTimeout(() => sendFollowUpJob(job.id, true), i * 40);
    });
    flash(`Auto-sent ${due.length} follow-up${due.length === 1 ? '' : 's'}`);
  }

  function advanceDay() {
    setJobs((s) => advanceFollowUpJobs(s));
    const next = dueFollowUps(advanceFollowUpJobs(jobs));
    flash('Advanced 1 day', next.length ? `${next.length} follow-up${next.length === 1 ? '' : 's'} due` : 'Nothing due yet');
  }

  function sendProposalEmail(clientId: string) {
    const client = clients.find((c) => c.id === clientId) ?? clients[0];
    if (!client) return;
    const msgId = `em-${Date.now()}`;
    const proposalId = `pr-${Date.now()}`;
    const quotedUsd = 13480;
    setMessages((s) => [
      ...s,
      {
        id: msgId,
        clientId: client.id,
        dir: 'out',
        kind: 'proposal',
        subject: `${client.first}'s ${client.itinerary} proposal`,
        body: `Hi ${client.first},\n\nProposal attached — ${formatUsd(quotedUsd)}. Tracking pixel will attach after send.`,
        at: 'just now',
        proposalId,
        tracking: 'sent',
      },
    ]);
    setTracked((s) => [
      ...s,
      {
        id: proposalId,
        title: `${client.first}'s Trip to ${client.itinerary}`,
        client: `${client.first} ${client.last}`,
        clientId: client.id,
        messageId: msgId,
        sentAt: 'just now',
        status: 'sent',
        opens: 0,
        clicks: 0,
        quotedUsd,
        marginPct: 16,
        bookedUsd: 0,
      },
    ]);
    if (sequence.enabled) {
      const created: MockTrackedProposal = {
        id: proposalId,
        title: `${client.first}'s Trip to ${client.itinerary}`,
        client: `${client.first} ${client.last}`,
        clientId: client.id,
        messageId: msgId,
        sentAt: 'just now',
        status: 'sent',
        opens: 0,
        clicks: 0,
        quotedUsd,
        marginPct: 16,
        bookedUsd: 0,
      };
      setJobs((s) => [...s, ...jobsFromSequence(sequence, created, client.id)]);
    }
    flash('Proposal sent — follow-ups queued', sequence.enabled ? `${sequence.steps.filter((x) => x.enabled).length} auto steps` : undefined);
    openClientThread(client.id, msgId);
  }

  return (
    <div className="cmd-root cmd-void h-screen w-screen overflow-hidden flex flex-col relative">
      <div className={view === 'hub' ? 'absolute top-0 left-0 right-0 z-50' : ''}>
        <StatusBar
          key={view}
          crumb={crumbs[view]}
          onHome={() => setView('hub')}
          unreadCount={bellCount}
          notifications={notes}
          onMarkAllRead={() => setNotes((s) => s.map((n) => ({ ...n, read: true })))}
          onOpenNotification={(item) => {
            if (item.kind === 'followup' && item.clientId) openClientThread(item.clientId);
            else openNewClients(item.formName);
          }}
        />
      </div>
      {view !== 'hub' ? (
        <nav className="flex items-center gap-1 px-3 py-1.5 border-b border-[rgba(19,127,236,0.28)] overflow-x-auto cmd-scroll text-sm text-[#e8f1fb] bg-[#1e2d4a]">
          {(
            [
              ['itineraries', 'Itineraries'],
              ['pricing', 'Pricing'],
              ['proposals', 'Proposals'],
              ['clients', 'Clients'],
              ['providers', 'Providers'],
              ['admin', 'Admin'],
              ['system', 'System'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setView(id)}
              className={`cmd-hover-nav px-2 py-1 rounded ${view === id ? 'text-[#137fec] bg-[#137fec]/10' : ''}`}
            >
              {label}
              {id === 'clients' && unread > 0 ? (
                <span className="ml-1.5 min-w-4 h-4 px-1 rounded-full bg-sky-300 text-slate-900 text-[10px] font-bold inline-flex items-center justify-center">{unread}</span>
              ) : null}
            </button>
          ))}
        </nav>
      ) : null}
      <div key={view} className={`flex-1 min-h-0 flex flex-col cmd-fade-in ${view === 'hub' ? 'relative' : ''}`}>
        {view === 'hub' ? (
          <CommandHub
            query={query}
            onQuery={setQuery}
            onEnter={enter}
            onOpenNewClients={() => openNewClients()}
            unreadCount={unread}
            sales={sales}
            briefing={briefing}
            followUpsDue={dueJobs.length}
            onOpenFollowUps={() => {
              const first = dueJobs[0];
              if (first) openClientThread(first.clientId);
              else enter('admin');
            }}
          />
        ) : null}
        {view === 'itineraries' ? <ItinerariesMock onOpenPricing={() => setView('pricing')} /> : null}
        {view === 'pricing' ? <PricingLibraryMock onBack={() => setView('itineraries')} sales={sales} /> : null}
        {view === 'proposals' ? (
          <ProposalsMock
            clients={clients}
            tracked={tracked}
            sales={sales}
            jobs={jobs}
            onOpenTracked={(row) => openClientThread(row.clientId, row.messageId)}
            onConfirmSale={(id) => setSale(id, 'won')}
            onMarkLost={(id) => setSale(id, 'lost')}
            onSendProposal={sendProposalEmail}
            onSendFollowUp={sendFollowUpJob}
          />
        ) : null}
        {view === 'clients' ? (
          <ClientsMock
            tab={clientsTab}
            onTab={(t) => {
              setClientsTab(t);
              if (t === 'new') setSelectedClientId(null);
            }}
            clients={clients}
            leads={leads}
            initialFormFilter={formFilter}
            selectedClientId={selectedClientId}
            onSelectClient={(id) => {
              setSelectedClientId(id);
              setFocusMessageId(undefined);
            }}
            onClearClient={() => setSelectedClientId(null)}
            messages={messages}
            formats={formats}
            tracked={tracked}
            focusMessageId={focusMessageId}
            onSendEmail={sendClientEmail}
            onSimulateReply={simulateReply}
            onConfirmSale={(id) => setSale(id, 'won')}
            onMarkLost={(id) => setSale(id, 'lost')}
            onSaveFormats={setFormats}
            sequence={sequence}
            onSaveSequence={setSequence}
            jobs={jobs}
            onScheduleEmail={scheduleEmail}
            onSendFollowUp={sendFollowUpJob}
            onSkipFollowUp={skipFollowUp}
            onUpdateJob={updateJob}
            onAccept={acceptLead}
            onMerge={mergeLead}
            onDiscard={discardLead}
            onNeedsReview={needsReview}
            onSimulate={simulate}
          />
        ) : null}
        {view === 'providers' ? <ProvidersMock /> : null}
        {view === 'admin' ? (
          <AdminMock
            onEnter={enter}
            sales={sales}
            formats={formats}
            sequence={sequence}
            onSaveSequence={setSequence}
            jobs={jobs}
            clients={clients}
            dueCount={dueJobs.length}
            onAdvanceDay={advanceDay}
            onRunDue={runDueFollowUps}
            onSendFollowUp={sendFollowUpJob}
            onSkipFollowUp={skipFollowUp}
            onOpenClient={openClientThread}
          />
        ) : null}
        {view === 'system' ? <SystemMock /> : null}
      </div>
      {toast ? (
        <div className="absolute bottom-6 right-6 z-[90] cmd-glow-strong rounded-xl bg-[#1e2d4a] px-4 py-3 text-sm">
          <p className="font-semibold">{toast.title}</p>
          {toast.detail ? <p className="text-xs text-[#d5e2f2] mt-0.5">{toast.detail}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
