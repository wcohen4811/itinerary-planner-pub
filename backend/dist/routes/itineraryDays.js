import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { apiToPrisma } from '../utils/accommodation.js';
import { recomputePricing } from '../services/pricing.js';
import { resolveDestinationInput } from '../utils/destination.js';
import { ensureDefaultDayPricingItems } from '../services/pricingLineItems.js';
export const itineraryDaysRouter = Router();
// List days for an itinerary (owned by current user)
itineraryDaysRouter.get('/:itineraryId/days', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.itineraryId },
    });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const days = await prisma.day.findMany({
        where: { itineraryId: it.id },
        orderBy: { dayNumber: 'asc' },
    });
    res.json({ days });
});
// Add a day to an itinerary (owned by current user)
itineraryDaysRouter.post('/:itineraryId/days', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.itineraryId },
    });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const d = req.body ?? {};
    if (typeof d.dayNumber !== 'number' ||
        !d.title ||
        !d.description ||
        !d.accommodationLevel ||
        (!d.destination && !d.destinationId)) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    const resolved = await resolveDestinationInput({
        destinationId: d.destinationId ?? null,
        destination: d.destination ?? null,
    });
    if (d.destinationId && !resolved.found && !d.destination) {
        return res.status(400).json({ error: 'Destination not found for destinationId' });
    }
    const destination = resolved.destination ?? d.destination ?? 'TBD';
    const created = await prisma.day.create({
        data: {
            itineraryId: it.id,
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description,
            hotelName: d.hotelName ?? null,
            date: d.date ? new Date(d.date) : new Date(new Date(it.startDate).setDate(new Date(it.startDate).getDate() + (d.dayNumber - 1))),
            dayOfWeek: (() => {
                const dt = d.date ? new Date(d.date) : new Date(new Date(it.startDate).setDate(new Date(it.startDate).getDate() + (d.dayNumber - 1)));
                return dt.toLocaleDateString('en-US', { weekday: 'long' });
            })(),
            accommodationLevel: apiToPrisma(d.accommodationLevel),
            destination,
            destinationId: resolved.destinationId ?? undefined,
            transferStatus: d.transferStatus ?? 'none',
            transferCount: typeof d.transferCount === 'number' && d.transferCount > 0 ? Math.floor(d.transferCount) : 0,
            components: d.components ?? undefined,
            activityName: d.activity?.name ?? null,
            activityPriceUsd: typeof d.activity?.priceUsd === 'number' ? Math.max(0, d.activity.priceUsd) : 0,
        },
    });
    // Initialize per-level pricing rows
    await prisma.dayPricing.createMany({
        data: [
            { dayId: created.id, accommodationLevel: 'three', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
            { dayId: created.id, accommodationLevel: 'four', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
            { dayId: created.id, accommodationLevel: 'five', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
            { dayId: created.id, accommodationLevel: 'deluxe', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
        ],
        skipDuplicates: true,
    });
    if (!it.blankPricing) {
        await ensureDefaultDayPricingItems(created.id);
    }
    await recomputePricing(it.id);
    const day = await prisma.day.findUnique({ where: { id: created.id } });
    res.status(201).json({ day });
});
// Clone a day from the library (snapshot copy)
itineraryDaysRouter.post('/:itineraryId/days/clone', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.itineraryId },
    });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const sourceDayId = req.body?.sourceDayId;
    if (!sourceDayId)
        return res.status(400).json({ error: 'sourceDayId required' });
    const source = await prisma.day.findUnique({
        where: { id: sourceDayId },
    });
    if (!source)
        return res.status(404).json({ error: 'Source day not found' });
    const maxDay = await prisma.day.aggregate({
        where: { itineraryId: it.id },
        _max: { dayNumber: true },
    });
    const nextNumber = (maxDay._max.dayNumber ?? 0) + 1;
    const dt = new Date(new Date(it.startDate).setDate(new Date(it.startDate).getDate() + (nextNumber - 1)));
    const created = await prisma.day.create({
        data: {
            itineraryId: it.id,
            dayNumber: nextNumber,
            title: source.title,
            description: source.description,
            hotelName: source.hotelName,
            destination: source.destination,
            destinationId: source.destinationId,
            transferStatus: source.transferStatus,
            transferCount: source.transferCount,
            accommodationLevel: source.accommodationLevel,
            activityName: source.activityName,
            activityPriceUsd: source.activityPriceUsd,
            components: source.components ?? undefined,
            date: dt,
            dayOfWeek: dt.toLocaleDateString('en-US', { weekday: 'long' }),
        },
    });
    const sourceItems = await prisma.dayPricingItem.findMany({
        where: { dayId: source.id, isRemoved: false },
    });
    if (sourceItems.length > 0) {
        await prisma.dayPricingItem.createMany({
            data: sourceItems.map((i) => ({
                dayId: created.id,
                name: i.name,
                amountUsd: i.amountUsd,
                kind: i.kind,
                accommodationLevel: i.accommodationLevel,
                occupancy: i.occupancy,
                templateId: i.templateId,
            })),
            skipDuplicates: true,
        });
    }
    const sourcePricings = await prisma.dayPricing.findMany({
        where: { dayId: source.id },
    });
    if (sourcePricings.length > 0) {
        await prisma.dayPricing.createMany({
            data: sourcePricings.map((p) => ({
                dayId: created.id,
                accommodationLevel: p.accommodationLevel,
                activityPriceUsd: p.activityPriceUsd,
                transferPriceUsd: p.transferPriceUsd,
                accommodationPriceUsd: p.accommodationPriceUsd,
            })),
            skipDuplicates: true,
        });
    }
    if (!it.blankPricing) {
        await ensureDefaultDayPricingItems(created.id);
    }
    await recomputePricing(it.id);
    const day = await prisma.day.findUnique({ where: { id: created.id } });
    res.status(201).json({ day });
});
// Update a day
itineraryDaysRouter.put('/:itineraryId/days/:dayId', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.itineraryId },
    });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const d = req.body ?? {};
    const data = {};
    if (typeof d.dayNumber === 'number')
        data.dayNumber = d.dayNumber;
    if (d.title)
        data.title = d.title;
    if (d.description)
        data.description = d.description;
    if (d.hotelName !== undefined)
        data.hotelName = d.hotelName;
    if (d.accommodationLevel)
        data.accommodationLevel = apiToPrisma(d.accommodationLevel);
    if (d.destination !== undefined || d.destinationId !== undefined) {
        const resolved = await resolveDestinationInput({
            destinationId: d.destinationId ?? null,
            destination: d.destination ?? null,
        });
        if (d.destinationId && !resolved.found && d.destination === undefined) {
            return res.status(400).json({ error: 'Destination not found for destinationId' });
        }
        data.destination = resolved.destination ?? d.destination ?? 'TBD';
        data.destinationId = resolved.destinationId ?? null;
    }
    if (d.transferStatus)
        data.transferStatus = d.transferStatus;
    if (d.transferCount !== undefined) {
        const n = Math.max(0, Math.floor(Number(d.transferCount)));
        data.transferCount = isFinite(n) ? n : 0;
    }
    if (d.date) {
        const dt = new Date(d.date);
        data.date = dt;
        data.dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'long' });
    }
    else if (typeof d.dayNumber === 'number') {
        const dt = new Date(new Date(it.startDate).setDate(new Date(it.startDate).getDate() + (d.dayNumber - 1)));
        data.date = dt;
        data.dayOfWeek = dt.toLocaleDateString('en-US', { weekday: 'long' });
    }
    if (d.components !== undefined)
        data.components = d.components;
    if (d.activity !== undefined) {
        data.activityName = d.activity?.name ?? null;
        data.activityPriceUsd =
            typeof d.activity?.priceUsd === 'number' ? Math.max(0, d.activity.priceUsd) : 0;
    }
    const updated = await prisma.day.update({
        where: { id: req.params.dayId },
        data,
    });
    if (!it.blankPricing) {
        await ensureDefaultDayPricingItems(updated.id);
    }
    await recomputePricing(it.id);
    const day = await prisma.day.findUnique({ where: { id: updated.id } });
    res.json({ day });
});
// Delete a day
itineraryDaysRouter.delete('/:itineraryId/days/:dayId', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.itineraryId },
    });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    await prisma.day.delete({ where: { id: req.params.dayId } });
    await recomputePricing(it.id);
    res.status(204).send();
});
