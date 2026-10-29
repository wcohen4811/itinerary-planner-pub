import { useEffect, useState } from 'react';
import HudButton from './HudButton';
import MockModal from './MockModal';
import type { MockEmailFormat } from '../mockData';

export default function EmailFormatEditor({
  open,
  formats,
  onClose,
  onSave,
}: {
  open: boolean;
  formats: MockEmailFormat[];
  onClose: () => void;
  onSave: (next: MockEmailFormat[]) => void;
}) {
  const [local, setLocal] = useState(formats);
  const [activeId, setActiveId] = useState(formats[0]?.id ?? '');
  const active = local.find((f) => f.id === activeId) ?? local[0] ?? null;

  useEffect(() => {
    if (!open) return;
    setLocal(formats);
    setActiveId(formats[0]?.id ?? '');
  }, [open]);

  function patch(partial: Partial<MockEmailFormat>) {
    if (!active) return;
    setLocal((s) => s.map((f) => (f.id === active.id ? { ...f, ...partial } : f)));
  }

  return (
    <MockModal
      open={open}
      title="Email formats"
      onClose={onClose}
      wide
      footer={
        <>
          <HudButton onClick={onClose}>Cancel</HudButton>
          <HudButton
            tone="primary"
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Save formats
          </HudButton>
        </>
      }
    >
      <p className="text-xs text-[#d5e2f2] mb-3">
        Defaults fill the client chat composer. Tokens: {'{{firstName}}'} · {'{{itinerary}}'} · {'{{quoted}}'}
      </p>
      <div className="grid md:grid-cols-[180px_1fr] gap-3">
        <div className="space-y-1">
          {local.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setActiveId(f.id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm ${active?.id === f.id ? 'bg-sky-400/20 text-white' : 'bg-white/5 text-[#d5e2f2]'}`}
            >
              {f.name}
            </button>
          ))}
          <HudButton
            icon="add"
            className="w-full mt-2"
            onClick={() => {
              const id = `fmt-${Date.now()}`;
              const next = { id, name: 'New format', subject: '', body: '' };
              setLocal((s) => [...s, next]);
              setActiveId(id);
            }}
          >
            Add format
          </HudButton>
        </div>
        {active ? (
          <div className="space-y-2">
            <label className="block text-xs text-[#d5e2f2]">
              Name
              <input className="cmd-input mt-1" value={active.name} onChange={(e) => patch({ name: e.target.value })} />
            </label>
            <label className="block text-xs text-[#d5e2f2]">
              Subject
              <input className="cmd-input mt-1" value={active.subject} onChange={(e) => patch({ subject: e.target.value })} />
            </label>
            <label className="block text-xs text-[#d5e2f2]">
              Body
              <textarea className="cmd-textarea mt-1 h-36" value={active.body} onChange={(e) => patch({ body: e.target.value })} />
            </label>
            {local.length > 1 ? (
              <HudButton
                tone="danger"
                onClick={() => {
                  const next = local.filter((f) => f.id !== active.id);
                  setLocal(next);
                  setActiveId(next[0]?.id ?? '');
                }}
              >
                Delete format
              </HudButton>
            ) : null}
          </div>
        ) : null}
      </div>
    </MockModal>
  );
}
