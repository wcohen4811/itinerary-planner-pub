import { useState } from 'react';
import DataTable from '../components/DataTable';
import HudButton from '../components/HudButton';
import HudPanel from '../components/HudPanel';
import MockModal from '../components/MockModal';
import { formatUsd, kindTone, mockTemplates, type MockSalesSnapshot } from '../mockData';

export default function PricingLibraryMock({ onBack, sales }: { onBack?: () => void; sales: MockSalesSnapshot }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const rows = mockTemplates.filter((t) => t.name.toLowerCase().includes(q.toLowerCase()) || t.sku.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex-1 min-h-0 overflow-y-auto cmd-scroll p-6 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black">Pricing Library</h2>
          <p className="text-sm text-[#d5e2f2]">Templates feed quoted price, margin, and booked sales on sent proposals.</p>
        </div>
        <div className="flex gap-2">
          {onBack ? <HudButton onClick={onBack}>Back to Itineraries</HudButton> : null}
          <HudButton>Refresh</HudButton>
          <HudButton tone="primary" icon="add" onClick={() => setOpen(true)}>
            New Template
          </HudButton>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl bg-[#1e2d4a] border border-sky-400/20 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wider text-[#d5e2f2]">Avg booked margin</p>
          <p className="text-lg font-bold">{sales.avgMarginPct}%</p>
        </div>
        <div className="rounded-xl bg-[#1e2d4a] border border-sky-400/20 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wider text-[#d5e2f2]">Sales this month</p>
          <p className="text-lg font-bold">{formatUsd(sales.totalSalesMonth)}</p>
        </div>
        <div className="rounded-xl bg-[#1e2d4a] border border-sky-400/20 px-3 py-3">
          <p className="text-[11px] uppercase tracking-wider text-[#d5e2f2]">Proposal conversion</p>
          <p className="text-lg font-bold">{sales.conversionPct}%</p>
        </div>
      </div>
      <input className="cmd-input max-w-md" placeholder="Search templates…" value={q} onChange={(e) => setQ(e.target.value)} />
      <HudPanel padded>
        <DataTable
          columns={['Item Name', 'SKU', 'Category', 'Default', '']}
          rows={rows.map((t) => [
            t.name,
            <span className="font-mono text-xs text-[#4cc9f0]">{t.sku}</span>,
            <span className={`cmd-chip ${kindTone[t.kind]}`}>{t.kind}</span>,
            `$${t.amount}`,
            <div className="flex gap-2 text-[#d5e2f2]">
              <button type="button" onClick={() => setOpen(true)}>
                <span className="material-symbols-outlined text-[18px]">edit</span>
              </button>
              <button type="button">
                <span className="material-symbols-outlined text-[18px]">delete</span>
              </button>
            </div>,
          ])}
          empty="No templates found."
        />
      </HudPanel>
      <MockModal
        open={open}
        title="Pricing template"
        onClose={() => setOpen(false)}
        footer={
          <>
            <HudButton onClick={() => setOpen(false)}>Cancel</HudButton>
            <HudButton tone="primary" onClick={() => setOpen(false)}>
              Save
            </HudButton>
          </>
        }
      >
        <div className="space-y-3">
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Name
            <input className="cmd-input mt-1" defaultValue="Private safari vehicle (full day)" />
          </label>
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Kind
            <select className="cmd-select mt-1">
              <option>activity</option>
              <option>hotel</option>
              <option>custom</option>
              <option>general</option>
              <option>fee</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-wider text-[#d5e2f2]">
            Default amount
            <input className="cmd-input mt-1" defaultValue="420" />
          </label>
          <p className="text-xs text-[#d5e2f2]">SKU is assigned automatically: SAF-VEH-FD</p>
        </div>
      </MockModal>
    </div>
  );
}
