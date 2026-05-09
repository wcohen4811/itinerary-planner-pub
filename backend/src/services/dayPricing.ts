import { prisma } from '../db/prisma.js';
import { AccommodationLevel } from '@prisma/client';

const LEVELS: AccommodationLevel[] = ['three', 'four', 'five', 'deluxe'];

export async function ensureDayPricingForItinerary(itineraryId: string) {
  // Fetch day ids
  const days = await prisma.day.findMany({
    where: { itineraryId },
    select: { id: true },
  });
  if (days.length === 0) return;

  // Fetch existing pricing rows once
  const rows = await prisma.dayPricing.findMany({
    where: { dayId: { in: days.map((d) => d.id) } },
    select: { dayId: true, accommodationLevel: true },
  });
  const existing = new Set(rows.map((r) => `${r.dayId}:${r.accommodationLevel}`));

  // Compute missing combinations
  const missing: { dayId: string; accommodationLevel: AccommodationLevel; activityPriceUsd: number; transferPriceUsd: number; accommodationPriceUsd: number }[] = [];
  for (const d of days) {
    for (const lv of LEVELS) {
      const key = `${d.id}:${lv}`;
      if (!existing.has(key)) {
        missing.push({
          dayId: d.id,
          accommodationLevel: lv,
          activityPriceUsd: 0,
          transferPriceUsd: 0,
          accommodationPriceUsd: 0,
        });
      }
    }
  }

  if (missing.length > 0) {
    await prisma.dayPricing.createMany({
      data: missing,
      skipDuplicates: true,
    });
  }
}

export function levelApiToDb(level: '3' | '4' | '5' | 'deluxe'): AccommodationLevel {
  switch (level) {
    case '3':
      return 'three';
    case '4':
      return 'four';
    case '5':
      return 'five';
    default:
      return 'deluxe';
  }
}


