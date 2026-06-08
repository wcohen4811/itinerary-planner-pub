import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api/client';
import type { PricingLineItem, PricingDayItems, PricingTemplate, Occupancy, ItineraryMessageTemplate } from '../api/client';
import type { Day, ItineraryWithDays } from '../api/client';

export type UiDay = Pick<
  Day,
  | 'id'
  | 'dayNumber'
  | 'title'
  | 'description'
  | 'destination'
  | 'destinationId'
  | 'transferStatus'
  | 'transferCount'
  | 'accommodationLevel'
  | 'hotelName'
>;

export type UiItinerary = Pick<
  ItineraryWithDays,
  'id' | 'title' | 'description' | 'coverImageBase64' | 'startDate' | 'accommodationLevel' | 'messageTemplate' | 'blankPricing'
> & {
  days: UiDay[];
};

type Provider = { id: string; name: string; slug: string; active: boolean; surchargeUsd?: number | null };
type Destination = { id: string; name: string; slug: string; active: boolean };

function cloneItinerary(it: ItineraryWithDays): UiItinerary {
  return {
    id: it.id,
    title: it.title,
    description: it.description ?? '',
    coverImageBase64: it.coverImageBase64 ?? null,
    startDate: it.startDate,
    accommodationLevel: it.accommodationLevel,
    blankPricing: it.blankPricing ?? false,
    messageTemplate: (it as any).messageTemplate ?? null,
    days: it.days.map((d) => ({
      id: d.id,
      dayNumber: d.dayNumber,
      title: d.title,
      description: d.description,
      destination: d.destination,
      destinationId: d.destinationId ?? null,
      transferStatus: d.transferStatus,
      transferCount: d.transferCount ?? 0,
      accommodationLevel: d.accommodationLevel,
      hotelName: d.hotelName ?? '',
    })),
  };
}

function templatesEqual(a: ItineraryMessageTemplate | null | undefined, b: ItineraryMessageTemplate | null | undefined) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

export function useDashboardBackend() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ['dash-itins'],
    queryFn: () => api.listItineraries(),
  });
  const providersQuery = useQuery({
    queryKey: ['providers'],
    queryFn: () => api.listProviders(),
  });
  const [providerId, setProviderId] = useState<string | null>(null);
  useEffect(() => {
    if (providerId) return;
    const first = providersQuery.data?.providers?.[0];
    if (first) setProviderId(first.id);
  }, [providerId, providersQuery.data?.providers]);
  const destinationsQuery = useQuery({
    queryKey: ['provider-destinations', providerId],
    queryFn: () => api.listProviderDestinations(providerId!),
    enabled: !!providerId,
  });

  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [serverIt, setServerIt] = useState<ItineraryWithDays | null>(null);
  const [localIt, setLocalIt] = useState<UiItinerary | null>(null);
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  // Refs let the debounced autosave read the latest state without stale closures.
  const serverItRef = useRef<ItineraryWithDays | null>(null);
  const localItRef = useRef<UiItinerary | null>(null);
  const selectedIdRef = useRef<string | null>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const creatingRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    serverItRef.current = serverIt;
  }, [serverIt]);
  useEffect(() => {
    localItRef.current = localIt;
  }, [localIt]);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);
  const [pricingLevel, setPricingLevel] = useState<'3' | '4' | '5' | 'deluxe'>('3');
  const [pricingOccupancy, setPricingOccupancy] = useState<Occupancy>('double');
  const [pricingGeneralItems, setPricingGeneralItems] = useState<PricingLineItem[]>([]);
  const [pricingDayItems, setPricingDayItems] = useState<PricingDayItems[]>([]);
  const [pricingTemplates, setPricingTemplates] = useState<PricingTemplate[]>([]);
  const [templateLibrary, setTemplateLibrary] = useState<PricingTemplate[]>([]);
  const [templateLibraryLoading, setTemplateLibraryLoading] = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);

  const items = (list.data?.itineraries || []) as ItineraryWithDays[];
  const providers = (providersQuery.data?.providers || []) as Provider[];
  const destinations = (destinationsQuery.data?.destinations || []) as Destination[];
  const providerName = providers.find((p) => p.id === providerId)?.name ?? '';
  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((it) => it.title.toLowerCase().includes(q));
  }, [items, query]);

  async function selectItinerary(id: string) {
    setSelectedId(id);
    const res = await api.getItinerary(id);
    setServerIt(res.itinerary);
    setLocalIt(cloneItinerary(res.itinerary));
    setPricingLevel('3');
    setPricingOccupancy('double');
    await loadPricingItems(id, '3', 'double');
    await loadPricingTemplates('3', 'double');
  }

  async function loadPricingItems(id: string, level = pricingLevel, occupancy = pricingOccupancy) {
    setPricingLoading(true);
    try {
      const res = await api.listPricingLineItems(id, { level, occupancy });
      setPricingGeneralItems(res.generalItems);
      setPricingDayItems(res.days);
    } finally {
      setPricingLoading(false);
    }
  }

  async function loadPricingTemplates(level = pricingLevel, occupancy = pricingOccupancy) {
    const res = await api.listPricingTemplates({ level, occupancy });
    setPricingTemplates(res.templates);
  }

  async function loadTemplateLibrary() {
    setTemplateLibraryLoading(true);
    try {
      const res = await api.listPricingTemplates();
      setTemplateLibrary(res.templates);
    } finally {
      setTemplateLibraryLoading(false);
    }
  }

  function getSelected(): UiItinerary | null {
    return localIt;
  }

  function updateItineraryTitle(title: string) {
    setLocalIt((prev) => (prev ? { ...prev, title } : prev));
  }
  function updateItineraryDescription(description: string) {
    setLocalIt((prev) => (prev ? { ...prev, description } : prev));
  }
  function updateItineraryCover(coverImageBase64: string | null) {
    setLocalIt((prev) => (prev ? { ...prev, coverImageBase64 } : prev));
  }

  function updateItineraryMessageTemplate(messageTemplate: ItineraryMessageTemplate | null) {
    setLocalIt((prev) => (prev ? { ...prev, messageTemplate } : prev));
  }

  async function saveItineraryMessageTemplate(messageTemplate: ItineraryMessageTemplate | null) {
    if (!selectedId) return;
    const res = await api.updateItinerary(selectedId, { messageTemplate });
    setServerIt(res.itinerary);
    setLocalIt(cloneItinerary(res.itinerary));
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
  }

  function updateDay(dayId: string, patch: Partial<UiDay>) {
    setLocalIt((prev) =>
      prev
        ? {
            ...prev,
            days: prev.days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)),
          }
        : prev,
    );
  }
  function deleteDay(dayId: string) {
    setLocalIt((prev) => (prev ? { ...prev, days: prev.days.filter((d) => d.id !== dayId) } : prev));
  }
  function addDay() {
    const nid = `new-${Math.random().toString(36).slice(2, 8)}`;
    setLocalIt((prev) => {
      if (!prev) return prev;
      const nextNumber = (prev.days.reduce((m, d) => Math.max(m, d.dayNumber), 0) || 0) + 1;
      const newDay: UiDay = {
        id: nid,
        dayNumber: nextNumber,
        title: 'New Day',
        description: 'TBD',
        destination: 'TBD',
        destinationId: null,
        transferStatus: 'none',
        transferCount: 0,
        accommodationLevel: prev.accommodationLevel,
        hotelName: '',
      };
      return { ...prev, days: [...prev.days, newDay] };
    });
    return nid;
  }
  function moveDay(dayId: string, dir: -1 | 1) {
    setLocalIt((prev) => {
      if (!prev) return prev;
      const idx = prev.days.findIndex((d) => d.id === dayId);
      const j = idx + dir;
      if (idx < 0 || j < 0 || j >= prev.days.length) return prev;
      const arr = [...prev.days];
      [arr[idx], arr[j]] = [arr[j], arr[idx]];
      const renum = arr.map((d, i) => ({ ...d, dayNumber: i + 1 }));
      return { ...prev, days: renum };
    });
  }

  const updIt = useMutation({
    mutationFn: (body: any) => api.updateItinerary(selectedId!, body),
  });
  const delIt = useMutation({
    mutationFn: (id: string) => api.deleteItinerary(id),
  });
  const updDay = useMutation({
    mutationFn: ({ dayId, body }: { dayId: string; body: any }) => api.updateDay(selectedId!, dayId, body),
  });
  const delDay = useMutation({
    mutationFn: (dayId: string) => api.deleteDay(selectedId!, dayId),
  });

  // Debounced server-side autosave. Persists itinerary field edits, day field
  // edits, day creations, and day deletions to Postgres without a manual Save.
  async function runAutosave() {
    const selId = selectedIdRef.current;
    const server = serverItRef.current;
    const local = localItRef.current;
    if (!selId || !server || !local) return;
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }

    const serverById = new Map(server.days.map((d) => [d.id, d]));
    const localIds = new Set(local.days.map((d) => d.id));

    const itPatch: any = {};
    if (server.title !== local.title) itPatch.title = local.title;
    if ((server.description ?? '') !== (local.description ?? '')) itPatch.description = local.description ?? '';
    if ((server.coverImageBase64 ?? null) !== (local.coverImageBase64 ?? null)) {
      itPatch.coverImageBase64 = local.coverImageBase64 ?? null;
    }
    if (!templatesEqual((server as any).messageTemplate ?? null, local.messageTemplate ?? null)) {
      itPatch.messageTemplate = local.messageTemplate ?? null;
    }

    const creates = local.days.filter((ld) => ld.id.startsWith('new-') || !serverById.has(ld.id));
    const updates = local.days.filter((ld) => {
      const sd = serverById.get(ld.id);
      if (!sd) return false;
      return (
        sd.dayNumber !== ld.dayNumber ||
        sd.title !== ld.title ||
        sd.description !== ld.description ||
        sd.destination !== ld.destination ||
        (sd.destinationId ?? null) !== (ld.destinationId ?? null) ||
        sd.transferStatus !== ld.transferStatus ||
        (sd.transferCount ?? 0) !== (ld.transferCount ?? 0) ||
        sd.accommodationLevel !== ld.accommodationLevel ||
        (sd.hotelName ?? '') !== (ld.hotelName ?? '')
      );
    });
    const deletions = server.days.filter((sd) => !localIds.has(sd.id));

    if (!Object.keys(itPatch).length && creates.length === 0 && updates.length === 0 && deletions.length === 0) {
      return; // nothing to persist
    }

    savingRef.current = true;
    setAutosaveStatus('saving');
    try {
      if (Object.keys(itPatch).length) {
        await api.updateItinerary(selId, itPatch);
      }

      const idRemap = new Map<string, string>();
      for (const ld of creates) {
        if (creatingRef.current.has(ld.id)) continue;
        creatingRef.current.add(ld.id);
        try {
          const created = await api.createDay(selId, {
            dayNumber: ld.dayNumber,
            title: (ld.title || 'New Day').trim() || 'New Day',
            description: (ld.description || 'TBD').trim() || 'TBD',
            hotelName: ld.hotelName || undefined,
            destination: (ld.destination || 'TBD').trim() || 'TBD',
            destinationId: ld.destinationId ?? undefined,
            transferStatus: ld.transferStatus || 'none',
            transferCount: Math.max(0, ld.transferCount ?? 0),
            accommodationLevel: ld.accommodationLevel || server.accommodationLevel,
          });
          idRemap.set(ld.id, created.day.id);
        } finally {
          creatingRef.current.delete(ld.id);
        }
      }

      for (const ld of updates) {
        const sd = serverById.get(ld.id)!;
        const dPatch: any = {};
        if (sd.dayNumber !== ld.dayNumber) dPatch.dayNumber = ld.dayNumber;
        if (sd.title !== ld.title) dPatch.title = ld.title;
        if (sd.description !== ld.description) dPatch.description = ld.description;
        if (sd.destination !== ld.destination) dPatch.destination = ld.destination;
        if ((sd.destinationId ?? null) !== (ld.destinationId ?? null)) dPatch.destinationId = ld.destinationId ?? null;
        if (sd.transferStatus !== ld.transferStatus) dPatch.transferStatus = ld.transferStatus;
        if ((sd.transferCount ?? 0) !== (ld.transferCount ?? 0)) dPatch.transferCount = Math.max(0, ld.transferCount ?? 0);
        if (sd.accommodationLevel !== ld.accommodationLevel) dPatch.accommodationLevel = ld.accommodationLevel;
        if ((sd.hotelName ?? '') !== (ld.hotelName ?? '')) dPatch.hotelName = ld.hotelName ?? '';
        if (Object.keys(dPatch).length) {
          await api.updateDay(selId, ld.id, dPatch);
        }
      }

      for (const sd of deletions) {
        await api.deleteDay(selId, sd.id);
      }

      // Refresh the server snapshot (but keep local edits intact). Remap any
      // newly-created day ids so later diffs treat them as existing rows.
      const fresh = await api.getItinerary(selId);
      setServerIt(fresh.itinerary);
      if (idRemap.size) {
        setLocalIt((prev) =>
          prev
            ? { ...prev, days: prev.days.map((d) => (idRemap.has(d.id) ? { ...d, id: idRemap.get(d.id)! } : d)) }
            : prev,
        );
      }
      await qc.invalidateQueries({ queryKey: ['dash-itins'] });
      setAutosaveStatus('saved');
    } catch {
      setAutosaveStatus('error');
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
        autosaveTimer.current = setTimeout(() => void runAutosave(), 800);
      }
    }
  }

  useEffect(() => {
    if (!selectedId || !serverIt || !localIt) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => void runAutosave(), 1200);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localIt]);

  async function publish() {
    if (!serverIt || !localIt) return;
    // Update itinerary if changed
    const itPatch: any = {};
    if (serverIt.title !== localIt.title) itPatch.title = localIt.title;
    if ((serverIt.description ?? '') !== (localIt.description ?? '')) itPatch.description = localIt.description ?? '';
    if ((serverIt.coverImageBase64 ?? null) !== (localIt.coverImageBase64 ?? null)) {
      itPatch.coverImageBase64 = localIt.coverImageBase64 ?? null;
    }
    if (!templatesEqual((serverIt as any).messageTemplate ?? null, localIt.messageTemplate ?? null)) {
      itPatch.messageTemplate = localIt.messageTemplate ?? null;
    }
    if (Object.keys(itPatch).length) {
      await updIt.mutateAsync(itPatch);
    }
    // Compute day diffs
    const serverById = new Map(serverIt.days.map((d) => [d.id, d]));
    const localById = new Map(localIt.days.map((d) => [d.id, d]));
    // updates
    for (const [id, ld] of localById) {
      const sd = serverById.get(id);
      if (!sd) continue; // new day creation not supported here
      const dPatch: any = {};
      if (sd.dayNumber !== ld.dayNumber) dPatch.dayNumber = ld.dayNumber;
      if (sd.title !== ld.title) dPatch.title = ld.title;
      if (sd.description !== ld.description) dPatch.description = ld.description;
      if (sd.destination !== ld.destination) dPatch.destination = ld.destination;
      if ((sd.destinationId ?? null) !== (ld.destinationId ?? null)) dPatch.destinationId = ld.destinationId ?? null;
      if (sd.transferStatus !== ld.transferStatus) dPatch.transferStatus = ld.transferStatus;
      if ((sd.transferCount ?? 0) !== (ld.transferCount ?? 0)) dPatch.transferCount = Math.max(0, ld.transferCount ?? 0);
      if (sd.accommodationLevel !== ld.accommodationLevel) dPatch.accommodationLevel = ld.accommodationLevel;
      if ((sd.hotelName ?? '') !== (ld.hotelName ?? '')) dPatch.hotelName = ld.hotelName ?? '';
      if (Object.keys(dPatch).length) {
        await updDay.mutateAsync({ dayId: id, body: dPatch });
      }
    }
    // deletions
    for (const [id] of serverById) {
      if (!localById.has(id)) {
        await delDay.mutateAsync(id);
      }
    }
    // Refresh server state
    const fresh = await api.getItinerary(serverIt.id);
    setServerIt(fresh.itinerary);
    setLocalIt(cloneItinerary(fresh.itinerary));
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
  }

  async function publishWithOverrideDescription(description: string) {
    if (!serverIt) return;
    // First update itinerary with explicit description (and title if changed)
    const title = localIt?.title ?? serverIt.title;
    const itPatch: any = { description };
    if (title !== serverIt.title) itPatch.title = title;
    if ((serverIt.coverImageBase64 ?? null) !== (localIt?.coverImageBase64 ?? null)) {
      itPatch.coverImageBase64 = localIt?.coverImageBase64 ?? null;
    }
    if (!templatesEqual((serverIt as any).messageTemplate ?? null, localIt?.messageTemplate ?? null)) {
      itPatch.messageTemplate = localIt?.messageTemplate ?? null;
    }
    await updIt.mutateAsync(itPatch);

    // Refresh server state
    const fresh = await api.getItinerary(serverIt.id);
    setServerIt(fresh.itinerary);

    // Use latest localIt (keep user day edits) to compute diffs vs fresh
    const baseLocal = localIt ? { ...localIt, description } : cloneItinerary(fresh.itinerary);
    setLocalIt(baseLocal);

    const serverById = new Map(fresh.itinerary.days.map((d) => [d.id, d]));
    const localById = new Map(baseLocal.days.map((d) => [d.id, d]));
    // creations
    for (const [id, ld] of localById) {
      const isNew = id.startsWith('new-') || !serverById.has(id);
      if (!isNew) continue;
      // fill safe defaults
      const dayNumber = typeof ld.dayNumber === 'number' ? ld.dayNumber : (fresh.itinerary.days.length + 1);
      const title = (ld.title || 'New Day').trim() || 'New Day';
      const description = (ld.description || 'TBD').trim() || 'TBD';
      const destination = (ld.destination || 'TBD').trim() || 'TBD';
      const accommodationLevel = ld.accommodationLevel || fresh.itinerary.accommodationLevel;
      await api.createDay(serverIt.id, {
        dayNumber,
        title,
        description,
        hotelName: ld.hotelName || undefined,
        destination,
        destinationId: ld.destinationId ?? undefined,
        transferStatus: ld.transferStatus || 'none',
        transferCount: typeof ld.transferCount === 'number' ? Math.max(0, ld.transferCount) : 0,
        accommodationLevel,
      });
    }
    for (const [id, ld] of localById) {
      const sd = serverById.get(id);
      if (!sd) continue;
      const dPatch: any = {};
      if (sd.dayNumber !== ld.dayNumber) dPatch.dayNumber = ld.dayNumber;
      if (sd.title !== ld.title) dPatch.title = ld.title;
      if (sd.description !== ld.description) dPatch.description = ld.description;
      if (sd.destination !== ld.destination) dPatch.destination = ld.destination;
      if ((sd.destinationId ?? null) !== (ld.destinationId ?? null)) dPatch.destinationId = ld.destinationId ?? null;
      if (sd.transferStatus !== ld.transferStatus) dPatch.transferStatus = ld.transferStatus;
      if (sd.accommodationLevel !== ld.accommodationLevel) dPatch.accommodationLevel = ld.accommodationLevel;
      if ((sd.hotelName ?? '') !== (ld.hotelName ?? '')) dPatch.hotelName = ld.hotelName ?? '';
      if ((sd.transferCount ?? 0) !== (ld.transferCount ?? 0)) dPatch.transferCount = Math.max(0, ld.transferCount ?? 0);
      if (Object.keys(dPatch).length) {
        await updDay.mutateAsync({ dayId: id, body: dPatch });
      }
    }
    for (const [id] of serverById) {
      if (!localById.has(id)) {
        await delDay.mutateAsync(id);
      }
    }
    const finalFresh = await api.getItinerary(fresh.itinerary.id);
    setServerIt(finalFresh.itinerary);
    setLocalIt(cloneItinerary(finalFresh.itinerary));
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
  }

  async function duplicateFrom(id: string | null) {
    const sourceId = id ?? selectedId;
    if (!sourceId) return;
    const res = await api.getItinerary(sourceId);
    const src = res.itinerary;
    const created = await api.createItinerary({
      title: `${src.title} (Copy)`,
      description: src.description ?? '',
      startDate: src.startDate,
      accommodationLevel: src.accommodationLevel,
      messageTemplate: (src as any).messageTemplate ?? null,
      blankPricing: src.blankPricing ?? false,
    });
    const newId = created.itinerary.id;
    // Copy days
    for (const d of src.days) {
      await api.createDay(newId, {
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description,
        hotelName: d.hotelName ?? undefined,
        destination: d.destination,
        destinationId: d.destinationId ?? undefined,
        transferStatus: d.transferStatus,
        transferCount: d.transferCount ?? 0,
        accommodationLevel: d.accommodationLevel,
        date: d.date,
        activity: d.activityName || d.activityPriceUsd ? { name: d.activityName ?? undefined, priceUsd: d.activityPriceUsd ?? 0 } : undefined,
      });
    }
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
    await selectItinerary(newId);
  }

  async function createItineraryBlank(opts: {
    title: string;
    startDateIso: string;
    blankPricing: boolean;
    accommodationLevel?: ItineraryWithDays['accommodationLevel'];
  }) {
    const created = await api.createItinerary({
      title: opts.title.trim() || 'Untitled itinerary',
      startDate: opts.startDateIso,
      accommodationLevel: opts.accommodationLevel ?? '3',
      blankPricing: opts.blankPricing,
    });
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
    await selectItinerary(created.itinerary.id);
  }

  function updateDayItems(dayId: string, updater: (items: PricingLineItem[]) => PricingLineItem[]) {
    setPricingDayItems((prev) =>
      prev.map((d) => (d.dayId === dayId ? { ...d, items: updater(d.items) } : d)),
    );
  }

  async function addGeneralLineItem(input: { name: string; amountUsd: number; kind?: PricingLineItem['kind']; templateId?: string | null; saveTemplate?: boolean }) {
    if (!selectedId) return;
    const res = await api.createGeneralLineItem(selectedId, {
      ...input,
      accommodationLevel: pricingLevel,
      occupancy: pricingOccupancy,
    });
    setPricingGeneralItems((prev) => [...prev, res.item]);
    await loadPricingTemplates(pricingLevel, pricingOccupancy);
  }
  async function updateGeneralLineItem(itemId: string, patch: Partial<Pick<PricingLineItem, 'name' | 'amountUsd'>>) {
    if (!selectedId) return;
    const res = await api.updateGeneralLineItem(selectedId, itemId, patch);
    setPricingGeneralItems((prev) => prev.map((it) => (it.id === itemId ? res.item : it)));
  }
  async function deleteGeneralLineItem(itemId: string) {
    if (!selectedId) return;
    await api.deleteGeneralLineItem(selectedId, itemId);
    setPricingGeneralItems((prev) => prev.filter((it) => it.id !== itemId));
  }

  async function addDayLineItem(
    dayId: string,
    input: { name: string; amountUsd: number; kind?: PricingLineItem['kind']; templateId?: string | null; saveTemplate?: boolean },
  ) {
    if (!selectedId) return;
    const res = await api.createDayLineItem(selectedId, dayId, {
      ...input,
      accommodationLevel: pricingLevel,
      occupancy: pricingOccupancy,
    });
    updateDayItems(dayId, (items) => [...items, res.item]);
    await loadPricingTemplates(pricingLevel, pricingOccupancy);
  }
  async function updateDayLineItem(
    dayId: string,
    itemId: string,
    patch: Partial<Pick<PricingLineItem, 'name' | 'amountUsd'>>,
  ) {
    if (!selectedId) return;
    const res = await api.updateDayLineItem(selectedId, dayId, itemId, patch);
    updateDayItems(dayId, (items) => items.map((it) => (it.id === itemId ? res.item : it)));
  }
  async function deleteDayLineItem(dayId: string, itemId: string) {
    if (!selectedId) return;
    await api.deleteDayLineItem(selectedId, dayId, itemId);
    updateDayItems(dayId, (items) => items.filter((it) => it.id !== itemId));
  }

  async function createPricingTemplate(input: { name: string; kind?: PricingTemplate['kind']; amountUsd?: number }) {
    const res = await api.createPricingTemplate({
      ...input,
      accommodationLevel: pricingLevel,
      occupancy: pricingOccupancy,
    });
    await loadPricingTemplates(pricingLevel, pricingOccupancy);
    setTemplateLibrary((prev) => {
      if (prev.some((t) => t.id === res.template.id)) return prev;
      return [res.template, ...prev].sort((a, b) => a.name.localeCompare(b.name));
    });
    return res.template;
  }

  async function createTemplateLibrary(input: { name: string; kind?: PricingTemplate['kind']; amountUsd?: number }) {
    const res = await api.createPricingTemplate({
      ...input,
    });
    setTemplateLibrary((prev) => {
      if (prev.some((t) => t.id === res.template.id)) return prev;
      return [res.template, ...prev].sort((a, b) => a.name.localeCompare(b.name));
    });
    return res.template;
  }

  async function updatePricingTemplate(id: string, input: { name?: string; kind?: PricingTemplate['kind']; defaultAmountUsd?: number }) {
    const res = await api.updatePricingTemplate(id, input);
    setTemplateLibrary((prev) => prev.map((t) => (t.id === id ? res.template : t)));
    setPricingTemplates((prev) => prev.map((t) => (t.id === id ? res.template : t)));
    return res.template;
  }

  async function deletePricingTemplate(id: string) {
    await api.deletePricingTemplate(id);
    setTemplateLibrary((prev) => prev.filter((t) => t.id !== id));
  }

  async function deleteItinerary(id: string) {
    await delIt.mutateAsync(id);
    if (selectedId === id) {
      setSelectedId(null);
      setServerIt(null);
      setLocalIt(null);
    }
    await qc.invalidateQueries({ queryKey: ['dash-itins'] });
  }

  async function searchDayLibrary(queryText: string) {
    const res = await api.listDayLibrary(queryText);
    return res.days;
  }

  async function cloneDayFromLibrary(sourceDayId: string) {
    if (!selectedId) return;
    await api.cloneDayFromLibrary(selectedId, sourceDayId);
    const fresh = await api.getItinerary(selectedId);
    setServerIt(fresh.itinerary);
    setLocalIt(cloneItinerary(fresh.itinerary));
    await loadPricingItems(selectedId, pricingLevel, pricingOccupancy);
  }

  return {
    // panel data
    query,
    setQuery,
    items: filtered,
    providers,
    providerId,
    setProviderId,
    destinations,
    destinationsLoading: destinationsQuery.isLoading,
    providerName,
    // selection
    selectedId,
    selectItinerary,
    getSelected,
    pricingLevel,
    pricingOccupancy,
    pricingTemplates,
    templateLibrary,
    templateLibraryLoading,
    loadTemplateLibrary,
    setPricingLevel: async (lv: '3' | '4' | '5' | 'deluxe') => {
      setPricingLevel(lv);
      if (selectedId) {
        await loadPricingItems(selectedId, lv, pricingOccupancy);
        await loadPricingTemplates(lv, pricingOccupancy);
      }
    },
    setPricingOccupancy: async (occ: Occupancy) => {
      setPricingOccupancy(occ);
      if (selectedId) {
        await loadPricingItems(selectedId, pricingLevel, occ);
        await loadPricingTemplates(pricingLevel, occ);
      }
    },
    pricingGeneralItems,
    pricingDayItems,
    pricingLoading,
    addGeneralLineItem,
    updateGeneralLineItem,
    deleteGeneralLineItem,
    addDayLineItem,
    updateDayLineItem,
    deleteDayLineItem,
    createPricingTemplate,
    createTemplateLibrary,
    updatePricingTemplate,
    deletePricingTemplate,
    reloadPricingItems: () => (selectedId ? loadPricingItems(selectedId, pricingLevel, pricingOccupancy) : Promise.resolve()),
    // local edits
    updateItineraryTitle,
    updateItineraryDescription,
    updateItineraryCover,
    updateItineraryMessageTemplate,
    saveItineraryMessageTemplate,
    updateDay,
    deleteDay,
    addDay,
    moveDay,
    // actions
    publish,
    duplicateFrom,
    createItineraryBlank,
    deleteItinerary,
    searchDayLibrary,
    cloneDayFromLibrary,
    // status
    isLoading: list.isLoading,
    error: list.error as Error | null,
    autosaveStatus,
    publishWithOverrideDescription,
    async publishWithProgress(description: string, onProgress: (p: number) => void) {
      if (!serverIt) return;
      // Build diffs against current server snapshot and local state
      const title = localIt?.title ?? serverIt.title;
      const localSnapshot: UiItinerary =
        localIt ? { ...localIt, description, title } : cloneItinerary(serverIt);
      // Compute diffs
      const serverById = new Map(serverIt.days.map((d) => [d.id, d]));
      const localById = new Map(localSnapshot.days.map((d) => [d.id, d]));
      const creates = Array.from(localById.entries()).filter(([id]) => id.startsWith('new-') || !serverById.has(id));
      const updates = Array.from(localById.entries()).filter(([id, ld]) => {
        const sd = serverById.get(id);
        if (!sd) return false;
        return (
          sd.dayNumber !== ld.dayNumber ||
          sd.title !== ld.title ||
          sd.description !== ld.description ||
          sd.destination !== ld.destination ||
          (sd.destinationId ?? null) !== (ld.destinationId ?? null) ||
          sd.transferStatus !== ld.transferStatus ||
          (sd.transferCount ?? 0) !== (ld.transferCount ?? 0) ||
          sd.accommodationLevel !== ld.accommodationLevel ||
          (sd.hotelName ?? '') !== (ld.hotelName ?? '')
        );
      });
      const deletions = Array.from(serverById.keys()).filter((id) => !localById.has(id));

      const totalSteps = 1 + creates.length + updates.length + deletions.length + 1; // itinerary update + ops + final refresh
      let step = 0;
      const bump = () => {
        step += 1;
        onProgress(Math.min(1, step / totalSteps));
      };

      // 1) Update itinerary (title/description)
      const itPatch: any = {};
      if (serverIt.title !== title) itPatch.title = title;
      if ((serverIt.description ?? '') !== (description ?? '')) itPatch.description = description ?? '';
      if ((serverIt.coverImageBase64 ?? null) !== (localSnapshot.coverImageBase64 ?? null)) {
        itPatch.coverImageBase64 = localSnapshot.coverImageBase64 ?? null;
      }
      if (!templatesEqual((serverIt as any).messageTemplate ?? null, localSnapshot.messageTemplate ?? null)) {
        itPatch.messageTemplate = localSnapshot.messageTemplate ?? null;
      }
      if (Object.keys(itPatch).length) {
        await updIt.mutateAsync(itPatch);
      }
      bump();

      // 2) Create new days
      for (const [, ld] of creates) {
        const dayNumber = typeof ld.dayNumber === 'number' ? ld.dayNumber : (serverIt.days.length + 1);
        const titleD = (ld.title || 'New Day').trim() || 'New Day';
        const descriptionD = (ld.description || 'TBD').trim() || 'TBD';
      const destinationD = (ld.destination || 'TBD').trim() || 'TBD';
        const accommodationLevelD = ld.accommodationLevel || serverIt.accommodationLevel;
        await api.createDay(serverIt.id, {
          dayNumber,
          title: titleD,
          description: descriptionD,
          hotelName: ld.hotelName || undefined,
          destination: destinationD,
        destinationId: ld.destinationId ?? undefined,
          transferStatus: ld.transferStatus || 'none',
          transferCount: typeof ld.transferCount === 'number' ? Math.max(0, ld.transferCount) : 0,
          accommodationLevel: accommodationLevelD,
        });
        bump();
      }

      // 3) Update changed days
      for (const [id, ld] of updates) {
        const sd = serverById.get(id)!;
        const dPatch: any = {};
        if (sd.dayNumber !== ld.dayNumber) dPatch.dayNumber = ld.dayNumber;
        if (sd.title !== ld.title) dPatch.title = ld.title;
        if (sd.description !== ld.description) dPatch.description = ld.description;
        if (sd.destination !== ld.destination) dPatch.destination = ld.destination;
        if ((sd.destinationId ?? null) !== (ld.destinationId ?? null)) dPatch.destinationId = ld.destinationId ?? null;
        if (sd.transferStatus !== ld.transferStatus) dPatch.transferStatus = ld.transferStatus;
        if ((sd.transferCount ?? 0) !== (ld.transferCount ?? 0)) dPatch.transferCount = Math.max(0, ld.transferCount ?? 0);
        if (sd.accommodationLevel !== ld.accommodationLevel) dPatch.accommodationLevel = ld.accommodationLevel;
        if ((sd.hotelName ?? '') !== (ld.hotelName ?? '')) dPatch.hotelName = ld.hotelName ?? '';
        if (Object.keys(dPatch).length) {
          await updDay.mutateAsync({ dayId: id, body: dPatch });
        }
        bump();
      }

      // 4) Delete removed days
      for (const id of deletions) {
        await delDay.mutateAsync(id);
        bump();
      }

      // 5) Final refresh
      const finalFresh = await api.getItinerary(serverIt.id);
      setServerIt(finalFresh.itinerary);
      setLocalIt(cloneItinerary(finalFresh.itinerary));
      await qc.invalidateQueries({ queryKey: ['dash-itins'] });
      await loadPricingItems(serverIt.id);
      bump(); // complete
    },
    async importItinerariesFromJson(json: any) {
      const payload = Array.isArray(json?.itineraries) || json?.title ? json : { itineraries: json };
      const res = await api.importItineraries(payload);
      await qc.invalidateQueries({ queryKey: ['dash-itins'] });
      const id = res.itineraryIds?.[0];
      if (id) await selectItinerary(id);
      return res;
    },
  };
}


