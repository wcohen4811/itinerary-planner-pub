import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../api/client';

export default function Providers() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.listProviders(),
  });
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const dests = useQuery({
    queryKey: ['provider-dest', selectedProvider],
    queryFn: () => api.listProviderDestinations(selectedProvider || ''),
    enabled: !!selectedProvider,
  });
  const [selectedDest, setSelectedDest] = useState<string | null>(null);
  const acc = useQuery({
    queryKey: ['dest-acc', selectedDest],
    queryFn: () => api.listDestinationAccommodation(selectedDest || ''),
    enabled: !!selectedDest,
  });
  const trs = useQuery({
    queryKey: ['dest-trs', selectedDest],
    queryFn: () => api.listDestinationTransfer(selectedDest || ''),
    enabled: !!selectedDest,
  });
  const acts = useQuery({
    queryKey: ['dest-acts', selectedDest],
    queryFn: () => api.listDestinationActivities(selectedDest || ''),
    enabled: !!selectedDest,
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  return (
    <div className="panel">
      <h2>Providers & Destinations</h2>
      <div className="grid-2">
        <div className="subpanel">
          <h3>Providers</h3>
          <ul className="list">
            {(data?.providers || []).map((p) => (
              <li key={p.id} className={`list-item ${selectedProvider === p.id ? 'selected' : ''}`}>
                <button
                  onClick={() => {
                    setSelectedProvider(p.id);
                    setSelectedDest(null);
                  }}
                >
                  {p.name} {p.active ? '' : '(inactive)'}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="subpanel">
          <h3>Destinations</h3>
          {dests.isLoading && <div>Loading…</div>}
          <ul className="list">
            {(dests.data?.destinations || []).map((d) => (
              <li key={d.id} className={`list-item ${selectedDest === d.id ? 'selected' : ''}`}>
                <button onClick={() => setSelectedDest(d.id)}>{d.name}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {selectedDest && (
        <div className="subpanel">
          <h3>Prices</h3>
          <div className="grid-2">
            <div className="table">
              <h4>Accommodation</h4>
              {acc.isLoading ? (
                <div>Loading…</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Base</th>
                      <th>Valid From</th>
                      <th>Valid To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(acc.data?.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td>{r.accommodationLevel}</td>
                        <td>${r.basePriceUsd}</td>
                        <td>{new Date(r.validFrom).toLocaleDateString()}</td>
                        <td>{new Date(r.validTo).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="table">
              <h4>Transfer</h4>
              {trs.isLoading ? (
                <div>Loading…</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>Level</th>
                      <th>Type</th>
                      <th>Visibility</th>
                      <th>Add</th>
                      <th>Valid From</th>
                      <th>Valid To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(trs.data?.rows || []).map((r, i) => (
                      <tr key={i}>
                        <td>{r.accommodationLevel}</td>
                        <td>{r.transferType}</td>
                        <td>{r.visibility}</td>
                        <td>${r.addUsd}</td>
                        <td>{new Date(r.validFrom).toLocaleDateString()}</td>
                        <td>{new Date(r.validTo).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="subpanel">
            <h4>Activities</h4>
            {acts.isLoading ? (
              <div>Loading…</div>
            ) : (
              <ul className="list">
                {(acts.data?.activities || []).map((a: any) => (
                  <li key={a.id} className="list-item">
                    <div>
                      <strong>{a.name}</strong>
                      <div className="muted">{a.description}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


