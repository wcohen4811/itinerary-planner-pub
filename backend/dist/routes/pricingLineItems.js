import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { ensureDefaultDayPricingItemsForItinerary } from '../services/pricingLineItems.js';
import { ensurePricingTemplate } from '../services/pricingTemplates.js';
import { apiToPrisma, prismaToApi } from '../utils/accommodation.js';
const occupancyValues = ['single', 'double', 'triple'];
function parseOccupancy(raw) {
    if (occupancyValues.includes(raw))
        return raw;
    return 'double';
}
export const pricingLineItemsRouter = Router();
// List itinerary-level and day-level pricing line items
pricingLineItemsRouter.get('/:itineraryId/pricing/line-items', async (req, res) => {
    const { itineraryId } = req.params;
    const level = typeof req.query.level === 'string' ? req.query.level : null;
    const occupancy = parseOccupancy(req.query.occupancy);
    const it = await prisma.itinerary.findFirst({ where: { id: itineraryId } });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    await ensureDefaultDayPricingItemsForItinerary(itineraryId);
    const lv = level ? apiToPrisma(level) : null;
    const generalItems = await prisma.itineraryPricingItem.findMany({
        where: {
            itineraryId,
            ...(lv ? { accommodationLevel: lv } : {}),
            ...(occupancy ? { occupancy } : {}),
        },
        orderBy: { createdAt: 'asc' },
    });
    const days = await prisma.day.findMany({
        where: { itineraryId },
        orderBy: { dayNumber: 'asc' },
        select: { id: true, dayNumber: true, title: true },
    });
    const items = await prisma.dayPricingItem.findMany({
        where: {
            dayId: { in: days.map((d) => d.id) },
            ...(lv ? { accommodationLevel: lv } : {}),
            ...(occupancy ? { occupancy } : {}),
            isRemoved: false,
        },
        orderBy: { createdAt: 'asc' },
    });
    const itemsByDay = new Map();
    for (const it of items) {
        const arr = itemsByDay.get(it.dayId) ?? [];
        arr.push(it);
        itemsByDay.set(it.dayId, arr);
    }
    res.json({
        generalItems,
        days: days.map((d) => ({
            dayId: d.id,
            dayNumber: d.dayNumber,
            title: d.title,
            items: itemsByDay.get(d.id) ?? [],
        })),
    });
});
// Create itinerary-level line item
pricingLineItemsRouter.post('/:itineraryId/pricing/line-items', async (req, res) => {
    const { itineraryId } = req.params;
    const it = await prisma.itinerary.findFirst({ where: { id: itineraryId } });
    if (!it)
        return res.status(404).json({ error: 'Itinerary not found' });
    const body = req.body ?? {};
    const level = body.accommodationLevel;
    const occupancy = parseOccupancy(body.occupancy);
    const lv = apiToPrisma(level ?? prismaToApi(it.accommodationLevel));
    const template = body.templateId ? await prisma.pricingLineItemTemplate.findUnique({ where: { id: body.templateId } }) : null;
    const templatePrice = template
        ? await prisma.pricingLineItemTemplatePrice.findUnique({
            where: { templateId_accommodationLevel_occupancy: { templateId: template.id, accommodationLevel: lv, occupancy } },
        })
        : null;
    const name = (body.name ?? template?.name ?? '').trim();
    if (!name)
        return res.status(400).json({ error: 'name required' });
    const amountUsd = typeof body.amountUsd === 'number'
        ? Math.max(0, Math.floor(body.amountUsd))
        : templatePrice?.amountUsd ?? template?.defaultAmountUsd ?? 0;
    const kind = body.kind ?? template?.kind ?? 'general';
    const savedTemplate = await ensurePricingTemplate({ name, kind, defaultAmountUsd: 0 });
    const templateId = body.templateId ?? savedTemplate.id;
    const saveTemplate = !!body.saveTemplate;
    if (saveTemplate) {
        await prisma.pricingLineItemTemplatePrice.upsert({
            where: { templateId_accommodationLevel_occupancy: { templateId, accommodationLevel: lv, occupancy } },
            update: { amountUsd },
            create: { templateId, accommodationLevel: lv, occupancy, amountUsd },
        });
    }
    const created = await prisma.itineraryPricingItem.create({
        data: {
            itineraryId,
            accommodationLevel: lv,
            occupancy,
            name,
            amountUsd,
            kind,
            templateId,
        },
    });
    res.status(201).json({ item: created });
});
// Update itinerary-level line item
pricingLineItemsRouter.put('/:itineraryId/pricing/line-items/:itemId', async (req, res) => {
    const { itineraryId, itemId } = req.params;
    const item = await prisma.itineraryPricingItem.findFirst({ where: { id: itemId, itineraryId } });
    if (!item)
        return res.status(404).json({ error: 'Line item not found' });
    const body = req.body ?? {};
    const data = {};
    if (body.name !== undefined)
        data.name = String(body.name);
    if (body.amountUsd !== undefined)
        data.amountUsd = Math.max(0, Math.floor(Number(body.amountUsd)));
    const updated = await prisma.itineraryPricingItem.update({ where: { id: item.id }, data });
    res.json({ item: updated });
});
// Delete itinerary-level line item
pricingLineItemsRouter.delete('/:itineraryId/pricing/line-items/:itemId', async (req, res) => {
    const { itineraryId, itemId } = req.params;
    const item = await prisma.itineraryPricingItem.findFirst({ where: { id: itemId, itineraryId } });
    if (!item)
        return res.status(404).json({ error: 'Line item not found' });
    await prisma.itineraryPricingItem.delete({ where: { id: item.id } });
    res.status(204).send();
});
// Create day-level line item
pricingLineItemsRouter.post('/:itineraryId/days/:dayId/pricing/items', async (req, res) => {
    const { itineraryId, dayId } = req.params;
    const day = await prisma.day.findFirst({ where: { id: dayId, itineraryId } });
    if (!day)
        return res.status(404).json({ error: 'Day not found' });
    const body = req.body ?? {};
    const level = body.accommodationLevel;
    const occupancy = parseOccupancy(body.occupancy);
    const lv = apiToPrisma(level ?? prismaToApi(day.accommodationLevel));
    const template = body.templateId ? await prisma.pricingLineItemTemplate.findUnique({ where: { id: body.templateId } }) : null;
    const templatePrice = template
        ? await prisma.pricingLineItemTemplatePrice.findUnique({
            where: { templateId_accommodationLevel_occupancy: { templateId: template.id, accommodationLevel: lv, occupancy } },
        })
        : null;
    const name = (body.name ?? template?.name ?? '').trim();
    if (!name)
        return res.status(400).json({ error: 'name required' });
    const amountUsd = typeof body.amountUsd === 'number'
        ? Math.max(0, Math.floor(body.amountUsd))
        : templatePrice?.amountUsd ?? template?.defaultAmountUsd ?? 0;
    const kind = body.kind ?? template?.kind ?? 'custom';
    const savedTemplate = await ensurePricingTemplate({ name, kind, defaultAmountUsd: 0 });
    const templateId = body.templateId ?? savedTemplate.id;
    const saveTemplate = !!body.saveTemplate;
    if (saveTemplate) {
        await prisma.pricingLineItemTemplatePrice.upsert({
            where: { templateId_accommodationLevel_occupancy: { templateId, accommodationLevel: lv, occupancy } },
            update: { amountUsd },
            create: { templateId, accommodationLevel: lv, occupancy, amountUsd },
        });
    }
    const created = await prisma.dayPricingItem.create({
        data: {
            dayId,
            accommodationLevel: lv,
            occupancy,
            name,
            amountUsd,
            kind,
            templateId,
        },
    });
    res.status(201).json({ item: created });
});
// Update day-level line item
pricingLineItemsRouter.put('/:itineraryId/days/:dayId/pricing/items/:itemId', async (req, res) => {
    const { itineraryId, dayId, itemId } = req.params;
    const item = await prisma.dayPricingItem.findFirst({
        where: { id: itemId, dayId },
        include: { day: true },
    });
    if (!item || item.day.itineraryId !== itineraryId)
        return res.status(404).json({ error: 'Line item not found' });
    const body = req.body ?? {};
    const data = {};
    if (body.name !== undefined)
        data.name = String(body.name);
    if (body.amountUsd !== undefined)
        data.amountUsd = Math.max(0, Math.floor(Number(body.amountUsd)));
    const updated = await prisma.dayPricingItem.update({ where: { id: item.id }, data });
    res.json({ item: updated });
});
// Delete day-level line item
pricingLineItemsRouter.delete('/:itineraryId/days/:dayId/pricing/items/:itemId', async (req, res) => {
    const { itineraryId, dayId, itemId } = req.params;
    const item = await prisma.dayPricingItem.findFirst({
        where: { id: itemId, dayId },
        include: { day: true },
    });
    if (!item || item.day.itineraryId !== itineraryId)
        return res.status(404).json({ error: 'Line item not found' });
    if (item.kind === 'hotel' || item.kind === 'activity') {
        await prisma.dayPricingItem.update({ where: { id: item.id }, data: { isRemoved: true } });
    }
    else {
        await prisma.dayPricingItem.delete({ where: { id: item.id } });
    }
    res.status(204).send();
});
