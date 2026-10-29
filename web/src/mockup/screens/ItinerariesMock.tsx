import { useState } from 'react';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';
import MockModal from '../components/MockModal';
import { kindTone, mockDays, mockFees, mockGeneralItems, mockItineraries } from '../mockData';

type ModalKey = 'new' | 'import' | 'publish' | 'line' | 'library' | 'delete' | 'message' | null;

export default function ItinerariesMock({ onOpenPricing }: { onOpenPricing?: () => void }) {
  const [selected, setSelected] = useState(mockItineraries[0].id);
  const [listOpen, setListOpen] = useState(true);
  const [level, setLevel] = useState('5');
  const [occ, setOcc] = useState('double');
  const [pricingOpen, setPricingOpen] = useState(true);
  const [dayFace, setDayFace] = useState<Record<number, 'details' | 'pricing'>>({ 1: 'details', 2: 'details', 3: 'details' });
  const [modal, setModal] = useState<ModalKey>(null);
  const [autosave] = useState<'saved' | 'saving'>('saved');
  const it = mockItineraries.find((i) => i.id === selected) ?? mockItineraries[0];

  return (
    <div className="flex flex-1 min-h-0">
      <aside
        className={`relative hidden lg:flex flex-col shrink-0 border-r border-[rgba(19,127,236,0.2)] bg-[#1e2d4a] transition-all ${
          listOpen ? 'w-[380px]' : 'w-4'
        }`}
      >
        <button
          type="button"
          className="absolute -right-3 top-1/2 -translate-y-1/2 size-6 rounded-full bg-[#2a3d64] border border-[rgba(19,127,236,0.4)] text-xs"
          onClick={() => setListOpen((s) => !s)}
        >
          {listOpen ? '›' : '‹'}
        </button>
        {listOpen ? (
          <>
            <div className="p-4 space-y-3 border-b border-[rgba(19,127,236,0.18)]">
              <div className="flex items-center gap-2 rounded-lg bg-[#263858] border border-[rgba(19,127,236,0.25)] h-10 px-3">
                <span className="material-symbols-outlined text-[#d5e2f2]">search</span>
                <input className="bg-transparent border-none outline-none text-sm flex-1" placeholder="Search itineraries…" />
              </div>
              <div className="flex gap-2">
                <HudButton tone="primary" icon="add" className="flex-1" onClick={() => setModal('new')}>
                  New
                </HudButton>
                <HudButton icon="upload" className="flex-1" onClick={() => setModal('import')}>
                  Import
                </HudButton>
              </div>
              {onOpenPricing ? (
                <button type="button" className="text-xs font-semibold text-[#137fec] hover:underline" onClick={onOpenPricing}>
                  Open Pricing Library
                </button>
              ) : null}
            </div>
            <div className="flex-1 overflow-y-auto cmd-scroll">
              {mockItineraries.map((row) => {
                const on = row.id === selected;
                return (
                  <div
                    key={row.id}
                    className={`cmd-hover-row group flex items-center px-3 py-3 cursor-pointer border-l-4 ${
                      on ? 'border-[#137fec] bg-[#137fec]/10' : 'border-transparent'
                    }`}
                    onClick={() => setSelected(row.id)}
                  >
                    <div className="flex items-center gap-1 overflow-hidden shrink-0 w-0 opacity-0 group-hover:w-[64px] group-hover:opacity-100 group-hover:mr-2 transition-all duration-200">
                      <button
                        type="button"
                        className="cmd-hover-icon size-7 rounded-md text-[#d5e2f2] hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          setModal('delete');
                        }}
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                      <button type="button" className="cmd-hover-icon size-7 rounded-md text-[#d5e2f2] hover:text-[#137fec]" onClick={(e) => e.stopPropagation()}>
                        <span className="material-symbols-outlined text-[20px]">content_copy</span>
                      </button>
                    </div>
                    <div
                      className="size-12 rounded-lg bg-cover bg-center shrink-0 mr-3"
                      style={{ backgroundImage: `url("${row.cover}")` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-bold truncate">{row.title}</p>
                        <span className="text-xs text-[#137fec] shrink-0">${row.total.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-[#d5e2f2] mt-0.5">
                        {row.days} Days • {row.pax} Pax
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </aside>

      <div className="flex-1 min-w-0 flex flex-col bg-[#12202c]">
        <header className="h-16 shrink-0 flex items-center gap-3 px-5 border-b border-[rgba(19,127,236,0.2)] bg-[#2a3d64]">
          <input className="bg-transparent border-none outline-none text-lg font-bold flex-1 min-w-0" defaultValue={it.title} />
          <span className="cmd-chip bg-[#137fec]/15 text-[#137fec]">Draft</span>
          <span className="hidden md:inline text-[11px] text-[#d5e2f2]">{it.id}</span>
          <span className="inline-flex items-center gap-1 text-xs text-[#d5e2f2]">
            <span className="material-symbols-outlined text-[16px]">{autosave === 'saved' ? 'cloud_done' : 'progress_activity'}</span>
            {autosave === 'saved' ? 'Saved' : 'Saving…'}
          </span>
          <HudButton>Discard</HudButton>
          <HudButton tone="primary" icon="save" onClick={() => setModal('publish')}>
            Save
          </HudButton>
        </header>

        <div className="flex-1 overflow-y-auto cmd-scroll p-6 space-y-5">
          <HudPanel
            title="General Information"
            icon="info"
            actions={
              <button type="button" className="text-xs font-semibold text-[#137fec]" onClick={() => setModal('message')}>
                Message Template
              </button>
            }
          >
            <div className="grid md:grid-cols-2 gap-4">
              <label className="text-xs text-[#d5e2f2] uppercase tracking-wider">
                Duration
                <div className="mt-1 flex items-center gap-2 text-sm text-[#f4f8fc]">
                  <span className="material-symbols-outlined text-[#137fec]">schedule</span>
                  {it.days} Days / {it.days - 1} Nights
                </div>
              </label>
              <label className="text-xs text-[#d5e2f2] uppercase tracking-wider md:col-span-2">
                Summary
                <textarea
                  className="cmd-textarea mt-1 h-20"
                  defaultValue="A refined Cape itinerary pairing waterfront luxury with peninsula wilderness and a two-night Winelands close."
                />
              </label>
            </div>
          </HudPanel>

          <HudPanel
            title="Pricing Overview"
            icon="payments"
            actions={
              <button type="button" className="text-[#d5e2f2]" onClick={() => setPricingOpen((s) => !s)}>
                <span className="material-symbols-outlined">{pricingOpen ? 'expand_less' : 'expand_more'}</span>
              </button>
            }
          >
            {!pricingOpen ? (
              <p className="text-sm">
                Total / person: <span className="text-[#137fec] font-bold">${it.total.toLocaleString()}</span>
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <Seg label="Level" options={['3', '4', '5', 'Deluxe']} value={level} onChange={setLevel} />
                  <Seg label="Occupancy" options={['single', 'double', 'triple']} value={occ} onChange={setOcc} />
                  <HudButton icon="upload" onClick={() => setModal('import')}>
                    Import Pricing
                  </HudButton>
                </div>
                <div className="rounded-xl bg-[#137fec] p-5 relative overflow-hidden">
                  <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
                  <p className="text-xs uppercase tracking-widest text-blue-100">Total price per person</p>
                  <p className="text-4xl font-black mt-1">${it.total.toLocaleString()}</p>
                  <p className="text-xs text-blue-100 mt-1">Day subtotal • {level === 'Deluxe' ? 'Deluxe' : `${level}-star`} • {occ}</p>
                </div>
                <LineTable
                  title="Global Costs"
                  rows={mockGeneralItems}
                  addLabel="Add Item"
                  onAdd={() => setModal('line')}
                />
                <LineTable title="Additional Fees" rows={mockFees} addLabel="Add Fee" onAdd={() => setModal('line')} />
              </div>
            )}
          </HudPanel>

          <HudPanel
            title="Daily Itinerary"
            icon="calendar_month"
            actions={
              <div className="flex gap-2">
                <HudButton onClick={() => setModal('library')}>Add Saved Day</HudButton>
                <HudButton tone="primary" icon="add">
                  Add Day
                </HudButton>
              </div>
            }
          >
            <div className="space-y-3">
              {mockDays.map((d) => {
                const face = dayFace[d.n] ?? 'details';
                return (
                  <div key={d.n} className={`rounded-xl border p-4 ${face === 'pricing' ? 'border-[#137fec]/40' : 'border-[rgba(19,127,236,0.18)]'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`size-8 rounded-full flex items-center justify-center text-sm font-bold ${d.n === 1 ? 'bg-[#137fec]/20 text-[#137fec]' : 'bg-white/5 text-[#d5e2f2]'}`}>
                        {d.n}
                      </span>
                      <input className="bg-transparent border-none outline-none font-bold flex-1" defaultValue={d.title} />
                      <div className="flex rounded-lg bg-[#263858] p-0.5">
                        {(['details', 'pricing'] as const).map((f) => (
                          <button
                            key={f}
                            type="button"
                            className={`px-2.5 py-1 text-xs capitalize rounded-md ${face === f ? 'bg-[#137fec] text-white' : 'text-[#d5e2f2]'}`}
                            onClick={() => setDayFace((s) => ({ ...s, [d.n]: f }))}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    {face === 'details' ? (
                      <div className="space-y-3">
                        <textarea className="cmd-textarea h-16" defaultValue={d.desc} />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          <Field icon="swap_horiz" label="Transfers" value={String(d.transfers)} />
                          <Field icon="hotel" label="Accommodation" value={d.hotel} />
                          <Field icon="bed" label="Room Type" value={d.room} />
                          <Field icon="location_on" label="Destination" value={d.dest} />
                        </div>
                      </div>
                    ) : (
                      <LineTable title="" rows={d.items} addLabel="Add Line Item" onAdd={() => setModal('line')} />
                    )}
                  </div>
                );
              })}
              <button type="button" className="w-full rounded-xl border border-dashed border-[rgba(19,127,236,0.3)] py-3 text-sm text-[#d5e2f2] hover:text-[#137fec]">
                + Add Day 4
              </button>
            </div>
          </HudPanel>
        </div>
      </div>

      <MockModal
        open={modal === 'new'}
        title="New itinerary"
        onClose={() => setModal(null)}
        footer={
          <>
            <HudButton onClick={() => setModal(null)}>Cancel</HudButton>
            <HudButton tone="primary">Create blank itinerary</HudButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Title
            <input className="cmd-input mt-1" defaultValue="Untitled itinerary" />
          </label>
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Start date
            <input type="date" className="cmd-input mt-1" defaultValue="2026-11-12" />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={false} /> Blank pricing
          </label>
          <p className="text-xs text-[#d5e2f2]">Or import JSON / Excel, or duplicate an existing trip from the list hover action.</p>
        </div>
      </MockModal>

      <MockModal
        open={modal === 'import'}
        title="Import itinerary"
        onClose={() => setModal(null)}
        footer={
          <>
            <HudButton onClick={() => setModal(null)}>Cancel</HudButton>
            <HudButton tone="primary" icon="upload">
              Import
            </HudButton>
          </>
        }
      >
        <p className="mb-3">Upload JSON or Excel. If the title already exists you will choose merge vs create new.</p>
        <pre className="text-xs bg-[#263858] rounded-lg p-3 overflow-x-auto">{`{ "title": "Cape Town Escape", "days": [...] }`}</pre>
        <HudButton className="mt-3" icon="attach_file">
          Upload file
        </HudButton>
      </MockModal>

      <MockModal
        open={modal === 'publish'}
        title="Saving your edits…"
        onClose={() => setModal(null)}
        footer={
          <HudButton tone="ok" onClick={() => setModal(null)}>
            yay
          </HudButton>
        }
      >
        <p className="mb-3">Yay! your data is safe and sound.</p>
        <div className="h-1.5 rounded-full bg-[#137fec]/20 overflow-hidden">
          <div className="h-full w-full bg-[#34d399]" />
        </div>
      </MockModal>

      <MockModal
        open={modal === 'line'}
        title="Add Line Item"
        onClose={() => setModal(null)}
        footer={
          <>
            <HudButton onClick={() => setModal(null)}>Cancel</HudButton>
            <HudButton tone="primary">Save Line Item</HudButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Use saved line item
            <select className="cmd-select mt-1">
              <option>None — custom</option>
              <option>Private safari vehicle (full day)</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Name
            <input className="cmd-input mt-1" defaultValue="Private city guide" />
          </label>
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Amount USD
            <input className="cmd-input mt-1" defaultValue="180" />
          </label>
        </div>
      </MockModal>

      <MockModal
        open={modal === 'library'}
        title="Day library"
        onClose={() => setModal(null)}
        wide
      >
        <input className="cmd-input mb-3" placeholder="Search saved days…" />
        {mockDays.map((d) => (
          <div key={d.n} className="flex items-center justify-between gap-3 py-3 border-b border-[rgba(19,127,236,0.12)]">
            <div>
              <p className="font-semibold">{d.title}</p>
              <p className="text-xs text-[#d5e2f2]">From Cape Town & Winelands Escape</p>
            </div>
            <HudButton tone="primary">Add this day</HudButton>
          </div>
        ))}
      </MockModal>

      <MockModal
        open={modal === 'delete'}
        title="Delete itinerary"
        onClose={() => setModal(null)}
        footer={
          <>
            <HudButton onClick={() => setModal(null)}>Cancel</HudButton>
            <HudButton tone="danger" onClick={() => setModal(null)}>
              Delete
            </HudButton>
          </>
        }
      >
        Are you sure you want to delete “{it.title}”? This will remove all of its days and cannot be undone.
      </MockModal>

      <MockModal
        open={modal === 'message'}
        title="Message Template"
        onClose={() => setModal(null)}
        wide
        footer={
          <>
            <HudButton onClick={() => setModal(null)}>Cancel</HudButton>
            <HudButton tone="primary">Save Template</HudButton>
          </>
        }
      >
        <div className="space-y-3">
          {['Greeting', 'Cabin availability', 'Flight pricing', 'General message'].map((lab) => (
            <label key={lab} className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
              {lab}
              <textarea className="cmd-textarea mt-1 h-14" defaultValue={`Sample ${lab.toLowerCase()} copy for the client-facing proposal.`} />
            </label>
          ))}
        </div>
      </MockModal>
    </div>
  );
}

function Seg({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[#d5e2f2] mb-1">{label}</div>
      <div className="flex rounded-lg bg-[#263858] p-0.5">
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 text-xs capitalize rounded-md ${value.toLowerCase() === o.toLowerCase() ? 'bg-[#137fec] text-white' : 'text-[#d5e2f2]'}`}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  );
}

function Field({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-lg bg-[#263858] border border-[rgba(19,127,236,0.15)] p-2">
      <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-[#d5e2f2]">
        <span className="material-symbols-outlined text-[14px]">{icon}</span>
        {label}
      </div>
      <div className="text-sm mt-1 truncate">{value}</div>
    </div>
  );
}

function LineTable({
  title,
  rows,
  addLabel,
  onAdd,
}: {
  title: string;
  rows: { name: string; amount: number; kind: string }[];
  addLabel: string;
  onAdd: () => void;
}) {
  return (
    <div>
      {title ? <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-[#d5e2f2]">{title}</p>
        <HudButton icon="add" onClick={onAdd}>
          {addLabel}
        </HudButton>
      </div> : (
        <div className="flex justify-end mb-2">
          <HudButton icon="add" onClick={onAdd}>
            {addLabel}
          </HudButton>
        </div>
      )}
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center gap-3 rounded-lg bg-[#263858] px-3 py-2">
            <span className={`cmd-chip ${kindTone[r.kind] ?? kindTone.custom}`}>{r.kind}</span>
            <span className="flex-1 text-sm">{r.name}</span>
            <span className="text-sm font-semibold">${r.amount}</span>
            <span className="material-symbols-outlined text-[16px] text-[#d5e2f2]">delete</span>
          </div>
        ))}
      </div>
    </div>
  );
}
