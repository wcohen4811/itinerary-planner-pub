import { prisma } from '../db/prisma.js';
import { ApiAccommodation } from '../utils/accommodation.js';
import type { Day as PrismaDay } from '@prisma/client';

function inWindow(date: Date, from: Date, to: Date): boolean {
  return date >= from && date <= to;
}

// Simple, in-memory pricing (no DB) for /days testing endpoints
const SIMPLE_BASE_BY_ACC: Record<ApiAccommodation, number> = {
  '3': 100,
  '4': 150,
  '5': 220,
  deluxe: 320,
};
const SIMPLE_TRANSFER_ADD_PER = 35;
export function computeDayPricing(params: {
  itineraryAccommodation: ApiAccommodation;
  dayAccommodation?: ApiAccommodation;
  transferCount?: number;
  destination: string;
  activityPriceUsd?: number;
}) {
  const effectiveAcc = params.dayAccommodation ?? params.itineraryAccommodation;
  const accommodationPriceUsd = SIMPLE_BASE_BY_ACC[effectiveAcc];
  const transferCount = Math.max(0, Math.floor(params.transferCount ?? 0));
  const transferPriceUsd = SIMPLE_TRANSFER_ADD_PER * transferCount;
  const destinationPriceUsd = 0;
  const activityPriceUsd = Math.max(0, params.activityPriceUsd ?? 0);
  const totalPriceUsd =
    accommodationPriceUsd + transferPriceUsd + destinationPriceUsd + activityPriceUsd;
  return {
    currency: 'USD',
    accommodationPriceUsd,
    transferPriceUsd,
    destinationPriceUsd,
    activityPriceUsd,
    totalPriceUsd,
  };
}

async function resolveDestinationIdByName(name: string): Promise<string | null> {
  const dest = await prisma.destination.findFirst({
    where: { name: { equals: name, mode: 'insensitive' } },
    select: { id: true },
  });
  return dest?.id ?? null;
}

async function selectAccommodationBaseUsd(destinationId: string, level: 'three' | 'four' | 'five' | 'deluxe', dayDate: Date): Promise<number> {
  const rows = await prisma.destinationAccommodationPrice.findMany({
    where: { destinationId, accommodationLevel: level },
  });
  const row = rows.find((r) => inWindow(dayDate, r.validFrom, r.validTo));
  return row?.basePriceUsd ?? 0;
}

async function selectTransferAddUsd(destinationId: string, level: 'three' | 'four' | 'five' | 'deluxe', dayDate: Date): Promise<number> {
  const rows = await prisma.destinationTransferPrice.findMany({
    where: { destinationId, accommodationLevel: level, transferType: { in: ['in', 'out'] } },
  });
  const maxInWindow = (visibility: 'private' | 'public') =>
    rows
      .filter((r) => r.visibility === visibility && inWindow(dayDate, r.validFrom, r.validTo))
      .reduce((m, r) => Math.max(m, r.addUsd), 0);
  const priv = maxInWindow('private');
  if (priv > 0) return priv;
  if (level === 'three') {
    const pub = maxInWindow('public');
    if (pub > 0) return pub;
  }
  return 0;
}

async function selectActivityUsd(destinationId: string, activityName: string | null, level: 'three' | 'four' | 'five' | 'deluxe', dayDate: Date, fallbackUsd: number): Promise<number> {
  if (!activityName) return Math.max(0, fallbackUsd);
  const act = await prisma.destinationActivity.findFirst({
    where: {
      destinationId,
      name: { equals: activityName, mode: 'insensitive' },
    },
    select: { id: true },
  });
  if (!act) return Math.max(0, fallbackUsd);
  const rows = await prisma.destinationActivityPrice.findMany({
    where: { activityId: act.id, accommodationLevel: level },
  });
  const row = rows.find((r) => inWindow(dayDate, r.validFrom, r.validTo));
  return row ? row.amountUsd : Math.max(0, fallbackUsd);
}

export async function recomputePricing(itineraryId: string) {
  const it = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    include: { days: true },
  });
  if (!it) return;
  let total = 0;
  for (const d of it.days) {
    const levelPrisma = d.accommodationLevel as 'three' | 'four' | 'five' | 'deluxe';
    const dayDate = d.date ?? new Date(new Date(it.startDate).setDate(new Date(it.startDate).getDate() + (d.dayNumber - 1)));
    const destinationId =
      (d as any).destinationId ?? (d.destination ? await resolveDestinationIdByName(d.destination) : null);

    let accommodationPriceUsd = 0;
    let transferPriceUsd = 0;
    let destinationPriceUsd = 0;
    let activityPriceUsd = Math.max(0, (d as any).activityPriceUsd ?? 0);

    if (destinationId) {
      accommodationPriceUsd = await selectAccommodationBaseUsd(destinationId, levelPrisma, dayDate);
      const perTransferAdd = await selectTransferAddUsd(destinationId, levelPrisma, dayDate);
      const transferCount = Math.max(0, Math.floor((d as any).transferCount ?? 0));
      transferPriceUsd = perTransferAdd * transferCount;
      // provider surcharge via destination->provider
      const dest = await prisma.destination.findUnique({
        where: { id: destinationId },
        include: { provider: true },
      });
      destinationPriceUsd = dest?.provider?.surchargeUsd ?? 0;
      activityPriceUsd = await selectActivityUsd(destinationId, d.activityName ?? null, levelPrisma, dayDate, activityPriceUsd);
    }

    const totalPriceUsd =
      accommodationPriceUsd + transferPriceUsd + destinationPriceUsd + activityPriceUsd;

    total += totalPriceUsd;
    await prisma.day.update({
      where: { id: d.id },
      data: {
        accommodationPriceUsd,
        transferPriceUsd,
        destinationPriceUsd,
        totalPriceUsd,
      },
    });
  }

  await prisma.itinerary.update({
    where: { id: itineraryId },
    data: { totalPriceUsd: total },
  });
}

export async function getItineraryPricing(itineraryId: string) {
  const it = await prisma.itinerary.findUnique({
    where: { id: itineraryId },
    include: { days: { orderBy: { dayNumber: 'asc' } } },
  });
  if (!it) return null;
  return {
    currency: 'USD',
    totalPriceUsd: it.totalPriceUsd,
    lines: it.days.map((d: PrismaDay) => ({
      dayNumber: d.dayNumber,
      priceUsd: (d as any).totalPriceUsd,
      breakdown: {
        accommodationPriceUsd: (d as any).accommodationPriceUsd,
        transferPriceUsd: (d as any).transferPriceUsd,
        destinationPriceUsd: (d as any).destinationPriceUsd,
        activityPriceUsd: (d as any).activityPriceUsd ?? 0,
      },
    })),
  };
}


