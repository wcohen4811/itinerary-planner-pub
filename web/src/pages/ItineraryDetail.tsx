import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { Day, ItineraryWithDays } from '../api/client';

export default function ItineraryDetail() {
  const { id = '' } = useParams();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ['itinerary', id],
    queryFn: () => api.getItinerary(id),
    enabled: !!id,
  });
  const pricing = useQuery({
    queryKey: ['pricing', id],
    queryFn: () => api.getPricing(id),
    enabled: !!id,
  });

  const it: ItineraryWithDays | undefined = data?.itinerary;
  const [form, setForm] = useState<Partial<ItineraryWithDays>>({});
  const updateItin = useMutation({
    mutationFn: (body: any) => api.updateItinerary(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itinerary', id] });
    },
  });

  const [draft, setDraft] = useState<Partial<Day>>({});
  const createDay = useMutation({
    mutationFn: (body: any) => api.createDay(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['itinerary', id] });
    },
  });
  const updDay = useMutation({
    mutationFn: ({ dayId, body }: { dayId: string; body: any }) => api.updateDay(id, dayId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['itinerary', id] }),
  });
  const delDay = useMutation({
    mutationFn: (dayId: string) => api.deleteDay(id, dayId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['itinerary', id] }),
  });

  // Ensure all hooks are called before any early return
  const sortedDays = useMemo(() => [...(it?.days ?? [])].sort((a, b) => a.dayNumber - b.dayNumber), [it?.days]);

  if (isLoading) return <div>Loading…</div>;
  if (error) return <div>Error: {(error as Error).message}</div>;
  if (!it) return <div>Not found</div>;

  const onItinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body: any = {};
    if (form.title) body.title = form.title;
    if (form.description !== undefined) body.description = form.description;
    if (form.startDate) body.startDate = form.startDate;
    if (form.accommodationLevel) body.accommodationLevel = form.accommodationLevel;
    if (form.updatedByName) body.updatedByName = form.updatedByName;
    updateItin.mutate(body);
  };

  const onCreateDay = (e: React.FormEvent) => {
    e.preventDefault();
    const body = {
      dayNumber: draft.dayNumber,
      title: draft.title,
      description: draft.description,
      hotelName: draft.hotelName,
      destination: draft.destination,
      destinationId: draft.destinationId,
      transferStatus: draft.transferStatus,
      transferCount: (draft as any).transferCount ?? 0,
      accommodationLevel: draft.accommodationLevel,
      date: draft.date,
      activity: draft.activityName || draft.activityPriceUsd ? { name: draft.activityName, priceUsd: draft.activityPriceUsd ?? 0 } : undefined,
    };
    if (draft.id) {
      updDay.mutate({ dayId: draft.id, body });
    } else {
      createDay.mutate(body);
    }
    setDraft({});
  };

  return (
    <div className="panel">
      <h2>{it.title}</h2>
      <div className="muted">
        Start: {new Date(it.startDate).toLocaleDateString()} • Level {it.accommodationLevel} • Total ${it.totalPriceUsd || 0}
      </div>

      <form onSubmit={onItinSubmit} className="form-grid">
        <label>
          Title
          <input value={form.title ?? ''} onChange={(e) => setForm((s) => ({ ...s, title: e.target.value }))} />
        </label>
        <label className="span-2">
          Description
          <textarea value={form.description ?? it.description ?? ''} onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))} />
        </label>
        <label>
          Start Date
          <input type="date" value={form.startDate ?? ''} onChange={(e) => setForm((s) => ({ ...s, startDate: e.target.value }))} />
        </label>
        <label>
          Level
          <select value={form.accommodationLevel ?? it.accommodationLevel} onChange={(e) => setForm((s) => ({ ...s, accommodationLevel: e.target.value as any }))}>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="deluxe">deluxe</option>
          </select>
        </label>
        <label>
          Updated By
          <input value={form.updatedByName ?? ''} onChange={(e) => setForm((s) => ({ ...s, updatedByName: e.target.value }))} />
        </label>
        <button type="submit" disabled={updateItin.isPending}>
          {updateItin.isPending ? 'Saving…' : 'Save Itinerary'}
        </button>
      </form>

      <section className="subpanel">
        <h3>Days</h3>
        <div className="muted" style={{ marginTop: 8 }}>Click a day to load into the form below.</div>

        <form
          className="form-grid"
          onSubmit={onCreateDay}
          onReset={(e) => {
            e.preventDefault();
            setDraft({});
          }}
        >
          <h4>{draft.id ? `Edit Day #${draft.dayNumber}` : 'Add Day'}</h4>
          <label>
            Day #
            <input
              type="number"
              value={draft.dayNumber ?? ''}
              onChange={(e) => setDraft((s) => ({ ...s, dayNumber: e.target.value ? Number(e.target.value) : undefined }))}
              required
            />
          </label>
          <label>
            Date
            <input type="date" value={draft.date ?? ''} onChange={(e) => setDraft((s) => ({ ...s, date: e.target.value }))} />
          </label>
          <label>
            Title
            <input value={draft.title ?? ''} onChange={(e) => setDraft((s) => ({ ...s, title: e.target.value }))} required />
          </label>
          <label className="span-2">
            Description
            <textarea value={draft.description ?? ''} onChange={(e) => setDraft((s) => ({ ...s, description: e.target.value }))} required />
          </label>
          <label>
            Hotel Name
            <input value={draft.hotelName ?? ''} onChange={(e) => setDraft((s) => ({ ...s, hotelName: e.target.value }))} />
          </label>
          <label>
            Destination
            <input value={draft.destination ?? ''} onChange={(e) => setDraft((s) => ({ ...s, destination: e.target.value }))} required />
          </label>
          <label>
            Transfer
            <select value={draft.transferStatus ?? 'none'} onChange={(e) => setDraft((s) => ({ ...s, transferStatus: e.target.value as any }))}>
              <option value="none">none</option>
              <option value="in">in</option>
              <option value="out">out</option>
            </select>
          </label>
          <label>
            Level
            <select
              value={draft.accommodationLevel ?? it.accommodationLevel}
              onChange={(e) => setDraft((s) => ({ ...s, accommodationLevel: e.target.value as any }))}
            >
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="deluxe">deluxe</option>
            </select>
          </label>
          <label>
            Activity Name
            <input value={draft.activityName ?? ''} onChange={(e) => setDraft((s) => ({ ...s, activityName: e.target.value }))} />
          </label>
          <label>
            Activity Price (USD)
            <input
              type="number"
              value={draft.activityPriceUsd ?? ''}
              onChange={(e) => setDraft((s) => ({ ...s, activityPriceUsd: e.target.value ? Number(e.target.value) : undefined }))}
            />
          </label>
          <div className="span-2" style={{ display: 'flex', gap: 8 }}>
            <button type="submit">Save Day</button>
            {draft.id ? (
              <button
                type="button"
                onClick={() => {
                  if (!draft.id) return;
                  delDay.mutate(draft.id);
                  setDraft({});
                }}
              >
                Delete Day
              </button>
            ) : null}
            <button type="reset">Clear</button>
          </div>
        </form>

        <div className="table">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Date</th>
                <th>Title</th>
                <th>Destination</th>
                <th>Transfer</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedDays.map((d) => (
                <tr key={d.id}>
                  <td>{d.dayNumber}</td>
                  <td>{d.date ? new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''}</td>
                  <td>{d.title}</td>
                  <td>{d.destination}</td>
                  <td>{d.transferStatus}</td>
                  <td>{d.totalPriceUsd != null ? `$${d.totalPriceUsd}` : '-'}</td>
                  <td>
                    <button onClick={() => setDraft({ ...d })}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="subpanel">
        <h3>Pricing</h3>
        {pricing.isLoading && <div>Loading pricing…</div>}
        {pricing.data && (
          <div className="table">
            <div className="muted">Total: ${pricing.data.totalPriceUsd || 0}</div>
            <table>
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Accommodation</th>
                  <th>Transfer</th>
                  <th>Destination</th>
                  <th>Activity</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {pricing.data.lines.map((ln) => (
                  <tr key={ln.dayNumber}>
                    <td>{ln.dayNumber}</td>
                    <td>{ln.breakdown?.accommodationPriceUsd != null ? `$${ln.breakdown.accommodationPriceUsd}` : '-'}</td>
                    <td>{ln.breakdown?.transferPriceUsd != null ? `$${ln.breakdown.transferPriceUsd}` : '-'}</td>
                    <td>{ln.breakdown?.destinationPriceUsd != null ? `$${ln.breakdown.destinationPriceUsd}` : '-'}</td>
                    <td>{ln.breakdown?.activityPriceUsd != null ? `$${ln.breakdown.activityPriceUsd}` : '-'}</td>
                    <td>${ln.priceUsd}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}


