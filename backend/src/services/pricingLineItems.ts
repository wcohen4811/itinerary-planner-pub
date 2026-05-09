import { prisma } from '../db/prisma.js';
import type { AccommodationLevel, Occupancy, PricingLineItemKind } from '@prisma/client';

const LEVELS: AccommodationLevel[] = ['three', 'four', 'five', 'deluxe'];
const OCCUPANCIES: Occupancy[] = ['single', 'double', 'triple'];

function hotelLabel(hotelName?: string | null) {
  const name = (hotelName || '').trim();
  return name ? `Hotel: ${name}` : 'Hotel';
}

function activityLabel(activityName?: string | null) {
  const name = (activityName || '').trim();
  return name ? `Activity: ${name}` : 'Activity';
}

export async function ensureDefaultDayPricingItems(dayId: string) {
  const day = await prisma.day.findUnique({
    where: { id: dayId },
    select: { id: true, hotelName: true, activityName: true },
  });
  if (!day) return;

  const existing = await prisma.dayPricingItem.findMany({
    where: { dayId: day.id },
    select: { id: true, kind: true, name: true, accommodationLevel: true, occupancy: true, isRemoved: true },
  });
  const byKey = new Map<string, { id: string; name: string; isRemoved: boolean }>(
    existing.map((e) => [`${e.kind}:${e.accommodationLevel}:${e.occupancy}`, { id: e.id, name: e.name, isRemoved: e.isRemoved }]),
  );

  const toCreate: { dayId: string; name: string; amountUsd: number; kind: PricingLineItemKind; accommodationLevel: AccommodationLevel; occupancy: Occupancy }[] = [];

  const updates: Promise<any>[] = [];
  const ensureKind = (kind: PricingLineItemKind, label: string) => {
    for (const lv of LEVELS) {
      for (const occ of OCCUPANCIES) {
        const key = `${kind}:${lv}:${occ}`;
        const existingItem = byKey.get(key);
        if (!existingItem) {
          toCreate.push({
            dayId: day.id,
            name: label,
            amountUsd: 0,
            kind,
            accommodationLevel: lv,
            occupancy: occ,
          });
        } else if (!existingItem.isRemoved && existingItem.name !== label) {
          updates.push(prisma.dayPricingItem.update({
            where: { id: existingItem.id },
            data: { name: label },
          }));
        }
      }
    }
  };

  ensureKind('hotel', hotelLabel(day.hotelName));
  ensureKind('activity', activityLabel(day.activityName));

  if (toCreate.length > 0) {
    await prisma.dayPricingItem.createMany({ data: toCreate });
  }
  if (updates.length > 0) {
    await Promise.all(updates);
  }
}

export async function ensureDefaultDayPricingItemsForItinerary(itineraryId: string) {
  const days = await prisma.day.findMany({
    where: { itineraryId },
    select: { id: true },
  });
  for (const d of days) {
    await ensureDefaultDayPricingItems(d.id);
  }
}

