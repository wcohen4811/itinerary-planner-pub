import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function ItinerariesList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['itineraries'],
    queryFn: () => api.listItineraries(),
  });

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;

  const items = data?.itineraries ?? [];

  return (
    <div className="panel">
      <div className="panel-header">
        <h2>Itineraries</h2>
        <button onClick={() => refetch()}>Refresh</button>
      </div>
      <ul className="list">
        {items.map((it) => (
          <li key={it.id} className="list-item">
            <div className="list-col">
              <strong>{it.title}</strong>
              <div className="muted">
                {new Date(it.startDate).toLocaleDateString()} • level {it.accommodationLevel} • {it.days.length} days • total ${it.totalPriceUsd}
              </div>
            </div>
            <div className="list-actions">
              <Link to={`/itineraries/${it.id}`}>Open</Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}


