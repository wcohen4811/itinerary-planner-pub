import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { ensureDayPricingForItinerary, levelApiToDb } from '../services/dayPricing.js';
export const dayPricingRouter = Router();
// List pricing rows for an itinerary and level
dayPricingRouter.get('/:itineraryId/pricing/levels/:level', async (req, res) => {
    const { itineraryId, level } = req.params;
    const it = await prisma.itinerary.findFirst({ where: { id: itineraryId } });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    await ensureDayPricingForItinerary(itineraryId);
    const lv = levelApiToDb(level);
    const days = await prisma.day.findMany({
        where: { itineraryId },
        orderBy: { dayNumber: 'asc' },
        select: {
            id: true,
            dayNumber: true,
            title: true,
        },
    });
    const rows = await prisma.dayPricing.findMany({
        where: { dayId: { in: days.map((d) => d.id) }, accommodationLevel: lv },
    });
    const byDay = new Map(rows.map((r) => [r.dayId, r]));
    const result = days.map((d) => {
        const r = byDay.get(d.id);
        return {
            dayId: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            activityPriceUsd: r?.activityPriceUsd ?? 0,
            transferPriceUsd: r?.transferPriceUsd ?? 0,
            accommodationPriceUsd: r?.accommodationPriceUsd ?? 0,
            totalPriceUsd: (r?.activityPriceUsd ?? 0) + (r?.transferPriceUsd ?? 0) + (r?.accommodationPriceUsd ?? 0),
        };
    });
    res.json({ rows: result });
});
// Update a day's pricing for a level
dayPricingRouter.put('/:itineraryId/pricing/levels/:level/days/:dayId', async (req, res) => {
    const { itineraryId, level, dayId } = req.params;
    const it = await prisma.itinerary.findFirst({ where: { id: itineraryId } });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const lv = levelApiToDb(level);
    const d = req.body ?? {};
    const activityPriceUsd = typeof d.activityPriceUsd === 'number' ? Math.max(0, Math.floor(d.activityPriceUsd)) : undefined;
    const transferPriceUsd = typeof d.transferPriceUsd === 'number' ? Math.max(0, Math.floor(d.transferPriceUsd)) : undefined;
    const accommodationPriceUsd = typeof d.accommodationPriceUsd === 'number' ? Math.max(0, Math.floor(d.accommodationPriceUsd)) : undefined;
    const updated = await prisma.dayPricing.upsert({
        where: { dayId_accommodationLevel: { dayId, accommodationLevel: lv } },
        update: {
            ...(activityPriceUsd != null ? { activityPriceUsd } : {}),
            ...(transferPriceUsd != null ? { transferPriceUsd } : {}),
            ...(accommodationPriceUsd != null ? { accommodationPriceUsd } : {}),
        },
        create: {
            dayId,
            accommodationLevel: lv,
            activityPriceUsd: activityPriceUsd ?? 0,
            transferPriceUsd: transferPriceUsd ?? 0,
            accommodationPriceUsd: accommodationPriceUsd ?? 0,
        },
    });
    res.json({ row: updated });
});
