import { useEffect, useMemo, useState } from 'react';
import StitchShell from '../components/StitchShell';
import { api } from '../api/client';
import { useItineraries } from '../services/itineraries';
import type { Client, Itinerary } from '../api/client';

type SortKey = 'name' | 'createdAt' | 'itinerary';

type ClientForm = {
  firstName: string;
  lastName: string;
  email: string;
  itineraryId: string;
  travelStartDate: string;
  passengers: number;
  accommodationLevel: Itinerary['accommodationLevel'];
  occupancy: 'single' | 'double' | 'triple';
  notes: string;
};

const blankForm: ClientForm = {
  firstName: '',
  lastName: '',
  email: '',
  itineraryId: '',
  travelStartDate: '',
  passengers: 1,
  accommodationLevel: '3',
  occupancy: 'double',
  notes: '',
};

function formatDate(val?: string | null) {
  if (!val) return '';
  const raw = String(val);
  const dateOnly = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    const [y, m, d] = dateOnly.split('-').map(Number);
    const utcDate = new Date(Date.UTC(y, m - 1, d));
    const formatted = utcDate.toLocaleDateString(undefined, {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });
    // #region agent log
    fetch('http://127.0.0.1:7374/ingest/115b4022-fc63-4f05-ae8e-f83ae3b7634b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d589d4'},body:JSON.stringify({sessionId:'d589d4',runId:'post-fix',hypothesisId:'H3',location:'web/src/pages/ClientsTab.tsx:formatDate',message:'Formatting travelStartDate as timezone-neutral date',data:{rawValue:val,dateOnly,formatted,timezoneOffsetMinutes:new Date().getTimezoneOffset()},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    return formatted;
  }
  const fallback = new Date(raw);
  if (Number.isNaN(fallback.getTime())) return '';
  const formatted = fallback.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  // #region agent log
  fetch('http://127.0.0.1:7374/ingest/115b4022-fc63-4f05-ae8e-f83ae3b7634b',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'d589d4'},body:JSON.stringify({sessionId:'d589d4',runId:'post-fix',hypothesisId:'H3',location:'web/src/pages/ClientsTab.tsx:formatDate',message:'Formatting travelStartDate fallback path',data:{rawValue:val,parsedEpoch:fallback.getTime(),parsedIso:fallback.toISOString(),formatted,timezoneOffsetMinutes:new Date().getTimezoneOffset()},timestamp:Date.now()})}).catch(()=>{});
  // #endregion
  return formatted;
}

function formatStartDate(start?: string | null) {
  const s = formatDate(start);
  return s || 'Dates TBD';
}

export default function ClientsTab() {
  const itinerariesQuery = useItineraries();
  const itineraries = itinerariesQuery.data?.itineraries ?? [];
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(blankForm);
  const [itinerarySearch, setItinerarySearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const filteredItineraries = useMemo(() => {
    if (!itinerarySearch.trim()) return itineraries;
    const q = itinerarySearch.toLowerCase();
    return itineraries.filter((it) => it.title.toLowerCase().includes(q));
  }, [itineraries, itinerarySearch]);

  async function loadClients() {
    setLoading(true);
    try {
      const res = await api.listClients({ sort, query });
      setClients(res.clients);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadClients();
  }, [sort, query]);

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setItinerarySearch('');
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      firstName: client.firstName ?? '',
      lastName: client.lastName ?? '',
      email: client.email ?? '',
      itineraryId: client.itineraryId ?? '',
      travelStartDate: client.travelStartDate ? client.travelStartDate.slice(0, 10) : '',
      passengers: client.passengers ?? 1,
      accommodationLevel: client.accommodationLevel ?? '3',
      occupancy: client.occupancy ?? 'double',
      notes: client.notes ?? '',
    });
    setItinerarySearch('');
    setSaveError(null);
    setModalOpen(true);
  }

  async function saveClient() {
    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim() || null,
      itineraryId: form.itineraryId || null,
      travelStartDate: form.travelStartDate || null,
      passengers: Math.max(1, Math.floor(Number(form.passengers) || 1)),
      accommodationLevel: form.accommodationLevel,
      occupancy: form.occupancy,
      notes: form.notes.trim() || null,
    };
    if (!payload.firstName || !payload.lastName) {
      setSaveError('First and last name are required.');
      return;
    }
    try {
      setSaving(true);
      setSaveError(null);
      if (editing) {
        await api.updateClient(editing.id, payload);
      } else {
        await api.createClient(payload);
      }
      setModalOpen(false);
      await loadClients();
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save client.');
    } finally {
      setSaving(false);
    }
  }

  async function deleteClient(client: Client) {
    if (!window.confirm(`Delete client ${client.firstName} ${client.lastName}?`)) return;
    await api.deleteClient(client.id);
    await loadClients();
  }

  return (
    <StitchShell active="clients">
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        <header className="h-auto py-6 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex-shrink-0 z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Clients</h1>
              <p className="text-sm text-slate-500 mt-1">Manage your travelers and their upcoming adventures.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="material-symbols-outlined text-slate-400 text-[20px]">search</span>
                </div>
                <input
                  className="block w-full md:w-64 pl-10 pr-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg leading-5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm transition-all"
                  placeholder="Search clients..."
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <button
                className="flex items-center justify-center bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg shadow-sm shadow-primary/30 transition-all font-medium text-sm"
                onClick={openCreate}
              >
                +Add Client
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
              <div className="relative group">
                <select
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                >
                  <option value="name">Sort: Name (A-Z)</option>
                  <option value="createdAt">Sort: Date Added</option>
                  <option value="itinerary">Sort: Itinerary</option>
                </select>
              </div>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1 hidden sm:block"></div>
              <button className="text-sm text-primary font-medium hover:underline whitespace-nowrap" onClick={() => setQuery('')}>
                Reset Filters
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span className="font-medium text-slate-900 dark:text-white">{clients.length}</span> Clients found
              <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1 ml-2">
                <button className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all text-primary">
                  <span className="material-symbols-outlined text-[18px]">list</span>
                </button>
                <button className="p-1 rounded hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-all">
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-4 pl-6 pr-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-[60px]">
                    <input className="rounded border-slate-300 text-primary focus:ring-primary/50" type="checkbox" />
                  </th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Client Name</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Itinerary Interest</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Travel Start</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Pax</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Added</th>
                  <th className="py-4 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td className="py-6 px-6 text-sm text-slate-500" colSpan={7}>
                      Loading clients...
                    </td>
                  </tr>
                ) : clients.length === 0 ? (
                  <tr>
                    <td className="py-6 px-6 text-sm text-slate-500" colSpan={7}>
                      No clients yet. Add your first client.
                    </td>
                  </tr>
                ) : (
                  clients.map((client) => (
                    <tr key={client.id} className="group hover:bg-primary/5 dark:hover:bg-primary/5 transition-colors cursor-pointer">
                      <td className="py-4 pl-6 pr-4">
                        <input className="rounded border-slate-300 text-primary focus:ring-primary/50" type="checkbox" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 flex items-center justify-center font-bold text-sm border-2 border-white dark:border-slate-800 shadow-sm">
                            {`${client.firstName?.[0] ?? ''}${client.lastName?.[0] ?? ''}`.toUpperCase() || 'C'}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white">
                              {client.firstName} {client.lastName}
                            </div>
                            <div className="text-xs text-slate-500">{client.email || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary dark:bg-primary/20 dark:text-blue-300 border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                          {client.itinerary?.title || 'Not selected'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-600 dark:text-slate-300 font-medium">
                        {formatStartDate(client.travelStartDate)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex items-center gap-1 text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-xs font-medium">
                          <span className="material-symbols-outlined text-[14px]">group</span>
                          {client.passengers ?? 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-xs text-slate-400">{new Date(client.createdAt).toLocaleString()}</div>
                      </td>
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            className="text-slate-400 hover:text-primary p-2 rounded-full hover:bg-primary/10 transition-all"
                            onClick={() => openEdit(client)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="text-slate-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-all"
                            onClick={() => deleteClient(client)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {modalOpen ? (
          <div className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-40 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#15202b] w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
              <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {editing ? 'Edit Client' : 'Add New Client'}
                  </h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Create a new client profile and attach an initial trip request.
                  </p>
                </div>
                <button
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  onClick={() => setModalOpen(false)}
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="px-6 py-6 overflow-y-auto custom-scrollbar">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="first-name">
                        First Name
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="first-name"
                        placeholder="e.g. Jane"
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="last-name">
                        Last Name
                      </label>
                      <input
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="last-name"
                        placeholder="e.g. Doe"
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="email">
                      Email
                    </label>
                    <input
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      id="email"
                      placeholder="e.g. jane@example.com"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div className="h-px bg-slate-100 dark:bg-slate-800 w-full my-2"></div>
                  <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-2">
                    Initial Trip Preferences
                  </h3>
                  <div className="space-y-1.5 relative">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Linked Itinerary</label>
                    <div className="relative">
                      <input
                        className="w-full pl-3 pr-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        placeholder="Search itineraries..."
                        type="text"
                        value={itinerarySearch}
                        onChange={(e) => setItinerarySearch(e.target.value)}
                      />
                    </div>
                    <select
                      className="w-full mt-2 appearance-none px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      value={form.itineraryId}
                      onChange={(e) => setForm((prev) => ({ ...prev, itineraryId: e.target.value }))}
                    >
                      <option value="">Select itinerary...</option>
                      {filteredItineraries.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Travel Start Date</label>
                      <input
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        type="date"
                        value={form.travelStartDate}
                        onChange={(e) => setForm((prev) => ({ ...prev, travelStartDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="passengers">
                      Passengers
                    </label>
                    <input
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      id="passengers"
                      min={1}
                      type="number"
                      value={form.passengers}
                      onChange={(e) => setForm((prev) => ({ ...prev, passengers: Number(e.target.value) || 1 }))}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="accommodation">
                      Accommodation Preference
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="accommodation"
                        value={form.accommodationLevel}
                        onChange={(e) => setForm((prev) => ({ ...prev, accommodationLevel: e.target.value as Itinerary['accommodationLevel'] }))}
                      >
                        <option value="3">3-Star (Standard)</option>
                        <option value="4">4-Star (Comfort)</option>
                        <option value="5">5-Star (Luxury)</option>
                        <option value="deluxe">Deluxe / Boutique</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 text-lg pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="occupancy">
                      Occupancy Preference
                    </label>
                    <div className="relative">
                      <select
                        className="w-full appearance-none px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        id="occupancy"
                        value={form.occupancy}
                        onChange={(e) => setForm((prev) => ({ ...prev, occupancy: e.target.value as ClientForm['occupancy'] }))}
                      >
                        <option value="single">Single</option>
                        <option value="double">Double</option>
                        <option value="triple">Triple</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-2.5 text-slate-400 text-lg pointer-events-none">expand_more</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300" htmlFor="notes">
                      Internal Notes
                    </label>
                    <textarea
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      id="notes"
                      placeholder="Dietary restrictions, special requests..."
                      rows={3}
                      value={form.notes}
                      onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                    ></textarea>
                  </div>
                  {saveError ? (
                    <div className="text-sm text-red-600">{saveError}</div>
                  ) : null}
                </form>
              </div>
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 rounded-b-xl flex justify-end gap-3">
                <button
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 dark:focus:ring-slate-700 transition-colors"
                  type="button"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors flex items-center gap-2 disabled:opacity-60"
                  type="button"
                  onClick={saveClient}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editing ? 'Save Client' : 'Create Client'}
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </StitchShell>
  );
}

