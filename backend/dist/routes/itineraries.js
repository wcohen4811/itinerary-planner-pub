import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { apiToPrisma } from '../utils/accommodation.js';
import { getItineraryPricing } from '../services/pricing.js';
import { cascadeItineraryDates, computeEndDate } from '../services/dates.js';
import { requireAdmin } from '../middleware/auth.js';
export const itinerariesRouter = Router();
const MAX_COVER_BYTES = 2 * 1024 * 1024;
function base64Bytes(raw) {
    const trimmed = raw.trim();
    const base64 = trimmed.includes(',') ? trimmed.split(',').pop() || '' : trimmed;
    return Math.floor((base64.length * 3) / 4);
}
itinerariesRouter.get('/', async (req, res) => {
    const its = await prisma.itinerary.findMany({
        orderBy: { createdAt: 'desc' },
        include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    const withEnd = its.map((it) => {
        const end = computeEndDate(new Date(it.startDate), it.days.length);
        return { ...it, endDate: end.toISOString() };
    });
    res.json({ itineraries: withEnd });
});
// Day library search (snapshot from existing itineraries)
itinerariesRouter.get('/library/days', async (req, res) => {
    const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const where = q
        ? {
            OR: [
                { title: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { description: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { destination: { contains: q, mode: Prisma.QueryMode.insensitive } },
                { hotelName: { contains: q, mode: Prisma.QueryMode.insensitive } },
            ],
        }
        : undefined;
    const days = (await prisma.day.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 50,
        include: { itinerary: { select: { id: true, title: true } } },
    }));
    res.json({
        days: days.map((d) => ({
            id: d.id,
            title: d.title,
            dayNumber: d.dayNumber,
            itineraryId: d.itineraryId,
            itineraryTitle: d.itinerary.title,
            description: d.description,
            hotelName: d.hotelName,
            destination: d.destination,
            transferCount: d.transferCount,
            accommodationLevel: d.accommodationLevel,
        })),
    });
});
itinerariesRouter.post('/', async (req, res) => {
    const { title, startDate, accommodationLevel = '3', createdByName, description, messageTemplate, blankPricing } = req.body ?? {};
    if (!title)
        return res.status(400).json({ error: 'title required' });
    if (!startDate)
        return res.status(400).json({ error: 'startDate required (ISO string)' });
    const authorName = createdByName ?? req.appUser?.name ?? 'User';
    const it = await prisma.itinerary.create({
        data: {
            userId: req.appUser.id,
            title,
            description: description ?? null,
            messageTemplate: messageTemplate ?? null,
            startDate: new Date(startDate),
            accommodationLevel: apiToPrisma(accommodationLevel),
            blankPricing: !!blankPricing,
            createdByName: authorName,
            updatedByName: authorName,
            totalPriceUsd: 0,
        },
        include: { days: true },
    });
    res.status(201).json({ itinerary: it });
});
// Update itinerary (title, accommodation)
itinerariesRouter.put('/:id', async (req, res) => {
    const it = await prisma.itinerary.findFirst({ where: { id: req.params.id } });
    if (!it)
        return res.status(404).json({ error: 'Not found' });
    const { title, accommodationLevel, startDate, updatedByName, description, coverImageBase64, messageTemplate, blankPricing } = req.body ?? {};
    const data = {};
    if (title)
        data.title = title;
    if (description !== undefined)
        data.description = description;
    if (blankPricing !== undefined)
        data.blankPricing = !!blankPricing;
    if (messageTemplate !== undefined)
        data.messageTemplate = messageTemplate;
    if (coverImageBase64 !== undefined) {
        if (coverImageBase64 && base64Bytes(String(coverImageBase64)) > MAX_COVER_BYTES) {
            return res.status(400).json({ error: 'coverImageBase64 exceeds 2MB limit' });
        }
        data.coverImageBase64 = coverImageBase64 || null;
    }
    if (accommodationLevel)
        data.accommodationLevel = apiToPrisma(accommodationLevel);
    if (startDate)
        data.startDate = new Date(startDate);
    if (updatedByName)
        data.updatedByName = updatedByName;
    else if (req.appUser?.name)
        data.updatedByName = req.appUser.name;
    const updated = await prisma.itinerary.update({ where: { id: it.id }, data, include: { days: true } });
    if (startDate) {
        await cascadeItineraryDates(updated.id);
    }
    const fresh = await prisma.itinerary.findFirst({
        where: { id: it.id },
        include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    const end = computeEndDate(new Date(fresh.startDate), fresh.days.length);
    res.json({ itinerary: { ...fresh, endDate: end.toISOString() } });
});
// Get an itinerary with days
itinerariesRouter.get('/:id', async (req, res) => {
    const it = await prisma.itinerary.findFirst({
        where: { id: req.params.id },
        include: { days: { orderBy: { dayNumber: 'asc' } } },
    });
    if (!it)
        return res.status(404).json({ error: 'Not found' });
    const end = computeEndDate(new Date(it.startDate), it.days.length);
    res.json({ itinerary: { ...it, endDate: end.toISOString() } });
});
// Delete an itinerary and its days (admin only)
itinerariesRouter.delete('/:id', requireAdmin, async (req, res) => {
    const it = await prisma.itinerary.findFirst({ where: { id: req.params.id } });
    if (!it)
        return res.status(404).json({ error: 'Not found' });
    const days = await prisma.day.findMany({
        where: { itineraryId: it.id },
        select: { id: true },
    });
    const dayIds = days.map((d) => d.id);
    await prisma.$transaction([
        prisma.dayPricing.deleteMany({ where: { dayId: { in: dayIds } } }),
        prisma.dayPricingItem.deleteMany({ where: { dayId: { in: dayIds } } }),
        prisma.itineraryPricingItem.deleteMany({ where: { itineraryId: it.id } }),
        prisma.day.deleteMany({ where: { itineraryId: it.id } }),
        prisma.itinerary.delete({ where: { id: it.id } }),
    ]);
    res.status(204).send();
});
// Get pricing summary
itinerariesRouter.get('/:id/pricing', async (req, res) => {
    const it = await prisma.itinerary.findFirst({ where: { id: req.params.id } });
    if (!it)
        return res.status(404).json({ error: 'Not found' });
    const pricing = await getItineraryPricing(it.id);
    res.json(pricing);
});
