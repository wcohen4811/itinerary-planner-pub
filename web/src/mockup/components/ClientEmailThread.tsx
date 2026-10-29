import { useEffect, useMemo, useRef, useState } from 'react';
import HudButton from './HudButton';
import {
  applyEmailTokens,
  formatUsd,
  type MockClientRow,
  type MockEmailFormat,
  type MockEmailMessage,
  type MockFollowUpJob,
  type MockFollowUpSequence,
  type MockTrackedProposal,
} from '../mockData';

export default function ClientEmailThread({
  client,
  messages,
  formats,
  tracked,
  jobs,
  sequence,
  focusMessageId,
  onBack,
  onSend,
  onSchedule,
  onSimulateReply,
  onConfirmSale,
  onMarkLost,
  onEditFormats,
  onEditSequence,
  onSendFollowUp,
  onSkipFollowUp,
  onUpdateJob,
}: {
  client: MockClientRow;
  messages: MockEmailMessage[];
  formats: MockEmailFormat[];
  tracked: MockTrackedProposal[];
  jobs: MockFollowUpJob[];
  sequence: MockFollowUpSequence;
  focusMessageId?: string;
  onBack: () => void;
  onSend: (msg: { subject: string; body: string; kind: 'note' | 'proposal' | 'followup' }) => void;
  onSchedule: (msg: { subject: string; body: string; delayDays: number; formatId: string }) => void;
  onSimulateReply: () => void;
  onConfirmSale: (proposalId: string) => void;
  onMarkLost: (proposalId: string) => void;
  onEditFormats: () => void;
  onEditSequence: () => void;
  onSendFollowUp: (jobId: string) => void;
  onSkipFollowUp: (jobId: string) => void;
  onUpdateJob: (jobId: string, patch: Partial<MockFollowUpJob>) => void;
}) {
  const [formatId, setFormatId] = useState(formats.find((f) => f.id === 'fmt-follow')?.id ?? formats[0]?.id ?? '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [scheduleDays, setScheduleDays] = useState(3);
  const endRef = useRef<HTMLDivElement>(null);
  const focusRef = useRef<HTMLDivElement>(null);

  const thread = useMemo(
    () => messages.filter((m) => m.clientId === client.id),
    [messages, client.id],
  );
  const clientTracked = tracked.filter((p) => p.clientId === client.id);
  const latestOpen = clientTracked.find((p) => p.status !== 'won' && p.status !== 'lost') ?? clientTracked[0];
  const quoted = latestOpen ? formatUsd(latestOpen.quotedUsd) : formatUsd(0);
  const clientJobs = jobs.filter((j) => j.clientId === client.id && (j.status === 'scheduled' || j.status === 'due'));

  useEffect(() => {
    const fmt = formats.find((f) => f.id === formatId);
    if (!fmt) return;
    const vars = { firstName: client.first, itinerary: client.itinerary, quoted };
    setSubject(applyEmailTokens(fmt.subject, vars));
    setBody(applyEmailTokens(fmt.body, vars));
  }, [formatId, formats, client.first, client.itinerary, quoted]);

  useEffect(() => {
    (focusRef.current ?? endRef.current)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [thread.length, focusMessageId]);

  const saleLabel = clientTracked.some((p) => p.status === 'won')
    ? 'Won'
    : clientTracked.some((p) => p.status === 'clicked' || p.status === 'opened' || p.status === 'sent')
      ? 'Open proposal'
      : clientTracked.some((p) => p.status === 'lost')
        ? 'Lost'
        : 'No proposal';

  function sendKind() {
    const name = formats.find((f) => f.id === formatId)?.name.toLowerCase() ?? '';
    if (name.includes('proposal')) return 'proposal' as const;
    if (name.includes('follow')) return 'followup' as const;
    return 'note' as const;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-5 py-3 border-b border-sky-400/20 flex flex-wrap items-center gap-3">
        <HudButton icon="arrow_back" onClick={onBack}>
          Roster
        </HudButton>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">
            {client.first} {client.last}
          </p>
          <p className="text-xs text-[#d5e2f2] truncate">
            {client.email} · {client.itinerary} · {saleLabel}
            {sequence.enabled ? ' · auto follow-up on' : ' · auto follow-up off'}
          </p>
        </div>
        <HudButton icon="schedule" onClick={onEditSequence}>
          Follow-up rules
        </HudButton>
        <HudButton icon="edit_note" onClick={onEditFormats}>
          Edit formats
        </HudButton>
        <HudButton icon="chat" onClick={onSimulateReply}>
          Simulate reply
        </HudButton>
      </div>

      {clientJobs.length > 0 ? (
        <div className="px-4 py-2 border-b border-sky-400/15 bg-[#16263f] space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-sky-200">Scheduled follow-ups</p>
          {clientJobs.map((job) => {
            const fmt = formats.find((f) => f.id === job.formatId);
            return (
              <div key={job.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-[#1e2d4a] px-3 py-2">
                <span className={`cmd-chip ${job.status === 'due' ? 'bg-amber-400/20 text-amber-200' : 'bg-sky-400/15 text-sky-200'}`}>
                  {job.dueLabel}
                </span>
                <span className="cmd-chip bg-white/10 text-white">{job.origin === 'manual' ? 'manual' : 'auto'}</span>
                <select
                  className="cmd-select !w-auto min-w-[8rem]"
                  value={job.formatId}
                  onChange={(e) => onUpdateJob(job.id, { formatId: e.target.value })}
                >
                  {formats.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
                <label className="text-[11px] text-[#d5e2f2] flex items-center gap-1">
                  Days
                  <input
                    type="number"
                    min={0}
                    className="cmd-input !w-16"
                    value={job.dueInDays}
                    onChange={(e) => {
                      const dueInDays = Math.max(0, Number(e.target.value) || 0);
                      onUpdateJob(job.id, {
                        dueInDays,
                        delayDays: dueInDays,
                        status: dueInDays === 0 ? 'due' : 'scheduled',
                      });
                    }}
                  />
                </label>
                <span className="text-xs text-[#d5e2f2] truncate flex-1">
                  {fmt?.name ?? 'Format'}
                  {job.rewrittenFrom ? ' · rewritten from last send' : ''}
                </span>
                <HudButton tone="primary" icon="send" onClick={() => onSendFollowUp(job.id)}>
                  Send now
                </HudButton>
                <HudButton onClick={() => onSkipFollowUp(job.id)}>Skip</HudButton>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-2 border-b border-sky-400/15 text-xs text-[#d5e2f2]">
          No follow-ups queued. Send a proposal or schedule one below.
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto cmd-scroll px-4 py-4 space-y-3">
        {thread.length === 0 ? (
          <p className="text-sm text-[#d5e2f2] text-center mt-10">No emails yet. Choose a format and send the first note.</p>
        ) : (
          thread.map((m) => {
            const proposal = m.proposalId ? tracked.find((p) => p.id === m.proposalId) : undefined;
            const focused = m.id === focusMessageId;
            const out = m.dir === 'out';
            return (
              <div
                key={m.id}
                ref={focused ? focusRef : undefined}
                className={`flex ${out ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[min(36rem,88%)] rounded-2xl px-4 py-3 ${
                    out ? 'bg-sky-400 text-slate-900 rounded-br-md' : 'bg-[#1e2d4a] text-white rounded-bl-md border border-sky-400/20'
                  } ${focused ? 'ring-2 ring-amber-300' : ''}`}
                >
                  {m.subject ? <p className={`text-[11px] uppercase tracking-wider mb-1 ${out ? 'text-slate-700' : 'text-sky-200'}`}>{m.subject}</p> : null}
                  <p className="text-sm whitespace-pre-wrap">{m.body}</p>
                  <div className={`flex flex-wrap items-center gap-2 mt-2 text-[11px] ${out ? 'text-slate-700' : 'text-[#d5e2f2]'}`}>
                    <span>{m.at}</span>
                    {m.kind === 'proposal' ? <span className="font-semibold">Proposal</span> : null}
                    {m.kind === 'followup' ? <span className="font-semibold">Follow-up · {m.origin === 'auto' ? 'auto' : 'manual'}</span> : null}
                    {m.tracking ? <span>{m.tracking}</span> : null}
                    {proposal ? (
                      <span>
                        {formatUsd(proposal.quotedUsd)} · {proposal.marginPct}% · {proposal.status}
                        {proposal.bookedUsd ? ` · booked ${formatUsd(proposal.bookedUsd)}` : ''}
                      </span>
                    ) : null}
                  </div>
                  {proposal ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button
                        type="button"
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 ${proposal.status === 'won' ? 'bg-emerald-600 text-white' : out ? 'bg-slate-900 text-white' : 'bg-emerald-500/20 text-emerald-200'}`}
                        onClick={() => onConfirmSale(proposal.id)}
                      >
                        {proposal.status === 'won' ? 'Sale confirmed' : 'Confirm sale'}
                      </button>
                      <button
                        type="button"
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 ${proposal.status === 'lost' ? 'bg-slate-600 text-white' : out ? 'bg-white/40 text-slate-900' : 'bg-white/10 text-white'}`}
                        onClick={() => onMarkLost(proposal.id)}
                      >
                        {proposal.status === 'lost' ? 'Marked lost' : 'Mark lost'}
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="border-t border-sky-400/20 bg-[#1e2d4a] px-4 py-3 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-[11px] text-[#d5e2f2] flex items-center gap-2">
            Format
            <select className="cmd-select !w-auto min-w-[10rem]" value={formatId} onChange={(e) => setFormatId(e.target.value)}>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <input className="cmd-input flex-1 min-w-[12rem]" placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </div>
        <div className="flex gap-2 items-end">
          <textarea
            className="cmd-textarea flex-1 h-20"
            placeholder="Edit the email here, then send or schedule…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <div className="flex flex-col gap-2">
            <HudButton
              tone="primary"
              icon="send"
              onClick={() => {
                if (!subject.trim() && !body.trim()) return;
                onSend({ subject: subject.trim() || '(no subject)', body: body.trim(), kind: sendKind() });
                setBody('');
              }}
            >
              Send now
            </HudButton>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={0}
                className="cmd-input !w-14"
                value={scheduleDays}
                onChange={(e) => setScheduleDays(Math.max(0, Number(e.target.value) || 0))}
                title="Days until auto-send"
              />
              <HudButton
                icon="schedule"
                onClick={() => {
                  if (!subject.trim() && !body.trim()) return;
                  onSchedule({
                    subject: subject.trim() || '(no subject)',
                    body: body.trim(),
                    delayDays: scheduleDays,
                    formatId,
                  });
                }}
              >
                Auto
              </HudButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
