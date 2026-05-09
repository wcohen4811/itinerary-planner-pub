import { prisma } from '../db/prisma.js';
const LEVELS = ['three', 'four', 'five', 'deluxe'];
const OCCUPANCIES = ['single', 'double', 'triple'];
function hotelLabel(hotelName) {
    const name = (hotelName || '').trim();
    return name ? `Hotel: ${name}` : 'Hotel';
}
function activityLabel(activityName) {
    const name = (activityName || '').trim();
    return name ? `Activity: ${name}` : 'Activity';
}
export async function ensureDefaultDayPricingItems(dayId) {
    const day = await prisma.day.findUnique({
        where: { id: dayId },
        select: { id: true, hotelName: true, activityName: true },
    });
    if (!day)
        return;
    const existing = await prisma.dayPricingItem.findMany({
        where: { dayId: day.id },
        select: { id: true, kind: true, name: true, accommodationLevel: true, occupancy: true, isRemoved: true },
    });
    const byKey = new Map(existing.map((e) => [`${e.kind}:${e.accommodationLevel}:${e.occupancy}`, { id: e.id, name: e.name, isRemoved: e.isRemoved }]));
    const toCreate = [];
    const updates = [];
    const ensureKind = (kind, label) => {
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
                }
                else if (!existingItem.isRemoved && existingItem.name !== label) {
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
export async function ensureDefaultDayPricingItemsForItinerary(itineraryId) {
    const days = await prisma.day.findMany({
        where: { itineraryId },
        select: { id: true },
    });
    for (const d of days) {
        await ensureDefaultDayPricingItems(d.id);
    }
}
