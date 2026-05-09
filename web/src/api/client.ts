export type Itinerary = {
  id: string;
  title: string;
  description?: string | null;
  coverImageBase64?: string | null;
  messageTemplate?: ItineraryMessageTemplate | null;
  startDate: string;
  endDate?: string;
  accommodationLevel: '3' | '4' | '5' | 'deluxe';
  /** When true, new days omit auto-created hotel/activity pricing placeholders until you add line items. */
  blankPricing?: boolean;
  totalPriceUsd: number;
  createdAt: string;
  updatedAt: string;
  createdByName?: string | null;
  updatedByName?: string | null;
};

export type Day = {
  id: string;
  itineraryId: string;
  dayNumber: number;
  title: string;
  description: string;
  hotelName?: string | null;
  destination: string;
  destinationId?: string | null;
  date?: string;
  dayOfWeek?: string;
  accommodationLevel: '3' | '4' | '5' | 'deluxe';
  transferStatus: 'in' | 'out' | 'none';
  transferCount?: number;
  activityName?: string | null;
  activityPriceUsd?: number;
  accommodationPriceUsd?: number;
  transferPriceUsd?: number;
  destinationPriceUsd?: number;
  totalPriceUsd?: number;
};

export type ItineraryMessageTemplate = {
  greeting?: string;
  cabinAvailability?: string;
  flightPricing?: string;
  generalMessage?: string;
  keyDetails?: string;
  inclusions?: string[];
  exclusions?: string[];
  discounts?: {
    label?: string;
    message?: string;
    startDate?: string | null;
    endDate?: string | null;
  }[];
};

export type ItineraryWithDays = Itinerary & { days: Day[] };

export type Client = {
  id: string;
  firstName: string;
  lastName: string;
  email?: string | null;
  itineraryId?: string | null;
  itinerary?: { id: string; title: string } | null;
  travelStartDate?: string | null;
  passengers: number;
  accommodationLevel: Itinerary['accommodationLevel'];
  occupancy: Occupancy;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PricingLine = {
  dayNumber: number;
  priceUsd: number;
  breakdown: {
    accommodationPriceUsd?: number;
    transferPriceUsd?: number;
    destinationPriceUsd?: number;
    activityPriceUsd?: number;
  };
};

export type ItineraryPricing = {
  currency: string;
  totalPriceUsd: number;
  lines: PricingLine[];
};

export type DayPricingRow = {
  dayId: string;
  dayNumber: number;
  title: string;
  activityPriceUsd: number;
  transferPriceUsd: number;
  accommodationPriceUsd: number;
  totalPriceUsd: number;
};

export type PricingLineItemKind = 'hotel' | 'activity' | 'custom' | 'general' | 'fee';
export type Occupancy = 'single' | 'double' | 'triple';

export type PricingLineItem = {
  id: string;
  name: string;
  amountUsd: number;
  kind: PricingLineItemKind;
  templateId?: string | null;
  accommodationLevel?: Itinerary['accommodationLevel'];
  occupancy?: Occupancy;
};

export type PricingDayItems = {
  dayId: string;
  dayNumber: number;
  title: string;
  items: PricingLineItem[];
};

export type PricingLineItemsResponse = {
  generalItems: PricingLineItem[];
  days: PricingDayItems[];
};

export type PricingTemplate = {
  id: string;
  name: string;
  sku: string;
  kind: PricingLineItemKind;
  defaultAmountUsd: number;
  amountUsd?: number;
};

export type DayLibraryItem = {
  id: string;
  title: string;
  dayNumber: number;
  itineraryId: string;
  itineraryTitle: string;
  description: string;
  hotelName?: string | null;
  destination: string;
  transferCount?: number;
  accommodationLevel: Itinerary['accommodationLevel'];
};

export type ProposalDraft = {
  id: string;
  title: string;
  data: any;
  createdAt: string;
  updatedAt: string;
};

async function http<T = any>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return (await res.json()) as T;
  // @ts-ignore
  return null;
}

export type ImportTitleConflict = {
  code: 'TITLE_EXISTS';
  importedTitle: string;
  existingItinerary: { id: string; title: string };
};

export class ImportTitleConflictError extends Error {
  readonly conflict: ImportTitleConflict;

  constructor(conflict: ImportTitleConflict) {
    super('An itinerary with this title already exists');
    this.name = 'ImportTitleConflictError';
    this.conflict = conflict;
  }
}

async function importItinerariesHttp(payload: unknown): Promise<{
  itineraryIds: string[];
  createdNewItinerary?: boolean[];
  createdItineraryIds: string[];
}> {
  const res = await fetch('/admin/import-itineraries', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const ct = res.headers.get('content-type') || '';
  const data = ct.includes('application/json') ? ((await res.json()) as Record<string, unknown>) : null;

  if (res.status === 409 && data && data.code === 'TITLE_EXISTS') {
    throw new ImportTitleConflictError(data as unknown as ImportTitleConflict);
  }
  if (!res.ok) {
    const msg = (data && typeof data.error === 'string' && data.error) || String(res.statusText);
    throw new Error(msg);
  }
  return data as {
    itineraryIds: string[];
    createdNewItinerary?: boolean[];
    createdItineraryIds: string[];
  };
}

export const api = {
  listItineraries: () => http<{ itineraries: ItineraryWithDays[] }>('/itineraries'),
  getItinerary: (id: string) => http<{ itinerary: ItineraryWithDays }>(`/itineraries/${id}`),
  updateItinerary: (
    id: string,
    body: Partial<
      Pick<
        Itinerary,
        'title' | 'description' | 'coverImageBase64' | 'startDate' | 'accommodationLevel' | 'createdByName' | 'updatedByName' | 'messageTemplate'
      >
    >,
  ) =>
    http<{ itinerary: ItineraryWithDays }>(`/itineraries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  createItinerary: (body: {
    title: string;
    description?: string | null;
    startDate: string;
    accommodationLevel: Itinerary['accommodationLevel'];
    messageTemplate?: ItineraryMessageTemplate | null;
    blankPricing?: boolean;
  }) =>
    http<{ itinerary: ItineraryWithDays }>('/itineraries', { method: 'POST', body: JSON.stringify(body) }),
  deleteItinerary: (id: string) => http<void>(`/itineraries/${id}`, { method: 'DELETE' }),
  listItineraryDays: (itineraryId: string) => http<{ days: Day[] }>(`/itineraries/${itineraryId}/days`),
  createDay: (
    itineraryId: string,
    body: Partial<Pick<Day, 'dayNumber' | 'title' | 'description' | 'hotelName' | 'destination' | 'destinationId' | 'transferStatus' | 'transferCount' | 'accommodationLevel' | 'date' | 'dayOfWeek' | 'activityName'>> & {
      activity?: { name?: string; priceUsd?: number };
    },
  ) =>
    http<{ day: Day }>(`/itineraries/${itineraryId}/days`, { method: 'POST', body: JSON.stringify(body) }),
  updateDay: (
    itineraryId: string,
    dayId: string,
    body: Partial<Pick<Day, 'dayNumber' | 'title' | 'description' | 'hotelName' | 'destination' | 'destinationId' | 'transferStatus' | 'transferCount' | 'accommodationLevel' | 'date' | 'dayOfWeek' | 'activityName'>> & {
      activity?: { name?: string; priceUsd?: number };
    },
  ) => http<{ day: Day }>(`/itineraries/${itineraryId}/days/${dayId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDay: (itineraryId: string, dayId: string) => http<void>(`/itineraries/${itineraryId}/days/${dayId}`, { method: 'DELETE' }),
  getPricing: (itineraryId: string) => http<ItineraryPricing>(`/itineraries/${itineraryId}/pricing`),
  listProviders: () => http<{ providers: { id: string; name: string; slug: string; active: boolean; surchargeUsd?: number | null }[] }>('/providers'),
  listProviderDestinations: (providerId: string) =>
    http<{ destinations: { id: string; name: string; slug: string; active: boolean }[] }>(`/providers/${providerId}/destinations`),
  listDestinationAccommodation: (id: string) => http<{ rows: any[] }>(`/destinations/${id}/prices/accommodation`),
  listDestinationTransfer: (id: string) => http<{ rows: any[] }>(`/destinations/${id}/prices/transfer`),
  listDestinationActivities: (id: string) => http<{ activities: any[] }>(`/destinations/${id}/activities`),
  listDestinationActivityPrices: (id: string, activityId: string) => http<{ prices: any[] }>(`/destinations/${id}/activities/${activityId}/prices`),
  importItineraries: (payload: unknown) => importItinerariesHttp(payload),
  listDayPricingByLevel: (itineraryId: string, level: '3' | '4' | '5' | 'deluxe') =>
    http<{ rows: DayPricingRow[] }>(`/itineraries/${itineraryId}/pricing/levels/${level}`),
  updateDayPricing: (
    itineraryId: string,
    dayId: string,
    level: '3' | '4' | '5' | 'deluxe',
    body: Partial<Pick<DayPricingRow, 'activityPriceUsd' | 'transferPriceUsd' | 'accommodationPriceUsd'>>,
  ) => http<{ row: any }>(`/itineraries/${itineraryId}/pricing/levels/${level}/days/${dayId}`, { method: 'PUT', body: JSON.stringify(body) }),
  listPricingLineItems: (itineraryId: string, params: { level: Itinerary['accommodationLevel']; occupancy: Occupancy }) =>
    http<PricingLineItemsResponse>(`/itineraries/${itineraryId}/pricing/line-items?level=${params.level}&occupancy=${params.occupancy}`),
  createGeneralLineItem: (itineraryId: string, body: { name: string; amountUsd: number; kind?: PricingLineItemKind; templateId?: string | null; accommodationLevel: Itinerary['accommodationLevel']; occupancy: Occupancy; saveTemplate?: boolean }) =>
    http<{ item: PricingLineItem }>(`/itineraries/${itineraryId}/pricing/line-items`, { method: 'POST', body: JSON.stringify(body) }),
  updateGeneralLineItem: (itineraryId: string, itemId: string, body: Partial<Pick<PricingLineItem, 'name' | 'amountUsd'>>) =>
    http<{ item: PricingLineItem }>(`/itineraries/${itineraryId}/pricing/line-items/${itemId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteGeneralLineItem: (itineraryId: string, itemId: string) =>
    http<void>(`/itineraries/${itineraryId}/pricing/line-items/${itemId}`, { method: 'DELETE' }),
  createDayLineItem: (itineraryId: string, dayId: string, body: { name: string; amountUsd: number; kind?: PricingLineItemKind; templateId?: string | null; accommodationLevel: Itinerary['accommodationLevel']; occupancy: Occupancy; saveTemplate?: boolean }) =>
    http<{ item: PricingLineItem }>(`/itineraries/${itineraryId}/days/${dayId}/pricing/items`, { method: 'POST', body: JSON.stringify(body) }),
  updateDayLineItem: (itineraryId: string, dayId: string, itemId: string, body: Partial<Pick<PricingLineItem, 'name' | 'amountUsd'>>) =>
    http<{ item: PricingLineItem }>(`/itineraries/${itineraryId}/days/${dayId}/pricing/items/${itemId}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteDayLineItem: (itineraryId: string, dayId: string, itemId: string) =>
    http<void>(`/itineraries/${itineraryId}/days/${dayId}/pricing/items/${itemId}`, { method: 'DELETE' }),
  listPricingTemplates: (params?: { level?: Itinerary['accommodationLevel']; occupancy?: Occupancy; kind?: PricingLineItemKind }) => {
    const qp = new URLSearchParams();
    if (params?.level) qp.set('level', params.level);
    if (params?.occupancy) qp.set('occupancy', params.occupancy);
    if (params?.kind) qp.set('kind', params.kind);
    const qs = qp.toString();
    return http<{ templates: PricingTemplate[] }>(`/pricing/templates${qs ? `?${qs}` : ''}`);
  },
  createPricingTemplate: (body: { name: string; kind?: PricingLineItemKind; amountUsd?: number; accommodationLevel?: Itinerary['accommodationLevel']; occupancy?: Occupancy }) =>
    http<{ template: PricingTemplate }>(`/pricing/templates`, { method: 'POST', body: JSON.stringify(body) }),
  updatePricingTemplate: (id: string, body: { name?: string; kind?: PricingLineItemKind; defaultAmountUsd?: number }) =>
    http<{ template: PricingTemplate }>(`/pricing/templates/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deletePricingTemplate: (id: string) => http<void>(`/pricing/templates/${id}`, { method: 'DELETE' }),
  listDayLibrary: (query: string) =>
    http<{ days: DayLibraryItem[] }>(`/itineraries/library/days?q=${encodeURIComponent(query)}`),
  cloneDayFromLibrary: (itineraryId: string, sourceDayId: string) =>
    http<{ day: Day }>(`/itineraries/${itineraryId}/days/clone`, { method: 'POST', body: JSON.stringify({ sourceDayId }) }),
  listProposalDrafts: () => http<{ drafts: ProposalDraft[] }>(`/proposals/drafts`),
  createProposalDraft: (body: { title?: string; data: any }) =>
    http<{ draft: ProposalDraft }>(`/proposals/drafts`, { method: 'POST', body: JSON.stringify(body) }),
  updateProposalDraft: (id: string, body: { title?: string; data: any }) =>
    http<{ draft: ProposalDraft }>(`/proposals/drafts/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  sendProposalEmail: (body: { from?: string; to?: string; cc?: string; subject: string; data: any; testMode?: boolean }) =>
    http<{ id: string | null }>(`/proposals/send-email`, { method: 'POST', body: JSON.stringify(body) }),
  listClients: (params?: { sort?: 'name' | 'createdAt' | 'itinerary'; query?: string }) => {
    const qp = new URLSearchParams();
    if (params?.sort) qp.set('sort', params.sort);
    if (params?.query) qp.set('query', params.query);
    const qs = qp.toString();
    return http<{ clients: Client[] }>(`/clients${qs ? `?${qs}` : ''}`);
  },
  createClient: (body: {
    firstName: string;
    lastName: string;
    email?: string | null;
    itineraryId?: string | null;
    travelStartDate?: string | null;
    passengers: number;
    accommodationLevel: Itinerary['accommodationLevel'];
    occupancy: Occupancy;
    notes?: string | null;
  }) => http<{ client: Client }>(`/clients`, { method: 'POST', body: JSON.stringify(body) }),
  updateClient: (
    id: string,
    body: Partial<{
      firstName: string;
      lastName: string;
      email?: string | null;
      itineraryId?: string | null;
      travelStartDate?: string | null;
      passengers: number;
      accommodationLevel: Itinerary['accommodationLevel'];
      occupancy: Occupancy;
      notes?: string | null;
    }>,
  ) => http<{ client: Client }>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteClient: (id: string) => http<void>(`/clients/${id}`, { method: 'DELETE' }),
};


