import HudButton from './HudButton';
import type { MockEmailFormat, MockFollowUpSequence } from '../mockData';

export default function FollowUpSequenceEditor({
  sequence,
  formats,
  onChange,
}: {
  sequence: MockFollowUpSequence;
  formats: MockEmailFormat[];
  onChange: (next: MockFollowUpSequence) => void;
}) {
  function patchStep(id: string, partial: Partial<MockFollowUpSequence['steps'][number]>) {
    onChange({
      ...sequence,
      steps: sequence.steps.map((s) => (s.id === id ? { ...s, ...partial } : s)),
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#d5e2f2]">
        Future scheduler: after a proposal is sent, these steps fire unless cancelled. A manual follow-up is tracked and either cancels or rewrites the remaining auto steps.
      </p>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={sequence.enabled} onChange={(e) => onChange({ ...sequence, enabled: e.target.checked })} />
        Auto-send follow-ups
      </label>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={sequence.cancelOnReply} onChange={(e) => onChange({ ...sequence, cancelOnReply: e.target.checked })} />
          Cancel if the client replies
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={sequence.cancelOnSale} onChange={(e) => onChange({ ...sequence, cancelOnSale: e.target.checked })} />
          Cancel on sale or lost
        </label>
      </div>
      <label className="block text-[11px] text-[#d5e2f2]">
        When a follow-up is sent manually
        <select
          className="cmd-select mt-0.5"
          value={sequence.onManual}
          onChange={(e) => onChange({ ...sequence, onManual: e.target.value === 'cancel' ? 'cancel' : 'rewrite' })}
        >
          <option value="rewrite">Rewrite remaining auto steps from that message</option>
          <option value="cancel">Cancel remaining automated follow-ups</option>
        </select>
      </label>
      <div className="space-y-2">
        {sequence.steps.map((step, i) => (
          <div key={step.id} className="rounded-xl border border-sky-400/20 bg-[#1e2d4a] px-3 py-3 grid sm:grid-cols-[auto_1fr_auto_auto] gap-2 items-center">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={step.enabled} onChange={(e) => patchStep(step.id, { enabled: e.target.checked })} />
              Step {i + 1}
            </label>
            <label className="text-[11px] text-[#d5e2f2]">
              Format
              <select className="cmd-select mt-0.5" value={step.formatId} onChange={(e) => patchStep(step.id, { formatId: e.target.value })}>
                {formats.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-[11px] text-[#d5e2f2]">
              After days
              <input
                type="number"
                min={0}
                className="cmd-input mt-0.5 !w-20"
                value={step.delayDays}
                onChange={(e) => patchStep(step.id, { delayDays: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            {sequence.steps.length > 1 ? (
              <HudButton
                tone="danger"
                onClick={() => onChange({ ...sequence, steps: sequence.steps.filter((s) => s.id !== step.id) })}
              >
                Remove
              </HudButton>
            ) : (
              <span />
            )}
          </div>
        ))}
      </div>
      <HudButton
        icon="add"
        onClick={() =>
          onChange({
            ...sequence,
            steps: [
              ...sequence.steps,
              { id: `step-${Date.now()}`, delayDays: 10, formatId: formats[0]?.id ?? 'fmt-follow', enabled: true },
            ],
          })
        }
      >
        Add step
      </HudButton>
    </div>
  );
}
