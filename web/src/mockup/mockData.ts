export type MockView =
  | 'hub'
  | 'itineraries'
  | 'pricing'
  | 'proposals'
  | 'clients'
  | 'providers'
  | 'admin'
  | 'system';

export const hubNodes: {
  id: Exclude<MockView, 'hub'>;
  label: string;
  icon: string;
  stat: string;
  angle: number;
}[] = [
  { id: 'itineraries', label: 'Itineraries', icon: 'map', stat: '12 live trips', angle: -90 },
  { id: 'proposals', label: 'Proposals', icon: 'description', stat: '42% conversion', angle: -38 },
  { id: 'clients', label: 'Clients', icon: 'people', stat: '3 new leads', angle: 14 },
  { id: 'providers', label: 'Providers', icon: 'storefront', stat: '6 partners', angle: 66 },
  { id: 'pricing', label: 'Pricing Library', icon: 'payments', stat: '41 SKUs', angle: 118 },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', stat: 'secured', angle: 170 },
  { id: 'system', label: 'System / Access', icon: 'security', stat: 'online', angle: -142 },
];

export const mockItineraries = [
  {
    id: 'it-1',
    title: 'Cape Town & Winelands Escape',
    days: 8,
    pax: 2,
    total: 4820,
    status: 'Draft',
    cover: 'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=200&q=60',
  },
  {
    id: 'it-2',
    title: 'Kruger Safari + Victoria Falls',
    days: 10,
    pax: 4,
    total: 9150,
    status: 'Draft',
    cover: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=200&q=60',
  },
  {
    id: 'it-3',
    title: 'Garden Route Honeymoon',
    days: 12,
    pax: 2,
    total: 6740,
    status: 'Draft',
    cover: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=200&q=60',
  },
];

export const mockDays = [
  {
    n: 1,
    title: 'Arrival in Cape Town',
    dest: 'Cape Town',
    transfers: 1,
    room: 'Deluxe King',
    hotel: 'The Silo Hotel',
    desc: 'Private airport transfer. Check-in at The Silo. Sunset welcome drinks on the terrace overlooking the V&A Waterfront.',
    items: [
      { name: 'The Silo — Deluxe King', amount: 620, kind: 'hotel' },
      { name: 'Airport transfer (private)', amount: 85, kind: 'custom' },
    ],
  },
  {
    n: 2,
    title: 'Table Mountain & City',
    dest: 'Cape Town',
    transfers: 2,
    room: 'Deluxe King',
    hotel: 'The Silo Hotel',
    desc: 'Morning cable-car ascent. Afternoon walking tour of the Bo-Kaap and Company Gardens.',
    items: [
      { name: 'Table Mountain tickets', amount: 42, kind: 'activity' },
      { name: 'Private city guide', amount: 180, kind: 'activity' },
    ],
  },
  {
    n: 3,
    title: 'Cape Peninsula',
    dest: 'Cape Point',
    transfers: 1,
    room: 'Deluxe King',
    hotel: 'The Silo Hotel',
    desc: 'Full-day peninsula circuit: Chapman’s Peak, Boulders Beach penguins, Cape of Good Hope.',
    items: [
      { name: 'Peninsula day tour', amount: 260, kind: 'activity' },
      { name: 'Picnic lunch', amount: 55, kind: 'custom' },
    ],
  },
];

export const mockGeneralItems = [
  { name: 'Trip design fee', amount: 250, kind: 'general' },
  { name: 'Travel insurance', amount: 140, kind: 'general' },
];

export const mockFees = [{ name: 'Park conservation levy', amount: 48, kind: 'fee' }];

export const mockTemplates = [
  { name: 'Private safari vehicle (full day)', sku: 'SAF-VEH-FD', kind: 'activity', amount: 420 },
  { name: 'Deluxe lodge — double', sku: 'LOD-DLX-DBL', kind: 'hotel', amount: 580 },
  { name: 'Airport meet & greet', sku: 'TRN-MNG-001', kind: 'custom', amount: 65 },
  { name: 'Trip design fee', sku: 'GEN-DSN-001', kind: 'general', amount: 250 },
  { name: 'Conservation levy', sku: 'FEE-CON-001', kind: 'fee', amount: 48 },
];

export type MockClientRow = {
  id: string;
  first: string;
  last: string;
  email: string;
  itinerary: string;
  start: string;
  pax: number;
  added: string;
  fromIntake?: boolean;
  source?: string;
};

export const mockClients: MockClientRow[] = [
  { id: 'cl-amelia', first: 'Amelia', last: 'Hart', email: 'amelia.hart@example.com', itinerary: 'Garden Route Honeymoon', start: '2026-11-12', pax: 2, added: 'Oct 2, 2026' },
  { id: 'cl-james', first: 'James', last: 'Okoye', email: 'j.okoye@example.com', itinerary: 'Kruger Safari + Victoria Falls', start: '2026-12-04', pax: 4, added: 'Sep 18, 2026' },
  { id: 'cl-sofia', first: 'Sofia', last: 'Reyes', email: 'sofia.reyes@example.com', itinerary: 'Cape Town & Winelands Escape', start: 'Dates TBD', pax: 2, added: 'Oct 8, 2026' },
  { id: 'cl-noah', first: 'Noah', last: 'Adeyemi', email: 'noah.adeyemi@example.com', itinerary: 'Kruger Safari + Victoria Falls', start: '2027-01-08', pax: 4, added: 'Sep 20, 2026' },
];

export type IntakeStatus = 'new' | 'needs_review' | 'duplicate' | 'accepted' | 'discarded';

export type MockIntakeLead = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  itineraryTitle: string;
  travelStartDate: string;
  passengers: number;
  accommodationLevel: string;
  occupancy: string;
  tripType: string;
  notes: string;
  source: 'jotform';
  formId: string;
  formName: string;
  externalId: string;
  receivedAt: string;
  receivedLabel: string;
  status: IntakeStatus;
};

export const mockJotformSpecs = {
  forms: [
    { id: 'jf-trip', name: 'Trip inquiry' },
    { id: 'jf-honey', name: 'Honeymoon request' },
  ],
  itineraries: [
    'Cape Town & Winelands Escape',
    'Kruger Safari + Victoria Falls',
    'Garden Route Honeymoon',
  ],
  levels: ['3', '4', '5', 'Deluxe'],
  occupancy: ['single', 'double', 'triple'],
  tripTypes: ['safari', 'honeymoon', 'family'],
  fieldMap: [
    { jotform: 'Name.first', client: 'firstName' },
    { jotform: 'Name.last', client: 'lastName' },
    { jotform: 'Email', client: 'email' },
    { jotform: 'Trip interest', client: 'itineraryTitle' },
    { jotform: 'Travel start', client: 'travelStartDate' },
    { jotform: 'Passengers', client: 'passengers' },
    { jotform: 'Accommodation', client: 'accommodationLevel' },
    { jotform: 'Occupancy', client: 'occupancy' },
    { jotform: 'Trip type', client: 'tripType' },
    { jotform: 'Notes', client: 'notes' },
  ],
  webhookUrl: 'https://api.savtrails.com/webhooks/jotform?token=••••••••',
  lastPing: '2 minutes ago',
};

export const seedIntakeLeads: MockIntakeLead[] = [
  {
    id: 'lead-1',
    firstName: 'Lucas',
    lastName: 'Chen',
    email: 'lucas.chen@example.com',
    itineraryTitle: 'Kruger Safari + Victoria Falls',
    travelStartDate: '2026-12-18',
    passengers: 2,
    accommodationLevel: '5',
    occupancy: 'double',
    tripType: 'safari',
    notes: 'Prefer morning game drives. First time in Africa.',
    source: 'jotform',
    formId: 'jf-trip',
    formName: 'Trip inquiry',
    externalId: 'SUB-10482',
    receivedAt: '2026-10-14T06:40:00Z',
    receivedLabel: '2m ago',
    status: 'new',
  },
  {
    id: 'lead-2',
    firstName: 'Amelia',
    lastName: 'Hart',
    email: 'amelia.hart@example.com',
    itineraryTitle: 'Garden Route Honeymoon',
    travelStartDate: '2026-11-12',
    passengers: 2,
    accommodationLevel: 'Deluxe',
    occupancy: 'double',
    tripType: 'honeymoon',
    notes: 'Upgrade request from the original inquiry.',
    source: 'jotform',
    formId: 'jf-honey',
    formName: 'Honeymoon request',
    externalId: 'SUB-10479',
    receivedAt: '2026-10-14T05:10:00Z',
    receivedLabel: '1h ago',
    status: 'duplicate',
  },
  {
    id: 'lead-3',
    firstName: 'Priya',
    lastName: '',
    email: 'priya.n@example.com',
    itineraryTitle: 'Cape Town & Winelands Escape',
    travelStartDate: '',
    passengers: 2,
    accommodationLevel: '4',
    occupancy: 'double',
    tripType: 'honeymoon',
    notes: 'Last name and dates missing on the form.',
    source: 'jotform',
    formId: 'jf-honey',
    formName: 'Honeymoon request',
    externalId: 'SUB-10471',
    receivedAt: '2026-10-14T02:22:00Z',
    receivedLabel: '4h ago',
    status: 'needs_review',
  },
  {
    id: 'lead-4',
    firstName: 'Noah',
    lastName: 'Adeyemi',
    email: 'noah.adeyemi@example.com',
    itineraryTitle: 'Kruger Safari + Victoria Falls',
    travelStartDate: '2027-01-08',
    passengers: 4,
    accommodationLevel: '5',
    occupancy: 'triple',
    tripType: 'family',
    notes: 'Two adults, two children (8 and 11).',
    source: 'jotform',
    formId: 'jf-trip',
    formName: 'Trip inquiry',
    externalId: 'SUB-10460',
    receivedAt: '2026-10-13T18:05:00Z',
    receivedLabel: 'Yesterday',
    status: 'accepted',
  },
];

export type MockNotification = {
  id: string;
  leadId: string;
  title: string;
  detail: string;
  time: string;
  read: boolean;
  formName: string;
  kind?: 'intake' | 'followup';
  clientId?: string;
};

export const seedNotifications: MockNotification[] = [
  { id: 'n-1', leadId: 'lead-1', title: 'Lucas Chen submitted Trip inquiry', detail: 'Kruger Safari · 2 pax', time: '2m ago', read: false, formName: 'Trip inquiry', kind: 'intake' },
  { id: 'n-2', leadId: 'lead-2', title: 'Amelia Hart submitted Honeymoon request', detail: 'Possible duplicate', time: '1h ago', read: false, formName: 'Honeymoon request', kind: 'intake' },
  { id: 'n-3', leadId: 'lead-3', title: 'Priya submitted Honeymoon request', detail: 'Needs review — missing fields', time: '4h ago', read: false, formName: 'Honeymoon request', kind: 'intake' },
  { id: 'n-fu-sofia', leadId: '', title: 'Follow-up due: Sofia Reyes', detail: 'Cape Town Escape · 3-day follow-up', time: 'today', read: false, formName: 'Follow-up', kind: 'followup', clientId: 'cl-sofia' },
];

export function createSimulatedLead(n: number): MockIntakeLead {
  return {
    id: `lead-sim-${n}`,
    firstName: 'Maya',
    lastName: `Guest ${n}`,
    email: `maya.guest${n}@example.com`,
    itineraryTitle: 'Cape Town & Winelands Escape',
    travelStartDate: '2026-11-20',
    passengers: 2,
    accommodationLevel: '5',
    occupancy: 'double',
    tripType: 'honeymoon',
    notes: 'Simulated Jotform webhook payload.',
    source: 'jotform',
    formId: 'jf-trip',
    formName: 'Trip inquiry',
    externalId: `SUB-SIM-${n}`,
    receivedAt: new Date().toISOString(),
    receivedLabel: 'just now',
    status: 'new',
  };
}

export function unreadIntakeCount(leads: MockIntakeLead[]) {
  return leads.filter((l) => l.status === 'new' || l.status === 'needs_review' || l.status === 'duplicate').length;
}

export const mockDrafts = [
  { title: "Amelia's Trip to Garden Route", updated: 'Oct 12, 2026 4:18 PM' },
  { title: "James's Trip to Kruger Safari", updated: 'Oct 9, 2026 11:02 AM' },
  { title: 'Untitled proposal', updated: 'Oct 3, 2026 9:41 AM' },
];

export const mockFlights = [
  { airline: 'SA', from: 'JFK', to: 'JNB', time: '10:40 → 08:15+1' },
  { airline: 'SA', from: 'JNB', to: 'CPT', time: '10:20 → 12:25' },
];

export const mockProviders = [
  { name: 'Wilderness Safaris', active: true },
  { name: 'andBeyond', active: true },
  { name: 'Cape Classic Tours', active: true },
  { name: 'Royal Portfolio', active: false },
];

export const mockDestinations = [
  { name: 'Cape Town', slug: 'cape-town' },
  { name: 'Stellenbosch', slug: 'stellenbosch' },
  { name: 'Franschhoek', slug: 'franschhoek' },
];

export const mockAccommodation = [
  { level: '4', base: 320, from: 'Jan 1, 2026', to: 'Dec 31, 2026' },
  { level: '5', base: 540, from: 'Jan 1, 2026', to: 'Dec 31, 2026' },
  { level: 'deluxe', base: 820, from: 'Jan 1, 2026', to: 'Dec 31, 2026' },
];

export const mockTransfers = [
  { level: '4', type: 'private', vis: 'shared', add: 45, from: 'Jan 1, 2026', to: 'Dec 31, 2026' },
  { level: '5', type: 'private', vis: 'exclusive', add: 85, from: 'Jan 1, 2026', to: 'Dec 31, 2026' },
];

export const mockActivities = [
  { name: 'Table Mountain cable car', desc: 'Return tickets, skip-the-line window.' },
  { name: 'Winelands tasting flight', desc: 'Three estates, private driver.' },
];

/** Future GET /ai/briefing — daily custom greeting from the AI API. */
export type MockAiBriefing = {
  date: string;
  greeting: string;
  body: string;
  salesLine: string;
  source: 'ai-briefing';
  generatedAt: string;
};

export type MockEmailFormat = {
  id: string;
  name: string;
  subject: string;
  body: string;
};

export const seedEmailFormats: MockEmailFormat[] = [
  {
    id: 'fmt-follow',
    name: 'Follow-up',
    subject: 'Checking in on {{itinerary}}',
    body: 'Hi {{firstName}},\n\nJust checking in on the {{itinerary}} proposal. Happy to adjust dates or lodges if you want a different pace.\n\nSavtrails',
  },
  {
    id: 'fmt-proposal',
    name: 'Proposal attached',
    subject: 'Your {{itinerary}} proposal',
    body: 'Hi {{firstName}},\n\nI’ve attached the {{itinerary}} proposal ({{quoted}}). Open it when you have a moment and tell me what you’d like to lock in.\n\nSavtrails',
  },
  {
    id: 'fmt-checkin',
    name: 'Check-in',
    subject: 'Quick note on your trip',
    body: 'Hi {{firstName}},\n\nHope planning is going smoothly. Anything you want me to add to {{itinerary}}?\n\nSavtrails',
  },
  {
    id: 'fmt-blank',
    name: 'Blank',
    subject: '',
    body: '',
  },
];

export type EmailDir = 'out' | 'in';
export type EmailKind = 'note' | 'proposal' | 'followup';
export type EmailTracking = 'sent' | 'opened' | 'clicked';

export type MockEmailMessage = {
  id: string;
  clientId: string;
  dir: EmailDir;
  kind: EmailKind;
  subject: string;
  body: string;
  at: string;
  proposalId?: string;
  tracking?: EmailTracking;
  origin?: 'manual' | 'auto';
};

export const seedEmailMessages: MockEmailMessage[] = [
  { id: 'em-am-1', clientId: 'cl-amelia', dir: 'in', kind: 'note', subject: 'Garden Route dates', body: 'Hi — November 12 still works for us. Can you send a luxury version?', at: 'Oct 8, 2026 9:14 AM' },
  { id: 'em-am-2', clientId: 'cl-amelia', dir: 'out', kind: 'proposal', subject: "Amelia's Trip to Garden Route", body: 'Hi Amelia,\n\nProposal attached for the Garden Route honeymoon — $13,480 for two. Lodges are held informally through mid-November.', at: 'Oct 12, 2026 4:18 PM', proposalId: 'pr-1', tracking: 'clicked' },
  { id: 'em-am-3', clientId: 'cl-amelia', dir: 'in', kind: 'note', subject: 'Re: Garden Route', body: 'This looks perfect. We’ll take it — please book.', at: 'Oct 13, 2026 10:02 AM' },
  { id: 'em-ja-1', clientId: 'cl-james', dir: 'out', kind: 'proposal', subject: "James's Trip to Kruger Safari", body: 'Hi James,\n\nKruger + Vic Falls for four. Quoted $36,600. Let me know if you want morning drives only.', at: 'Oct 9, 2026 11:02 AM', proposalId: 'pr-2', tracking: 'clicked' },
  { id: 'em-ja-2', clientId: 'cl-james', dir: 'in', kind: 'note', subject: 'Re: Kruger', body: 'Clicked through — looking at the lodge nights now. Can we add an extra night at Vic Falls?', at: 'Oct 10, 2026 3:40 PM' },
  { id: 'em-so-1', clientId: 'cl-sofia', dir: 'out', kind: 'proposal', subject: "Sofia's Cape Town Escape", body: 'Hi Sofia,\n\nCape Town & Winelands draft is in — $9,640. Dates still TBD on your side.', at: 'Oct 3, 2026 9:41 AM', proposalId: 'pr-3', tracking: 'opened' },
  { id: 'em-so-2', clientId: 'cl-sofia', dir: 'in', kind: 'note', subject: 'Re: Cape Town', body: 'Opened it. We’ll confirm dates after work travel clears.', at: 'Oct 4, 2026 8:11 AM' },
  { id: 'em-no-1', clientId: 'cl-noah', dir: 'out', kind: 'proposal', subject: 'Family Kruger draft', body: 'Hi Noah,\n\nFamily Kruger draft for four — $22,100. Kids 8 and 11 noted.', at: 'Sep 28, 2026 2:15 PM', proposalId: 'pr-4', tracking: 'opened' },
  { id: 'em-no-2', clientId: 'cl-noah', dir: 'in', kind: 'note', subject: 'Re: Family Kruger', body: 'Going to hold for now — school calendar shifted.', at: 'Sep 30, 2026 5:02 PM' },
];

export type TrackedProposalStatus = 'sent' | 'opened' | 'clicked' | 'won' | 'lost';

export type MockTrackedProposal = {
  id: string;
  title: string;
  client: string;
  clientId: string;
  messageId: string;
  sentAt: string;
  status: TrackedProposalStatus;
  opens: number;
  clicks: number;
  quotedUsd: number;
  marginPct: number;
  bookedUsd: number;
};

export const mockTrackedProposals: MockTrackedProposal[] = [
  { id: 'pr-1', title: "Amelia's Trip to Garden Route", client: 'Amelia Hart', clientId: 'cl-amelia', messageId: 'em-am-2', sentAt: 'Oct 12, 2026', status: 'won', opens: 4, clicks: 2, quotedUsd: 13480, marginPct: 16, bookedUsd: 13480 },
  { id: 'pr-2', title: "James's Trip to Kruger Safari", client: 'James Okoye', clientId: 'cl-james', messageId: 'em-ja-1', sentAt: 'Oct 9, 2026', status: 'clicked', opens: 3, clicks: 1, quotedUsd: 36600, marginPct: 19, bookedUsd: 0 },
  { id: 'pr-3', title: "Sofia's Cape Town Escape", client: 'Sofia Reyes', clientId: 'cl-sofia', messageId: 'em-so-1', sentAt: 'Oct 3, 2026', status: 'opened', opens: 1, clicks: 0, quotedUsd: 9640, marginPct: 15, bookedUsd: 0 },
  { id: 'pr-4', title: 'Family Kruger draft', client: 'Noah Adeyemi', clientId: 'cl-noah', messageId: 'em-no-1', sentAt: 'Sep 28, 2026', status: 'lost', opens: 2, clicks: 0, quotedUsd: 22100, marginPct: 14, bookedUsd: 0 },
];

export type MockSalesSnapshot = {
  totalSalesYtd: number;
  totalSalesMonth: number;
  avgMarginPct: number;
  proposalsSent: number;
  proposalsWon: number;
  conversionPct: number;
  emailsOpened: number;
  emailsClicked: number;
};

/** Booked sales before the current tracked window — keeps YTD stable when only live rows change. */
export const PRIOR_SALES_YTD = 170720;

export function formatUsd(n: number) {
  return `$${n.toLocaleString()}`;
}

export function rollupSales(proposals: MockTrackedProposal[]): MockSalesSnapshot {
  const sent = proposals.length;
  const won = proposals.filter((p) => p.status === 'won');
  const month = won.reduce((sum, p) => sum + p.bookedUsd, 0);
  const avg = won.length ? Math.round(won.reduce((sum, p) => sum + p.marginPct, 0) / won.length) : 0;
  return {
    totalSalesMonth: month,
    totalSalesYtd: PRIOR_SALES_YTD + month,
    avgMarginPct: avg,
    proposalsSent: sent,
    proposalsWon: won.length,
    conversionPct: sent ? Math.round((won.length / sent) * 100) : 0,
    emailsOpened: proposals.reduce((sum, p) => sum + p.opens, 0),
    emailsClicked: proposals.reduce((sum, p) => sum + p.clicks, 0),
  };
}

export function salesLine(snapshot: MockSalesSnapshot) {
  return `You have booked ${formatUsd(snapshot.totalSalesMonth)} this month. Year-to-date sales are ${formatUsd(snapshot.totalSalesYtd)}.`;
}

export function applyEmailTokens(text: string, vars: { firstName: string; itinerary: string; quoted: string }) {
  return text.replace(/\{\{\s*(firstName|itinerary|quoted)\s*\}\}/g, (_, key: keyof typeof vars) => vars[key] ?? '');
}

export function applySaleStatus(proposal: MockTrackedProposal, status: 'won' | 'lost'): MockTrackedProposal {
  return {
    ...proposal,
    status,
    bookedUsd: status === 'won' ? proposal.quotedUsd : 0,
  };
}

export type FollowUpJobStatus = 'scheduled' | 'due' | 'sent' | 'skipped' | 'cancelled';

export type MockFollowUpStep = {
  id: string;
  delayDays: number;
  formatId: string;
  enabled: boolean;
};

export type ManualFollowUpMode = 'rewrite' | 'cancel';

export type MockFollowUpSequence = {
  enabled: boolean;
  cancelOnReply: boolean;
  cancelOnSale: boolean;
  onManual: ManualFollowUpMode;
  steps: MockFollowUpStep[];
};

export type MockFollowUpJob = {
  id: string;
  clientId: string;
  proposalId?: string;
  stepId: string;
  formatId: string;
  delayDays: number;
  dueInDays: number;
  dueLabel: string;
  status: FollowUpJobStatus;
  subject?: string;
  body?: string;
  auto: boolean;
  origin: 'manual' | 'auto';
  sentBy?: 'manual' | 'auto';
  rewrittenFrom?: string;
};

export const seedFollowUpSequence: MockFollowUpSequence = {
  enabled: true,
  cancelOnReply: true,
  cancelOnSale: true,
  onManual: 'rewrite',
  steps: [
    { id: 'step-1', delayDays: 3, formatId: 'fmt-follow', enabled: true },
    { id: 'step-2', delayDays: 7, formatId: 'fmt-checkin', enabled: true },
  ],
};

export function followUpDueLabel(dueInDays: number) {
  if (dueInDays < 0) return `${Math.abs(dueInDays)}d overdue`;
  if (dueInDays === 0) return 'due today';
  if (dueInDays === 1) return 'tomorrow';
  return `in ${dueInDays} days`;
}

export function jobsFromSequence(
  sequence: MockFollowUpSequence,
  proposal: MockTrackedProposal,
  clientId: string,
): MockFollowUpJob[] {
  if (!sequence.enabled) return [];
  if (proposal.status === 'won' || proposal.status === 'lost') return [];
  return sequence.steps
    .filter((step) => step.enabled)
    .map((step) => ({
      id: `fu-${proposal.id}-${step.id}-${Date.now()}`,
      clientId,
      proposalId: proposal.id,
      stepId: step.id,
      formatId: step.formatId,
      delayDays: step.delayDays,
      dueInDays: step.delayDays,
      dueLabel: followUpDueLabel(step.delayDays),
      status: step.delayDays <= 0 ? 'due' : 'scheduled',
      auto: true,
      origin: 'auto',
    }));
}

export function advanceFollowUpJobs(jobs: MockFollowUpJob[]): MockFollowUpJob[] {
  return jobs.map((job) => {
    if (job.status !== 'scheduled' && job.status !== 'due') return job;
    const dueInDays = job.dueInDays - 1;
    return {
      ...job,
      dueInDays,
      dueLabel: followUpDueLabel(dueInDays),
      status: dueInDays <= 0 ? 'due' : 'scheduled',
    };
  });
}

export function activeFollowUps(jobs: MockFollowUpJob[]) {
  return jobs.filter((j) => j.status === 'scheduled' || j.status === 'due');
}

export function dueFollowUps(jobs: MockFollowUpJob[]) {
  return jobs.filter((j) => j.status === 'due' || (j.status === 'scheduled' && j.dueInDays <= 0));
}

export function pendingFollowUps(jobs: MockFollowUpJob[], clientId: string, proposalId?: string) {
  return jobs
    .filter(
      (j) =>
        j.clientId === clientId &&
        (j.status === 'scheduled' || j.status === 'due') &&
        (!proposalId || !j.proposalId || j.proposalId === proposalId),
    )
    .sort((a, b) => a.dueInDays - b.dueInDays || a.delayDays - b.delayDays);
}

/** Manual follow-up consumes the next (or specified) auto step, then cancels or rewrites the rest from that send. */
export function applyManualFollowUp(
  jobs: MockFollowUpJob[],
  opts: {
    clientId: string;
    proposalId?: string;
    consumedId?: string;
    messageId: string;
    mode: ManualFollowUpMode;
  },
): MockFollowUpJob[] {
  const pending = pendingFollowUps(jobs, opts.clientId, opts.proposalId);
  const consumed = (opts.consumedId ? jobs.find((j) => j.id === opts.consumedId) : pending[0]) ?? null;
  if (!consumed || (consumed.status !== 'scheduled' && consumed.status !== 'due')) return jobs;
  const remaining = pending.filter((j) => j.id !== consumed.id);

  return jobs.map((job) => {
    if (job.id === consumed.id) {
      return {
        ...job,
        status: 'sent',
        sentBy: 'manual',
        auto: false,
        origin: 'manual',
        dueLabel: 'sent · manual',
        rewrittenFrom: opts.messageId,
      };
    }
    if (!remaining.some((r) => r.id === job.id)) return job;
    if (opts.mode === 'cancel' || job.delayDays <= consumed.delayDays) {
      return {
        ...job,
        status: 'cancelled',
        dueLabel: 'cancelled · covered by manual',
        rewrittenFrom: opts.messageId,
      };
    }
    const gap = Math.max(0, job.delayDays - consumed.delayDays);
    return {
      ...job,
      dueInDays: gap,
      dueLabel: followUpDueLabel(gap),
      status: gap <= 0 ? 'due' : 'scheduled',
      rewrittenFrom: opts.messageId,
    };
  });
}

export const seedFollowUpJobs: MockFollowUpJob[] = [
  { id: 'fu-james-1', clientId: 'cl-james', proposalId: 'pr-2', stepId: 'step-1', formatId: 'fmt-follow', delayDays: 3, dueInDays: 1, dueLabel: followUpDueLabel(1), status: 'scheduled', auto: true, origin: 'auto' },
  { id: 'fu-sofia-1', clientId: 'cl-sofia', proposalId: 'pr-3', stepId: 'step-1', formatId: 'fmt-follow', delayDays: 3, dueInDays: 0, dueLabel: followUpDueLabel(0), status: 'due', auto: true, origin: 'auto' },
  { id: 'fu-sofia-2', clientId: 'cl-sofia', proposalId: 'pr-3', stepId: 'step-2', formatId: 'fmt-checkin', delayDays: 7, dueInDays: 4, dueLabel: followUpDueLabel(4), status: 'scheduled', auto: true, origin: 'auto' },
  { id: 'fu-amelia-1', clientId: 'cl-amelia', proposalId: 'pr-1', stepId: 'step-1', formatId: 'fmt-follow', delayDays: 3, dueInDays: 0, dueLabel: 'cancelled', status: 'cancelled', auto: true, origin: 'auto' },
  { id: 'fu-noah-1', clientId: 'cl-noah', proposalId: 'pr-4', stepId: 'step-1', formatId: 'fmt-follow', delayDays: 3, dueInDays: 0, dueLabel: 'cancelled', status: 'cancelled', auto: true, origin: 'auto' },
];

export function createInquiryMessage(clientId: string, draft: Pick<MockIntakeLead, 'firstName' | 'formName' | 'itineraryTitle' | 'passengers' | 'notes'>): MockEmailMessage {
  return {
    id: `em-inq-${clientId}-${Date.now()}`,
    clientId,
    dir: 'in',
    kind: 'note',
    subject: `${draft.formName} received`,
    body: `${draft.firstName} submitted ${draft.formName} for ${draft.itineraryTitle} · ${draft.passengers} pax.${draft.notes ? `\n\n${draft.notes}` : ''}`,
    at: 'just now',
  };
}

export function clientFromLead(draft: MockIntakeLead, id: string): MockClientRow {
  return {
    id,
    first: draft.firstName,
    last: draft.lastName || '—',
    email: draft.email,
    itinerary: draft.itineraryTitle,
    start: draft.travelStartDate || 'Dates TBD',
    pax: draft.passengers,
    added: 'Oct 14, 2026',
    fromIntake: true,
    source: 'Jotform',
  };
}

/** Future GET /metrics/sales — rolled up from sent proposals + email tracking + pricing. */
export const mockSalesSnapshot = rollupSales(mockTrackedProposals);

export const mockAiBriefing: MockAiBriefing = {
  date: '2026-10-14',
  greeting: 'Welcome back.',
  body: 'Garden Route inquiries are leading this week. Two honeymoon forms landed overnight — worth a morning pass through New Clients.',
  salesLine: salesLine(mockSalesSnapshot),
  source: 'ai-briefing',
  generatedAt: '2026-10-14T06:00:00Z',
};

export const kindTone: Record<string, string> = {
  hotel: 'bg-indigo-500/15 text-indigo-300',
  activity: 'bg-amber-500/15 text-amber-300',
  general: 'bg-sky-500/15 text-sky-300',
  fee: 'bg-emerald-500/15 text-emerald-300',
  custom: 'bg-slate-500/20 text-slate-300',
};
