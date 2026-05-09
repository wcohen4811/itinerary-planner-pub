import { useEffect, useRef, useState } from 'react';
import { useItineraries } from '../services/itineraries';
import { api } from '../api/client';
import type { ItineraryWithDays, ProposalDraft, Client, ItineraryMessageTemplate } from '../api/client';
import StitchShell from '../components/StitchShell';
import { compileItineraryMessageParagraphs, splitMessageParagraphs } from '../utils/itineraryMessageTemplate';

type ViewMode = 'SELECTION' | 'EDITOR' | 'SEND';

type FlightRow = {
  id: string;
  airlineCode: string;
  flightNumber: string;
  from: string;
  to: string;
  depart: string;
  arrive: string;
  dateLabel?: string;
};

type ProposalData = {
  title: string;
  clientName: string;
  leadId: string;
  clientId?: string;
  startDate: string;
  preparedBy: string;
  firstLastFlightOverride: boolean;
  travelers: number;
  travelDates: string;
  baseItineraryId: string;
  templateSourceItineraryId: string;
  itineraryMessageTemplate: ItineraryMessageTemplate | null;
  personalMessage: string;
  aiPrompt: string;
  airfareRaw: string;
  airfarePriceUsd: number;
  discountPct: number;
  discountDeadline: string;
  pricingMarginPct: number;
  flights: FlightRow[];
  earlyBooking: boolean;
  pricing: {
    fourStar: number;
    fiveStar: number;
    taxes: number;
  };
};

const leadOptions = [
  { id: 'lead-123', name: 'Smith Family' },
  { id: 'lead-124', name: 'John Doe' },
];

const blankProposal: ProposalData = {
  title: 'New Proposal',
  clientName: leadOptions[0]?.name ?? 'New Lead',
  leadId: leadOptions[0]?.id ?? 'lead-123',
  clientId: undefined,
  startDate: '',
  preparedBy: 'Public',
  firstLastFlightOverride: false,
  travelers: 2,
  travelDates: '',
  baseItineraryId: '',
  templateSourceItineraryId: '',
  itineraryMessageTemplate: null,
  personalMessage: '',
  aiPrompt: '',
  airfareRaw: '',
  airfarePriceUsd: 0,
  discountPct: 0,
  discountDeadline: '',
  pricingMarginPct: 33,
  flights: [],
  earlyBooking: false,
  pricing: {
    fourStar: 2450,
    fiveStar: 3800,
    taxes: 450,
  },
};

function toTime(raw: string): string {
  const cleaned = raw.trim();
  if (!/^\d{3,4}$/.test(cleaned)) return '';
  const padded = cleaned.padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

function toTimeWithMeridiem(raw: string, meridiem?: string): string {
  const cleaned = raw.trim();
  if (!/^\d{3,4}$/.test(cleaned)) return '';
  const padded = cleaned.padStart(4, '0');
  let hours = Number(padded.slice(0, 2));
  const minutes = padded.slice(2);
  if (meridiem) {
    const m = meridiem.toUpperCase();
    if (m === 'P' && hours < 12) hours += 12;
    if (m === 'A' && hours === 12) hours = 0;
  }
  const hh = String(hours).padStart(2, '0');
  return `${hh}:${minutes}`;
}

function parseFlights(raw: string): FlightRow[] {
  const lines = raw
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const monthMap: Record<string, string> = {
    JAN: 'Jan',
    FEB: 'Feb',
    MAR: 'Mar',
    APR: 'Apr',
    MAY: 'May',
    JUN: 'Jun',
    JUL: 'Jul',
    AUG: 'Aug',
    SEP: 'Sep',
    OCT: 'Oct',
    NOV: 'Nov',
    DEC: 'Dec',
  };
  return lines.map((line, idx) => {
    const tokens = line.split(/\s+/);
    const flightMatch = line.match(/\b([A-Z]{2})\s*([0-9]{1,4})\b/);
    const dateMatch = line.match(/\b(\d{1,2})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/i);
    const dateLabel = dateMatch ? `${monthMap[dateMatch[2].toUpperCase()] ?? dateMatch[2].toUpperCase()} ${dateMatch[1].padStart(2, '0')}` : undefined;
    const airports = tokens.filter((t) => /^[A-Z]{3}$/.test(t));
    const timeMatches = Array.from(line.matchAll(/\b(\d{3,4})([AP])\b/gi));
    const times =
      timeMatches.length >= 2
        ? timeMatches.slice(0, 2).map((m) => toTimeWithMeridiem(m[1], m[2]))
        : (line.match(/\b(\d{3,4})\b/g) || []).slice(0, 2).map(toTime);
    return {
      id: `${Date.now()}-${idx}`,
      airlineCode: flightMatch?.[1] ?? 'XX',
      flightNumber: flightMatch?.[2] ?? '000',
      from: airports[0]?.toUpperCase() ?? 'FROM',
      to: airports[1]?.toUpperCase() ?? 'TO',
      depart: times[0] || '00:00',
      arrive: times[1] || '00:00',
      dateLabel,
    };
  });
}

export default function ProposalsTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('SELECTION');
  const [sendSubject, setSendSubject] = useState('');
  const [sendFrom, setSendFrom] = useState('');
  const [sendTo, setSendTo] = useState('');
  const [sendCc, setSendCc] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendDone, setSendDone] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendDoneLabel, setSendDoneLabel] = useState<string | null>(null);
  const [proposalData, setProposalData] = useState<ProposalData>(blankProposal);
  const [baseItinerary, setBaseItinerary] = useState<ItineraryWithDays | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [drafts, setDrafts] = useState<ProposalDraft[]>([]);
  const [draftsLoading, setDraftsLoading] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [pricingLevel, setPricingLevel] = useState<'3' | '4' | '5' | 'deluxe'>('3');
  const [pricingOccupancy, setPricingOccupancy] = useState<'single' | 'double' | 'triple'>('double');
  const [pricingBaseUsd, setPricingBaseUsd] = useState(0);
  const [pricingFeesUsd, setPricingFeesUsd] = useState(0);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [splitPercent, setSplitPercent] = useState(() => {
    try {
      const raw = localStorage.getItem('itineraryplanner.proposals.splitPercent');
      const parsed = raw ? Number(raw) : 55;
      if (!Number.isFinite(parsed)) return 55;
      return Math.min(70, Math.max(35, parsed));
    } catch {
      return 55;
    }
  });
  const dragRef = useRef(false);
  const splitRef = useRef<HTMLDivElement>(null);

  const itinerariesQuery = useItineraries();
  const itineraries = itinerariesQuery.data?.itineraries ?? [];

  useEffect(() => {
    let active = true;
    setClientsLoading(true);
    api
      .listClients({ sort: 'name' })
      .then((res) => {
        if (active) setClients(res.clients);
      })
      .finally(() => {
        if (active) setClientsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  async function loadDrafts() {
    setDraftsLoading(true);
    try {
      const res = await api.listProposalDrafts();
      setDrafts(res.drafts);
    } finally {
      setDraftsLoading(false);
    }
  }

  useEffect(() => {
    loadDrafts();
  }, []);

  useEffect(() => {
    let active = true;
    const id = proposalData.baseItineraryId;
    if (!id) {
      setBaseItinerary(null);
      setProposalData((prev) => ({
        ...prev,
        templateSourceItineraryId: '',
        itineraryMessageTemplate: null,
      }));
      return;
    }
    setBaseLoading(true);
    api
      .getItinerary(id)
      .then((res) => {
        if (active) setBaseItinerary(res.itinerary);
      })
      .finally(() => {
        if (active) setBaseLoading(false);
      });
    return () => {
      active = false;
    };
  }, [proposalData.baseItineraryId]);

  useEffect(() => {
    if (!baseItinerary?.id) return;
    setProposalData((prev) => {
      if (prev.templateSourceItineraryId === baseItinerary.id) return prev;
      return {
        ...prev,
        templateSourceItineraryId: baseItinerary.id,
        itineraryMessageTemplate: baseItinerary.messageTemplate ?? null,
      };
    });
  }, [baseItinerary?.id]);

  useEffect(() => {
    if (!proposalData.baseItineraryId) return;
    setPricingLevel('3');
    setPricingOccupancy('double');
  }, [proposalData.baseItineraryId]);

  useEffect(() => {
    const id = proposalData.baseItineraryId;
    if (!id) {
      setPricingBaseUsd(0);
      setPricingFeesUsd(0);
      return;
    }
    setPricingLoading(true);
    api
      .listPricingLineItems(id, { level: pricingLevel, occupancy: pricingOccupancy })
      .then((res) => {
        const feeTotal = res.generalItems.filter((i) => i.kind === 'fee').reduce((s, i) => s + i.amountUsd, 0);
        const generalTotal = res.generalItems.filter((i) => i.kind !== 'fee').reduce((s, i) => s + i.amountUsd, 0);
        const dayTotal = res.days.reduce((s, d) => s + d.items.reduce((t, i) => t + i.amountUsd, 0), 0);
        setPricingBaseUsd(generalTotal + dayTotal);
        setPricingFeesUsd(feeTotal);
      })
      .finally(() => setPricingLoading(false));
  }, [proposalData.baseItineraryId, pricingLevel, pricingOccupancy]);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const node = splitRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(70, Math.max(35, percent));
      setSplitPercent(clamped);
    }
    function onUp() {
      dragRef.current = false;
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('itineraryplanner.proposals.splitPercent', String(splitPercent));
    } catch {}
  }, [splitPercent]);

  const pricingOptions = (['3', '4', '5', 'deluxe'] as const).flatMap((lv) =>
    (['single', 'double', 'triple'] as const).map((occ) => ({
      value: `${lv}-${occ}`,
      level: lv,
      occupancy: occ,
      label: `${lv === 'deluxe' ? 'Deluxe' : `${lv} Star`} ${occ}`,
    })),
  );
  const selectedPricingLabel =
    pricingOptions.find((opt) => opt.level === pricingLevel && opt.occupancy === pricingOccupancy)?.label ??
    `${pricingLevel} ${pricingOccupancy}`;
  const marginPct = Math.max(0, Math.min(100, Math.floor(proposalData.pricingMarginPct || 0)));
  const marginFactor = Math.max(0.01, 1 - marginPct / 100);
  const baseWithMarginUsd = Math.round(pricingBaseUsd / marginFactor);
  const airfareUsd = Math.max(0, Math.floor(proposalData.airfarePriceUsd || 0));
  const discountPct = Math.max(0, Math.min(100, Math.floor(proposalData.discountPct || 0)));
  const discountAmountUsd = Math.min(baseWithMarginUsd, Math.round((baseWithMarginUsd * discountPct) / 100));
  const discountedBaseUsd = Math.max(0, baseWithMarginUsd - discountAmountUsd);
  const totalAfterDiscountUsd = discountedBaseUsd + pricingFeesUsd + airfareUsd;
  const finalTotalUsd = totalAfterDiscountUsd;
  const manualParagraphs = splitMessageParagraphs(proposalData.personalMessage);
  const templateParagraphs = compileItineraryMessageParagraphs({
    template: proposalData.itineraryMessageTemplate ?? null,
    clientName: proposalData.clientName?.trim() || clientFirstName(),
    itineraryName: itineraryName(),
    airfareUsd,
    startDate: proposalData.startDate || baseItinerary?.startDate,
    discountPercentage: discountPct,
    discountDeadline: proposalData.discountDeadline,
  });
  const messageParagraphs = [...manualParagraphs, ...templateParagraphs];
  const travelersCount = Math.max(1, proposalData.travelers || 1);
  const daysCount = baseItinerary?.days.length ?? 0;
  const nightsCount = Math.max(0, daysCount - 1);
  const fallbackInclusions = [
    'Private Airport Transfers',
    'All 5-Star Accommodations',
    'Daily Gourmet Breakfast',
    'Machu Picchu Entrance Fees',
    'English-speaking Private Guide',
  ];
  const fallbackExclusions = ['International Airfare', 'Travel Insurance', 'Optional Gratuities'];
  const sidebarInclusions =
    proposalData.itineraryMessageTemplate?.inclusions && proposalData.itineraryMessageTemplate.inclusions.length
      ? proposalData.itineraryMessageTemplate.inclusions
      : fallbackInclusions;
  const sidebarExclusions =
    proposalData.itineraryMessageTemplate?.exclusions && proposalData.itineraryMessageTemplate.exclusions.length
      ? proposalData.itineraryMessageTemplate.exclusions
      : fallbackExclusions;

  const leadOptionsResolved = clients.length
    ? clients.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))
    : leadOptions;

  function dayLabel(dayNumber: number) {
    if (!proposalData.startDate) return `Day ${dayNumber}`;
    const base = new Date(`${proposalData.startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) return `Day ${dayNumber}`;
    const d = new Date(base);
    d.setDate(base.getDate() + (dayNumber - 1));
    const formatted = d.toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    return `Day ${dayNumber} (${formatted})`;
  }

  function dayTags(day: ItineraryWithDays['days'][number], totalDays: number) {
    const text = `${day.title ?? ''} ${day.description ?? ''}`.toLowerCase();
    const tags: { icon: string; label: string }[] = [];
    const hasFlight = /\b(flight|fly|air|airport)\b/.test(text);
    const hasTransfer =
      /\b(transfer|drive|transport|pickup|drop-off|dropoff|shuttle)\b/.test(text) ||
      (day as any).transferCount > 0;
    if (hasFlight) tags.push({ icon: 'flight_takeoff', label: 'Flight' });
    if (hasTransfer) tags.push({ icon: 'directions_car', label: 'Transfer' });
    if (
      proposalData.firstLastFlightOverride &&
      totalDays > 0 &&
      (day.dayNumber === 1 || day.dayNumber === totalDays) &&
      !tags.some((t) => t.label === 'Flight')
    ) {
      tags.push({ icon: 'flight_takeoff', label: 'Flight' });
    }
    return tags;
  }

  function tripDateLabel() {
    if (!proposalData.startDate) return 'TBD';
    const base = new Date(`${proposalData.startDate}T00:00:00`);
    if (Number.isNaN(base.getTime())) return 'TBD';
    const formatted = base.toLocaleDateString(undefined, {
      month: 'long',
      day: '2-digit',
      year: 'numeric',
    });
    return formatted;
  }

  function clientFirstName() {
    const name = proposalData.clientName?.trim() || '';
    if (!name) return 'Client';
    return name.split(' ')[0] || name;
  }

  function itineraryName() {
    if (!baseItinerary?.title) return 'Itinerary';
    return baseItinerary.title.replace(/\s*\([^)]*\)\s*$/, '').trim() || baseItinerary.title;
  }

  function proposalHeading() {
    return `${clientFirstName()}'s Trip to ${itineraryName()} | ${tripDateLabel()}`;
  }

  function resetSendFields() {
    const defaultSubject = proposalHeading();
    const clientEmail = clients.find((c) => c.id === proposalData.clientId)?.email ?? '';
    setSendSubject(defaultSubject);
    setSendFrom('noreply@example.com');
    setSendTo(clientEmail);
    setSendCc('');
    setSendDone(false);
    setSendError(null);
    setSendDoneLabel(null);
  }

  useEffect(() => {
    if (viewMode === 'SEND') {
      resetSendFields();
    }
  }, [viewMode]);

  // removed test-mode autoset (now manual buttons)

  function buildEmailData() {
    const days = baseItinerary?.days ?? [];
    return {
      logoUrl: 'https://s3-eu-west-1.amazonaws.com/tpd/logos/56cdc0d60000ff000589570b/0x0.png',
      companyName: 'SA Vacations',
      preparedBy: proposalData.preparedBy || 'Public',
      heading: proposalHeading(),
      messageParagraphs: messageParagraphs.length ? messageParagraphs : ['Add a personalized message to show here.'],
      airfareUsd,
      travelersCount,
      daysCount,
      nightsCount,
      accommodationLabel: selectedPricingLabel,
      inclusions: sidebarInclusions,
      exclusions: sidebarExclusions,
      flights: proposalData.flights.map((f) => ({
        airlineCode: f.airlineCode,
        flightNumber: f.flightNumber,
        from: f.from,
        to: f.to,
        depart: f.depart,
        arrive: f.arrive,
        dateLabel: f.dateLabel ?? null,
      })),
      days: days.map((day) => ({
        dayLabel: dayLabel(day.dayNumber),
        title: day.title,
        description: day.description,
        tags: dayTags(day, days.length).map((tag) => tag.label),
      })),
      pricing: {
        baseWithMarginUsd,
        pricingFeesUsd,
        airfareUsd,
        discountUsd: discountAmountUsd,
        totalAfterDiscountUsd,
        finalTotalUsd,
        selectedPricingLabel,
      },
    };
  }

  async function handleSendEmail(isTest: boolean) {
    setSendLoading(true);
    setSendError(null);
    setSendDone(false);
    setSendDoneLabel(null);
    try {
      await api.sendProposalEmail({
        from: isTest ? 'onboarding@resend.dev' : (sendFrom.trim() || undefined),
        to: isTest ? undefined : (sendTo.trim() || undefined),
        cc: sendCc.trim() || undefined,
        subject: sendSubject.trim(),
        data: buildEmailData(),
        testMode: isTest,
      });
      setSendDone(true);
      setSendDoneLabel(isTest ? 'Test email sent successfully.' : 'Email sent successfully.');
      const defaultSubject = proposalHeading();
      const clientEmail = clients.find((c) => c.id === proposalData.clientId)?.email ?? '';
      setSendSubject(defaultSubject);
      setSendFrom('noreply@example.com');
      setSendTo(clientEmail);
      setSendCc('');
    } catch (e: any) {
      setSendError(e?.message || 'Failed to send email.');
    } finally {
      setSendLoading(false);
    }
  }

  async function handleSaveProposal() {
    const payload = { proposalData, pricingLevel, pricingOccupancy };
    const title = proposalData.title;
    setSaveOpen(true);
    setSaveLoading(true);
    setSaveDone(false);
    setSaveError(null);
    try {
      if (draftId) {
        const res = await api.updateProposalDraft(draftId, { title, data: payload });
        setDrafts((prev) => {
          const idx = prev.findIndex((d) => d.id === res.draft.id);
          if (idx === -1) return [res.draft, ...prev];
          const next = [...prev];
          next[idx] = res.draft;
          return next;
        });
      } else {
        const res = await api.createProposalDraft({ title, data: payload });
        setDraftId(res.draft.id);
        setDrafts((prev) => [res.draft, ...prev.filter((d) => d.id !== res.draft.id)]);
      }
      setSaveDone(true);
    } catch (e: any) {
      setSaveError(e?.message || 'Failed to save proposal.');
    } finally {
      setSaveLoading(false);
    }
  }

  function startManual() {
    setProposalData((prev) => ({
      ...blankProposal,
      aiPrompt: prev.aiPrompt,
    }));
    setDraftId(null);
    setViewMode('EDITOR');
  }

  function startAi() {
    const exampleRaw =
      '1. QR 961  J  12OCT  LHR-DOH  0900  1750\n2. QR 962  J  13OCT  DOH-DPS  0230  1610';
    const flights = parseFlights(exampleRaw);
    const firstIt = itineraries[0];
    const firstClient = clients[0];
    setProposalData({
      title: 'Bali Retreat 2024',
      clientName: firstClient ? `${firstClient.firstName} ${firstClient.lastName}` : 'Smith Family',
      leadId: firstClient?.id ?? leadOptions[0]?.id ?? 'lead-123',
      clientId: firstClient?.id,
      startDate: '',
      preparedBy: 'Public',
      firstLastFlightOverride: false,
      travelers: 4,
      travelDates: 'Oct 12 - Oct 20, 2024',
      baseItineraryId: firstIt?.id ?? '',
      templateSourceItineraryId: firstIt?.id ?? '',
      itineraryMessageTemplate: firstIt?.messageTemplate ?? null,
      personalMessage:
        "Hi Smith Family,\n\nI've put together a custom itinerary for your upcoming trip to Bali. Based on our conversation, I've focused heavily on cultural experiences in Ubud and relaxation in Seminyak. Let me know what you think!",
      aiPrompt: proposalData.aiPrompt,
      airfareRaw: exampleRaw,
      airfarePriceUsd: 0,
      discountPct: 0,
      discountDeadline: '',
      pricingMarginPct: 33,
      flights,
      earlyBooking: true,
      pricing: { fourStar: 2450, fiveStar: 3800, taxes: 450 },
    });
    setDraftId(null);
    setViewMode('EDITOR');
  }

  function openDraft(draft: ProposalDraft) {
    const payload = draft.data ?? {};
    const restored = { ...blankProposal, ...(payload.proposalData ?? payload) };
    setProposalData(restored);
    setPricingLevel(payload.pricingLevel ?? '3');
    setPricingOccupancy(payload.pricingOccupancy ?? 'double');
    setDraftId(draft.id);
    setViewMode('EDITOR');
  }

  useEffect(() => {
    if (viewMode !== 'EDITOR') return;
    const payload = { proposalData, pricingLevel, pricingOccupancy };
    const title = proposalData.title;
    const timer = window.setTimeout(async () => {
      try {
        if (draftId) {
          const res = await api.updateProposalDraft(draftId, { title, data: payload });
          setDrafts((prev) => {
            const idx = prev.findIndex((d) => d.id === res.draft.id);
            if (idx === -1) return [res.draft, ...prev];
            const next = [...prev];
            next[idx] = res.draft;
            return next;
          });
        } else {
          const res = await api.createProposalDraft({ title, data: payload });
          setDraftId(res.draft.id);
          setDrafts((prev) => [res.draft, ...prev.filter((d) => d.id !== res.draft.id)]);
        }
      } catch {
        // ignore autosave errors
      }
    }, 800);
    return () => window.clearTimeout(timer);
  }, [proposalData, pricingLevel, pricingOccupancy, viewMode, draftId]);

  return (
    <StitchShell active="proposals">
      <div className="flex-1 flex flex-col h-full overflow-y-auto relative">
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#15202b] border-b border-[#dbe0e6] dark:border-gray-800 sticky top-0 z-10">
          <span className="font-bold text-lg">Wanderlust</span>
          <button className="p-2 text-[#617589]">
            <span className="material-symbols-outlined">menu</span>
          </button>
        </div>

        {viewMode === 'SELECTION' ? (
          <div className="flex-1 max-w-[1200px] w-full mx-auto p-6 md:p-10 lg:p-14">
            <div className="flex flex-col gap-4 mb-10">
              <div>
                <h1 className="text-[#111418] dark:text-white text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
                  Create Proposal
                </h1>
                <p className="text-[#617589] dark:text-gray-400 text-lg font-normal leading-normal mt-2">
                  Choose how you would like to start building your new travel itinerary.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              <div className="group flex flex-col bg-white dark:bg-[#15202b] rounded-2xl border border-[#dbe0e6] dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden relative">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 w-full"></div>
                <div className="p-8 flex flex-col h-full">
                  <div className="size-14 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-6 text-[#111418] dark:text-white group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <span className="material-symbols-outlined" style={{ fontSize: 32 }}>add</span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-3">Manual Creation</h2>
                  <p className="text-[#617589] dark:text-gray-400 text-base leading-relaxed mb-8 flex-1">
                    Start from a blank canvas. Perfect for fully custom itineraries where you want complete control over every flight, hotel, and activity detail.
                  </p>
                  <button
                    className="w-full h-12 flex items-center justify-center rounded-xl border-2 border-transparent bg-gray-100 dark:bg-gray-800 text-[#111418] dark:text-white font-bold text-base hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                    onClick={startManual}
                  >
                    Start Manual Draft
                  </button>
                </div>
              </div>

              <div className="group flex flex-col bg-white dark:bg-[#15202b] rounded-2xl border border-primary/20 dark:border-primary/20 shadow-sm hover:shadow-md hover:shadow-primary/5 transition-all duration-300 overflow-hidden relative">
                <div className="h-2 bg-gradient-to-r from-primary to-purple-500 w-full"></div>
                <div className="p-8 flex flex-col h-full">
                  <div className="flex items-start justify-between mb-6">
                    <div className="size-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: 32 }}>auto_awesome</span>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold uppercase tracking-wide">
                      Recommended
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#111418] dark:text-white mb-3">AI Agent Creation</h2>
                  <p className="text-[#617589] dark:text-gray-400 text-base leading-relaxed mb-6">
                    Let our AI assistant draft a proposal for you. Describe the trip requirements below and get a 90% complete itinerary in seconds.
                  </p>
                  <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800">
                    <label className="block text-sm font-semibold text-[#111418] dark:text-white mb-2">Describe the trip</label>
                    <div className="relative">
                      <textarea
                        className="w-full bg-[#f6f7f8] dark:bg-gray-900 border-none rounded-xl p-4 pr-4 text-[#111418] dark:text-white placeholder-[#617589] focus:ring-2 focus:ring-primary/50 resize-none h-24 text-sm"
                        placeholder="e.g., '10 day honeymoon in Italy, luxury hotels, wine tasting in Tuscany, budget $15k'"
                        value={proposalData.aiPrompt}
                        onChange={(e) => setProposalData((prev) => ({ ...prev, aiPrompt: e.target.value }))}
                      ></textarea>
                      <div className="mt-3">
                        <button
                          className="w-full h-12 flex items-center justify-center gap-2 rounded-xl bg-primary hover:bg-blue-600 text-white font-bold text-base transition-all shadow-lg shadow-primary/20"
                          onClick={startAi}
                        >
                          <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                          Generate with AI
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[#111418] dark:text-white text-xl font-bold">Recent Drafts</h3>
                <button
                  className="text-sm text-primary hover:underline"
                  onClick={() => loadDrafts()}
                >
                  Refresh
                </button>
              </div>
              <div className="bg-white dark:bg-[#15202b] rounded-2xl border border-[#dbe0e6] dark:border-gray-700 p-4">
                {draftsLoading ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">Loading drafts…</div>
                ) : drafts.length === 0 ? (
                  <div className="text-sm text-gray-500 dark:text-gray-400">No drafts saved yet.</div>
                ) : (
                  <div className="divide-y divide-[#eef2f6] dark:divide-gray-700">
                    {drafts.map((draft) => (
                      <button
                        key={draft.id}
                        className="w-full text-left py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/40 rounded-lg px-2 transition-colors"
                        onClick={() => openDraft(draft)}
                      >
                        <div>
                          <div className="text-sm font-semibold text-[#111418] dark:text-white">{draft.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Last updated {new Date(draft.updatedAt).toLocaleString()}
                          </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-400">arrow_forward</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-[#617589] dark:text-gray-500">
              <button className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">help</span>
                How does the AI Agent work?
              </button>
              <button className="hover:text-primary transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">history</span>
                View recent drafts
              </button>
            </div>
          </div>
        ) : viewMode === 'SEND' ? (
          <div className="flex flex-col flex-1 min-w-0">
            <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-gray-700 px-6 py-4 flex flex-col gap-4 shrink-0 z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary"
                    onClick={() => setViewMode('EDITOR')}
                  >
                    <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                    Back
                  </button>
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">
                    Sending Proposal to {proposalData.clientName}
                  </h2>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                    onClick={() => handleSendEmail(false)}
                    disabled={sendLoading}
                  >
                    <span className="material-symbols-outlined text-lg">send</span>
                    {sendLoading ? 'Sending...' : 'Send Email'}
                  </button>
                  <button
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-[#dbe0e6] dark:border-gray-600 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                    onClick={() => handleSendEmail(true)}
                    disabled={sendLoading}
                  >
                    <span className="material-symbols-outlined text-lg">experiment</span>
                    Send Test Email
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {sendLoading ? (
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-2 bg-primary animate-pulse" style={{ width: '70%' }}></div>
                  </div>
                ) : null}
                {sendDone ? (
                  <div className="text-sm text-green-600">{sendDoneLabel ?? 'Email sent successfully.'}</div>
                ) : null}
                {sendError ? (
                  <div className="text-sm text-red-600">{sendError}</div>
                ) : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex flex-col w-full">
                  <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Subject</span>
                  <input
                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                    type="text"
                    value={sendSubject}
                    onChange={(e) => setSendSubject(e.target.value)}
                  />
                </label>
                <label className="flex flex-col w-full">
                  <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">From</span>
                  <input
                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                    type="email"
                    list="from-suggestions"
                    value={sendFrom}
                    onChange={(e) => setSendFrom(e.target.value)}
                  />
                  <datalist id="from-suggestions">
                    <option value="noreply@example.com" />
                    <option value="hello@example.com" />
                    <option value="onboarding@resend.dev" />
                  </datalist>
                </label>
                <label className="flex flex-col w-full">
                  <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">To</span>
                  <input
                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                    type="email"
                    list="to-suggestions"
                    value={sendTo}
                    onChange={(e) => setSendTo(e.target.value)}
                  />
                  <datalist id="to-suggestions">
                    <option value={clients.find((c) => c.id === proposalData.clientId)?.email ?? ''} />
                    <option value="delivered@resend.dev" />
                  </datalist>
                  <span className="text-xs text-gray-500 mt-2">Test email uses RESEND_TEST_TO or delivered@resend.dev.</span>
                </label>
                <label className="flex flex-col w-full">
                  <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">CC (comma-separated)</span>
                  <input
                    className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                    type="text"
                    list="cc-suggestions"
                    value={sendCc}
                    onChange={(e) => setSendCc(e.target.value)}
                  />
                  <datalist id="cc-suggestions">
                    <option value="noreply@example.com" />
                    <option value="hello@example.com" />
                    <option value="delivered@resend.dev" />
                  </datalist>
                </label>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto bg-[#e2e8f0] dark:bg-[#0f151a] p-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-white w-full min-h-[800px] shadow-xl rounded-sm p-8 flex flex-col gap-6 relative">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src="https://s3-eu-west-1.amazonaws.com/tpd/logos/56cdc0d60000ff000589570b/0x0.png"
                          alt="SA Vacations logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 leading-tight">SA Vacations</h4>
                        <p className="text-xs text-gray-500">Prepared by {proposalData.preparedBy || 'Public'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <div className="flex-1 lg:w-[65%] min-w-0 space-y-6 lg:pr-6 lg:border-r lg:border-gray-100">
                      <div>
                        {messageParagraphs.length ? (
                          <div className="space-y-3 text-sm text-gray-600 leading-relaxed font-serif">
                            {messageParagraphs.map((paragraph, idx) => (
                              <p key={`${paragraph}-${idx}`}>{paragraph}</p>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600 leading-relaxed font-serif">
                            Add a personalized message to show here.
                          </p>
                        )}
                      </div>
                      <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                        <div className="flex items-center gap-2 mb-3 text-primary">
                          <span className="material-symbols-outlined text-lg">flight</span>
                          <h5 className="text-sm font-bold uppercase tracking-wide">Flight Itinerary</h5>
                          <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                          <h5 className="text-sm font-bold uppercase tracking-wide text-primary">
                            ${airfareUsd.toLocaleString()} Per Person
                          </h5>
                        </div>
                        <div className="flex flex-col gap-3">
                          {proposalData.flights.length === 0 ? (
                            <div className="text-xs text-gray-500">No flights formatted yet.</div>
                          ) : (
                            proposalData.flights.map((f) => (
                              <div key={f.id} className="flex justify-between items-center text-sm border-b border-blue-100 pb-2 last:border-0 last:pb-0">
                                <div className="flex gap-3">
                                  <div className="font-bold text-gray-900 w-12">{`${f.airlineCode}${f.flightNumber}`}</div>
                                  <div className="flex flex-col">
                                    <span className="font-medium text-gray-800">
                                      {f.from} <span className="text-gray-400">→</span> {f.to}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                      {f.dateLabel ? `${f.dateLabel} • ` : ''}{f.depart} - {f.arrive}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs font-semibold bg-white px-2 py-1 rounded border border-blue-100 text-gray-600">—</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-3 text-gray-900">
                          <span className="material-symbols-outlined text-lg">event_note</span>
                          <h5 className="text-sm font-bold uppercase tracking-wide">Itinerary Highlights</h5>
                        </div>
                        <div className="relative pl-4 border-l-2 border-gray-100 flex flex-col gap-6">
                          {baseLoading ? (
                            <div className="text-xs text-gray-500">Loading itinerary…</div>
                          ) : !baseItinerary ? (
                            <div className="text-xs text-gray-500">Select a base itinerary to preview days.</div>
                          ) : (
                            baseItinerary.days.map((day) => (
                              <div key={day.id} className="relative">
                                <div className="absolute -left-[21px] top-0 size-3 rounded-full bg-primary border-2 border-white"></div>
                                <div className="flex items-center gap-2 mb-1">
                                  <p className="text-xs font-bold text-primary">{dayLabel(day.dayNumber)}</p>
                                  {dayTags(day, baseItinerary.days.length).map((tag, idx) => (
                                    <span
                                      key={`${tag.label}-${idx}`}
                                      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                    >
                                      <span className="material-symbols-outlined text-[12px]">{tag.icon}</span>
                                      {tag.label}
                                    </span>
                                  ))}
                                </div>
                                <h6 className="font-bold text-sm text-gray-900">{day.title}</h6>
                                <p className="text-xs text-gray-500 mt-1">{day.description}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                    <aside className="w-full lg:w-[35%] bg-slate-50/50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-800">
                      <div className="space-y-8">
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-500 !text-xl">check_circle</span> What's Included
                          </h4>
                          <ul className="space-y-3">
                            {sidebarInclusions.map((item, idx) => (
                              <li key={`${item}-${idx}`} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.15em] mb-6 flex items-center gap-3">
                            <span className="material-symbols-outlined text-green-500 !text-xl">cancel</span> Not Included
                          </h4>
                          <ul className="space-y-3 opacity-70">
                            {sidebarExclusions.map((item, idx) => (
                              <li key={`${item}-${idx}`} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1.5"></span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                          <div className="bg-amber-50/50 dark:bg-amber-900/20 p-5 rounded-xl mb-6 border border-amber-100/50 dark:border-amber-900/30">
                            <p className="text-[11px] text-amber-900/70 dark:text-amber-200 leading-relaxed font-medium">
                              Prices and availability are subject to change until deposit is received.
                            </p>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-6">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Investment</p>
                            <div className="space-y-2 text-sm mt-3">
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Base itinerary (with margin)</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${baseWithMarginUsd.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Additional fees</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${pricingFeesUsd.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Airfare</span>
                                <span className="font-semibold text-slate-900 dark:text-white">${airfareUsd.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-slate-500">Discount</span>
                                <span className="font-semibold text-slate-900 dark:text-white">- ${discountAmountUsd.toLocaleString()}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 text-sm">
                              <span className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Total after discount</span>
                              <span className="font-semibold text-slate-900 dark:text-white">${totalAfterDiscountUsd.toLocaleString()}</span>
                            </div>
                            <div className="flex items-end justify-between mt-3">
                              <p className="text-3xl font-black text-slate-900 dark:text-white">
                                ${finalTotalUsd.toLocaleString()} <span className="text-sm font-normal text-slate-500">pp</span>
                              </p>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Total for {travelersCount} Pax: ${(finalTotalUsd * travelersCount).toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">Accommodation: {selectedPricingLabel}</p>
                            <div className="flex flex-wrap gap-4 items-center text-slate-500 font-semibold text-xs mt-4">
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary !text-[16px]">calendar_today</span>
                                {daysCount} Days / {nightsCount} Nights
                              </span>
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                              <span className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary !text-[16px]">group</span>
                                {travelersCount} Travelers
                              </span>
                            </div>
                          </div>
                          <button className="block w-full bg-primary hover:bg-blue-600 text-white text-center py-4 rounded-xl font-extrabold text-xs tracking-[0.1em] transition-all shadow-lg shadow-primary/25">
                            RESERVE THIS TRIP
                          </button>
                          <p className="text-center mt-4 text-[11px] text-slate-400 font-medium">Proposal valid for 14 days</p>
                        </div>
                      </div>
                    </aside>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col flex-1 min-w-0">
            <header className="bg-white dark:bg-[#1a2632] border-b border-[#e5e7eb] dark:border-gray-700 px-6 py-4 flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary"
                  onClick={() => setViewMode('SELECTION')}
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>
                <div className="flex flex-col gap-1">
                  <h2 className="text-[#111418] dark:text-white text-xl font-bold leading-tight">
                    Proposal Editor: {proposalHeading()}
                  </h2>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-[#617589] dark:text-gray-400">Drafting for</span>
                    <span className="bg-blue-100 text-primary dark:bg-blue-900/30 px-2 py-0.5 rounded text-xs font-semibold">
                      {proposalData.clientName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-[#dbe0e6] dark:border-gray-600 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                  <span className="material-symbols-outlined text-lg">visibility</span>
                  Preview
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors shadow-sm"
                  onClick={handleSaveProposal}
                >
                  <span className="material-symbols-outlined text-lg">save</span>
                  Save Proposal
                </button>
                <button
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-700 border border-[#dbe0e6] dark:border-gray-600 text-[#111418] dark:text-white text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  onClick={() => setViewMode('SEND')}
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                  Send Proposal
                </button>
              </div>
            </header>

            <div ref={splitRef} className="flex flex-1 overflow-hidden">
              <div
                className="overflow-y-auto bg-background-light dark:bg-background-dark p-6 flex flex-col gap-6 flex-shrink-0"
                style={{ width: `${splitPercent}%` }}
              >
                <section className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-primary">person_search</span>
                    <h3 className="text-[#111418] dark:text-white text-lg font-bold">Lead &amp; Configuration</h3>
                  </div>
                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col w-full">
                      <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Select Client / Lead</span>
                      <div className="relative">
                        <select
                          className="form-select w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                          value={proposalData.leadId}
                          onChange={(e) => {
                            const lead = leadOptionsResolved.find((l) => l.id === e.target.value);
                            setProposalData((prev) => ({
                              ...prev,
                              leadId: e.target.value,
                              clientId: e.target.value,
                              clientName: lead?.name ?? prev.clientName,
                            }));
                          }}
                        >
                          {leadOptionsResolved.map((lead) => (
                            <option key={lead.id} value={lead.id}>
                              {lead.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {clientsLoading ? (
                        <span className="text-xs text-gray-400 mt-2">Loading clients…</span>
                      ) : null}
                    </label>
                    <label className="flex flex-col w-full">
                      <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Prepared By</span>
                      <input
                        className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                        type="text"
                        value={proposalData.preparedBy}
                        onChange={(e) => setProposalData((prev) => ({ ...prev, preparedBy: e.target.value }))}
                      />
                    </label>
                    <div className="flex gap-4">
                      <label className="flex flex-col flex-1">
                        <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Travelers (Pax)</span>
                        <input
                          className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                          type="number"
                          value={proposalData.travelers}
                          onChange={(e) => setProposalData((prev) => ({ ...prev, travelers: Number(e.target.value) || 0 }))}
                        />
                      </label>
                      <label className="flex flex-col flex-1">
                        <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Start Date</span>
                        <input
                          className="form-input w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                          type="date"
                          value={proposalData.startDate}
                          onChange={(e) => setProposalData((prev) => ({ ...prev, startDate: e.target.value }))}
                        />
                      </label>
                    </div>
                    <label className="flex flex-col w-full">
                      <span className="text-[#111418] dark:text-gray-200 text-sm font-medium pb-2">Base Itinerary Template</span>
                      <div className="relative">
                        <select
                          className="form-select w-full rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-11 px-3 text-sm focus:ring-primary focus:border-primary"
                          value={proposalData.baseItineraryId}
                          onChange={(e) => setProposalData((prev) => ({ ...prev, baseItineraryId: e.target.value }))}
                        >
                          <option value="">Select an itinerary...</option>
                          {itineraries.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.title} ({it.days.length} days)
                            </option>
                          ))}
                        </select>
                      </div>
                    </label>
                  </div>
                </section>

                <section className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-5 shadow-sm group">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">edit_note</span>
                      <h3 className="text-[#111418] dark:text-white text-lg font-bold">Personalized Message</h3>
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 text-xs font-semibold hover:bg-purple-100 transition-colors">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                      Generate Message
                    </button>
                  </div>
                  <textarea
                    className="w-full h-32 rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white p-3 text-sm focus:ring-primary focus:border-primary resize-y leading-relaxed"
                    placeholder="Write a warm greeting..."
                    value={proposalData.personalMessage}
                    onChange={(e) => setProposalData((prev) => ({ ...prev, personalMessage: e.target.value }))}
                  />
                  <div className="mt-4 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 p-3">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Default Itinerary Message</div>
                    {!baseItinerary ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">Select a base itinerary to load its default message.</div>
                    ) : templateParagraphs.length === 0 ? (
                      <div className="text-xs text-gray-500 dark:text-gray-400">No itinerary template message configured.</div>
                    ) : (
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                        {templateParagraphs.map((paragraph, idx) => (
                          <p key={`${paragraph}-${idx}`}>{paragraph}</p>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <section className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">flight</span>
                      <h3 className="text-[#111418] dark:text-white text-lg font-bold">Airfare Quote</h3>
                    </div>
                    <button
                      className="text-primary text-sm font-medium hover:underline"
                      onClick={() => setProposalData((prev) => ({ ...prev, airfareRaw: '', flights: [] }))}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-dashed border-gray-300 dark:border-gray-600 mb-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Paste raw GDS flight data here:</p>
                    <div className="flex gap-2">
                      <textarea
                        className="w-full h-16 rounded border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-xs font-mono p-2"
                        placeholder="1. QR 961  J  12OCT  LHR-DOH  0900  1750..."
                        value={proposalData.airfareRaw}
                        onChange={(e) => setProposalData((prev) => ({ ...prev, airfareRaw: e.target.value }))}
                      ></textarea>
                      <button
                        className="flex flex-col items-center justify-center px-4 rounded bg-white dark:bg-gray-700 border border-[#dbe0e6] dark:border-gray-600 hover:bg-gray-50 text-xs font-medium gap-1 min-w-[80px]"
                        onClick={() => setProposalData((prev) => ({ ...prev, flights: parseFlights(prev.airfareRaw) }))}
                      >
                        <span className="material-symbols-outlined text-primary">table_view</span>
                        Format
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Airfare Price (USD)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">$</span>
                      <input
                        type="number"
                        min={0}
                        className="w-32 rounded-md border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-[#111418] dark:text-white px-3 py-1.5 text-right"
                        value={proposalData.airfarePriceUsd}
                        onChange={(e) =>
                          setProposalData((prev) => ({
                            ...prev,
                            airfarePriceUsd: Math.max(0, Math.floor(Number(e.target.value) || 0)),
                          }))
                        }
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Icon Configuration</div>
                    <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                      <span>Default</span>
                      <button
                        type="button"
                        className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors ${
                          proposalData.firstLastFlightOverride ? 'bg-primary' : 'bg-gray-300'
                        }`}
                        onClick={() =>
                          setProposalData((prev) => ({
                            ...prev,
                            firstLastFlightOverride: !prev.firstLastFlightOverride,
                          }))
                        }
                        aria-pressed={proposalData.firstLastFlightOverride}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            proposalData.firstLastFlightOverride ? 'translate-x-5' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span>Active</span>
                    </label>
                  </div>
                  <div className="overflow-hidden rounded-lg border border-[#dbe0e6] dark:border-gray-700">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-gray-800 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-2">Airline</th>
                          <th className="px-4 py-2">Route</th>
                          <th className="px-4 py-2">Time</th>
                          <th className="px-4 py-2 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#dbe0e6] dark:divide-gray-700 text-[#111418] dark:text-white">
                        {proposalData.flights.length === 0 ? (
                          <tr className="bg-white dark:bg-gray-900/50">
                            <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400" colSpan={4}>
                              No flights formatted yet.
                            </td>
                          </tr>
                        ) : (
                          proposalData.flights.map((f) => (
                            <tr key={f.id} className="bg-white dark:bg-gray-900/50">
                              <td className="px-4 py-2 flex items-center gap-2">
                                <div className="size-6 rounded bg-red-800 text-white flex items-center justify-center text-[8px] font-bold">
                                  {f.airlineCode}
                                </div>
                                {f.airlineCode}
                              </td>
                              <td className="px-4 py-2">
                                {f.from} → {f.to}
                              </td>
                              <td className="px-4 py-2">
                                {f.depart} - {f.arrive}
                              </td>
                              <td className="px-4 py-2 text-right">
                                <span
                                  className="material-symbols-outlined text-gray-400 text-sm cursor-pointer hover:text-red-500"
                                  onClick={() =>
                                    setProposalData((prev) => ({
                                      ...prev,
                                      flights: prev.flights.filter((x) => x.id !== f.id),
                                    }))
                                  }
                                >
                                  delete
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                <section className="bg-white dark:bg-[#1a2632] rounded-xl border border-[#dbe0e6] dark:border-gray-700 p-5 shadow-sm mb-10">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary">payments</span>
                      <h3 className="text-[#111418] dark:text-white text-lg font-bold">Pricing Summary</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Option</span>
                      <select
                        className="form-select rounded-lg border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-[#111418] dark:text-white h-9 px-3 text-sm focus:ring-primary focus:border-primary"
                        value={`${pricingLevel}-${pricingOccupancy}`}
                        onChange={(e) => {
                          const [lv, occ] = e.target.value.split('-') as [
                            '3' | '4' | '5' | 'deluxe',
                            'single' | 'double' | 'triple',
                          ];
                          setPricingLevel(lv);
                          setPricingOccupancy(occ);
                        }}
                      >
                        {pricingOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border border-dashed border-gray-300 dark:border-gray-600">
                    {!proposalData.baseItineraryId ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Select a base itinerary to load pricing.</div>
                    ) : pricingLoading ? (
                      <div className="text-sm text-gray-500 dark:text-gray-400">Loading pricing…</div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Base itinerary (from itinerary)</span>
                          <span className="font-semibold text-[#111418] dark:text-white">${pricingBaseUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-20">Margin</div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={marginPct}
                            onChange={(e) =>
                              setProposalData((prev) => ({
                                ...prev,
                                pricingMarginPct: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))),
                              }))
                            }
                            className="flex-1 accent-primary"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-16 rounded-md border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-[#111418] dark:text-white px-2 py-1 text-right"
                              value={marginPct}
                              onChange={(e) =>
                                setProposalData((prev) => ({
                                  ...prev,
                                  pricingMarginPct: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))),
                                }))
                              }
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase w-20">Discount</div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={discountPct}
                            onChange={(e) =>
                              setProposalData((prev) => ({
                                ...prev,
                                discountPct: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))),
                              }))
                            }
                            className="flex-1 accent-primary"
                          />
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-16 rounded-md border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-[#111418] dark:text-white px-2 py-1 text-right"
                              value={discountPct}
                              onChange={(e) =>
                                setProposalData((prev) => ({
                                  ...prev,
                                  discountPct: Math.max(0, Math.min(100, Math.floor(Number(e.target.value) || 0))),
                                }))
                              }
                            />
                            <span className="text-xs text-gray-500 dark:text-gray-400">%</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Discount deadline</span>
                          <input
                            type="date"
                            className="rounded-md border border-[#dbe0e6] dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-[#111418] dark:text-white px-2 py-1"
                            value={proposalData.discountDeadline}
                            onChange={(e) => setProposalData((prev) => ({ ...prev, discountDeadline: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Base with margin</span>
                          <span className="font-semibold text-[#111418] dark:text-white">${baseWithMarginUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Additional fees</span>
                          <span className="font-semibold text-[#111418] dark:text-white">${pricingFeesUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Airfare</span>
                          <span className="font-semibold text-[#111418] dark:text-white">${airfareUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Discount</span>
                          <span className="font-semibold text-[#111418] dark:text-white">- ${discountAmountUsd.toLocaleString()}</span>
                        </div>
                        <div className="flex items-end justify-between border-t border-gray-200 dark:border-gray-700 pt-3">
                          <div>
                            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Total per person</div>
                            <div className="text-2xl font-bold text-[#111418] dark:text-white">
                              ${finalTotalUsd.toLocaleString()}
                            </div>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Based on {selectedPricingLabel}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              <div
                className="w-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 cursor-col-resize flex items-center justify-center"
                onMouseDown={() => {
                  dragRef.current = true;
                }}
              >
                <div className="w-1 h-10 bg-gray-300 dark:bg-gray-600 rounded-full" />
              </div>
              <div
                className="bg-[#e2e8f0] dark:bg-[#0f151a] overflow-y-auto p-8 border-l border-[#dbe0e6] dark:border-gray-700 flex flex-col items-center flex-shrink-0"
                style={{ width: `${100 - splitPercent}%` }}
              >
                <div className="mb-4 flex items-center justify-between w-full text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">visibility</span> Live Client View
                  </div>
                  <button
                    className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary normal-case"
                    onClick={() => setViewMode('SELECTION')}
                  >
                    <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                    Back
                  </button>
                </div>
                <div className="bg-white w-full min-h-[800px] shadow-xl rounded-sm p-8 flex flex-col gap-6 relative">
                  <div className="flex justify-between items-start border-b border-gray-100 pb-6">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden">
                        <img
                          src="https://s3-eu-west-1.amazonaws.com/tpd/logos/56cdc0d60000ff000589570b/0x0.png"
                          alt="SA Vacations logo"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 leading-tight">SA Vacations</h4>
                        <p className="text-xs text-gray-500">Prepared by {proposalData.preparedBy || 'Public'}</p>
                      </div>
                    </div>
                  </div>
                  <div>
                    {messageParagraphs.length ? (
                      <div className="space-y-3 text-sm text-gray-600 leading-relaxed font-serif">
                        {messageParagraphs.map((paragraph, idx) => (
                          <p key={`${paragraph}-${idx}`}>{paragraph}</p>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 leading-relaxed font-serif">
                        Add a personalized message to show here.
                      </p>
                    )}
                  </div>
                  <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                    <div className="flex items-center gap-2 mb-3 text-primary">
                      <span className="material-symbols-outlined text-lg">flight</span>
                      <h5 className="text-sm font-bold uppercase tracking-wide">Flight Itinerary</h5>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/60"></span>
                      <h5 className="text-sm font-bold uppercase tracking-wide text-primary">
                        ${airfareUsd.toLocaleString()} Per Person
                      </h5>
                    </div>
                    <div className="flex flex-col gap-3">
                      {proposalData.flights.length === 0 ? (
                        <div className="text-xs text-gray-500">No flights formatted yet.</div>
                      ) : (
                        proposalData.flights.map((f) => (
                          <div key={f.id} className="flex justify-between items-center text-sm border-b border-blue-100 pb-2 last:border-0 last:pb-0">
                            <div className="flex gap-3">
                              <div className="font-bold text-gray-900 w-12">{`${f.airlineCode}${f.flightNumber}`}</div>
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-800">
                                  {f.from} <span className="text-gray-400">→</span> {f.to}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {f.dateLabel ? `${f.dateLabel} • ` : ''}{f.depart} - {f.arrive}
                                </span>
                              </div>
                            </div>
                            <div className="text-xs font-semibold bg-white px-2 py-1 rounded border border-blue-100 text-gray-600">—</div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3 text-gray-900">
                      <span className="material-symbols-outlined text-lg">event_note</span>
                      <h5 className="text-sm font-bold uppercase tracking-wide">Itinerary Highlights</h5>
                    </div>
                    <div className="relative pl-4 border-l-2 border-gray-100 flex flex-col gap-6">
                      {baseLoading ? (
                        <div className="text-xs text-gray-500">Loading itinerary…</div>
                      ) : !baseItinerary ? (
                        <div className="text-xs text-gray-500">Select a base itinerary to preview days.</div>
                      ) : (
                        baseItinerary.days.map((day) => (
                          <div key={day.id} className="relative">
                            <div className="absolute -left-[21px] top-0 size-3 rounded-full bg-primary border-2 border-white"></div>
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-bold text-primary">{dayLabel(day.dayNumber)}</p>
                              {dayTags(day, baseItinerary.days.length).map((tag, idx) => (
                                <span
                                  key={`${tag.label}-${idx}`}
                                  className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                                >
                                  <span className="material-symbols-outlined text-[12px]">{tag.icon}</span>
                                  {tag.label}
                                </span>
                              ))}
                            </div>
                            <h6 className="font-bold text-sm text-gray-900">{day.title}</h6>
                            <p className="text-xs text-gray-500 mt-1">{day.description}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t-2 border-gray-900">
                    <h5 className="text-sm font-bold uppercase tracking-wide text-gray-900 mb-3">
                      Pricing Breakdown (In USD Per Person)
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Base itinerary (with margin)</span>
                        <span className="font-semibold text-gray-900">${baseWithMarginUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Additional fees</span>
                        <span className="font-semibold text-gray-900">${pricingFeesUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Airfare</span>
                        <span className="font-semibold text-gray-900">${airfareUsd.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Discount</span>
                        <span className="font-semibold text-gray-900">- ${discountAmountUsd.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-4 text-sm">
                      <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Total after discount</span>
                      <span className="font-semibold text-gray-900">${totalAfterDiscountUsd.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-end mt-2">
                      <span className="text-sm font-bold uppercase tracking-wide text-gray-900">Final total</span>
                      <p className="text-3xl font-bold text-primary">${finalTotalUsd.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-gray-500 text-right">Per person, based on {selectedPricingLabel}.</p>
                  </div>
                </div>
                <div className="mt-4 h-2 w-32 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
              </div>
            </div>
            {saveOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/40" onClick={() => (!saveLoading ? setSaveOpen(false) : null)} />
                <div className="relative w-[95vw] max-w-md rounded-lg bg-white p-6 shadow-lg">
                  <h3 className="text-lg font-semibold mb-2">Saving Proposal</h3>
                  {saveLoading ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Saving your proposal to the database…</p>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-2 bg-primary animate-pulse" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                  ) : saveDone ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600">Your proposal is saved.</p>
                      <div className="flex justify-end">
                        <button
                          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                          onClick={() => setSaveOpen(false)}
                        >
                          Confirm
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-red-600">{saveError || 'Failed to save proposal.'}</p>
                      <div className="flex justify-end gap-2">
                        <button
                          className="px-4 py-2 rounded-lg border text-sm font-medium"
                          onClick={() => setSaveOpen(false)}
                        >
                          Close
                        </button>
                        <button
                          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-600 transition-colors"
                          onClick={handleSaveProposal}
                        >
                          Retry
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </StitchShell>
  );
}

