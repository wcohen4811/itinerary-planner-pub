import { useState } from 'react';
import DataTable from '../components/DataTable';
import HudPanel from '../components/HudPanel';
import { mockAccommodation, mockActivities, mockDestinations, mockProviders, mockTransfers } from '../mockData';

export default function ProvidersMock() {
  const [provider, setProvider] = useState(mockProviders[0].name);
  const [dest, setDest] = useState(mockDestinations[0].name);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto cmd-scroll p-6 space-y-4">
      <div>
        <h2 className="text-2xl font-black">Providers & Destinations</h2>
        <p className="text-sm text-[#d5e2f2]">Partner catalog, destination rates, and activity inventory.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <HudPanel title="Providers" icon="storefront">
          <div className="space-y-1">
            {mockProviders.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => setProvider(p.name)}
                className={`cmd-hover-row w-full text-left px-3 py-2 rounded-lg text-sm ${
                  provider === p.name ? 'bg-[#137fec]/15 text-[#137fec]' : ''
                }`}
              >
                {p.name} {!p.active ? <span className="text-[#d5e2f2]">(inactive)</span> : null}
              </button>
            ))}
          </div>
        </HudPanel>
        <HudPanel title="Destinations" icon="location_on">
          <div className="space-y-1">
            {mockDestinations.map((d) => (
              <button
                key={d.slug}
                type="button"
                onClick={() => setDest(d.name)}
                className={`cmd-hover-row w-full text-left px-3 py-2 rounded-lg text-sm ${
                  dest === d.name ? 'bg-[#137fec]/15 text-[#137fec]' : ''
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </HudPanel>
      </div>
      <p className="text-xs uppercase tracking-widest text-[#d5e2f2]">
        Rates for {dest} · via {provider}
      </p>
      <div className="grid lg:grid-cols-2 gap-4">
        <HudPanel title="Accommodation" icon="hotel">
          <DataTable
            columns={['Level', 'Base', 'Valid From', 'Valid To']}
            rows={mockAccommodation.map((r) => [r.level, `$${r.base}`, r.from, r.to])}
          />
        </HudPanel>
        <HudPanel title="Transfer" icon="airport_shuttle">
          <DataTable
            columns={['Level', 'Type', 'Visibility', 'Add', 'From', 'To']}
            rows={mockTransfers.map((r) => [r.level, r.type, r.vis, `$${r.add}`, r.from, r.to])}
          />
        </HudPanel>
      </div>
      <HudPanel title="Activities" icon="hiking">
        {mockActivities.map((a) => (
          <div key={a.name} className="py-2 border-b border-[rgba(19,127,236,0.12)] last:border-0">
            <p className="font-semibold">{a.name}</p>
            <p className="text-sm text-[#d5e2f2]">{a.desc}</p>
          </div>
        ))}
      </HudPanel>
    </div>
  );
}
