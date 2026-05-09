import { prisma } from '../db/prisma.js';
import { apiToPrisma, prismaToApi } from '../utils/accommodation.js';
import { recomputePricing } from './pricing.js';
import { resolveDestinationInput } from '../utils/destination.js';
import { ensureDefaultDayPricingItems } from './pricingLineItems.js';
const OCCUPANCY_DEFAULT = 'double';
export class TitleConflictError extends Error {
    importedTitle;
    existingItinerary;
    code = 'TITLE_EXISTS';
    constructor(importedTitle, existingItinerary) {
        super(`An itinerary titled "${importedTitle}" already exists`);
        this.importedTitle = importedTitle;
        this.existingItinerary = existingItinerary;
        this.name = 'TitleConflictError';
    }
}
function parseApiLevel(raw) {
    const s = String(raw ?? '3').toLowerCase();
    if (s === '3' || s === '4' || s === '5' || s === 'deluxe')
        return s;
    return '3';
}
function parseKind(raw) {
    const allowed = ['hotel', 'activity', 'custom', 'general', 'fee'];
    if (typeof raw === 'string' && allowed.includes(raw))
        return raw;
    return 'general';
}
function moneyUsd(raw) {
    if (typeof raw !== 'number' || !isFinite(raw))
        return null;
    return Math.max(0, Math.floor(raw));
}
function collectItineraryPricingInputs(it) {
    const items = [];
    const addAmt = (name, amount, kind = 'general') => {
        if (amount === null)
            return;
        items.push({ name, amountUsd: amount, kind });
    };
    const net = moneyUsd(it.netPriceUsd) ?? moneyUsd(it.netPrice);
    addAmt('Net price', net);
    const ppt = moneyUsd(it.perPersonTotalUsd) ??
        moneyUsd(it.perPersonTotal) ??
        moneyUsd(it.personTotalUsd) ??
        moneyUsd(it.personTotal);
    addAmt('Per person total', ppt);
    const rawList = it.itineraryPricingItems ?? it.generalPricingItems;
    if (Array.isArray(rawList)) {
        for (const row of rawList) {
            if (!row || typeof row !== 'object')
                continue;
            const r = row;
            const name = String(r.name ?? '').trim();
            const amt = moneyUsd(r.amountUsd ?? r.amount);
            if (!name || amt === null)
                continue;
            items.push({ name, amountUsd: amt, kind: parseKind(r.kind) });
        }
    }
    return items;
}
function collectDayPricingInputs(d) {
    const items = [];
    const addAmt = (name, amount, kind = 'general') => {
        if (amount === null)
            return;
        items.push({ name, amountUsd: amount, kind });
    };
    const net = moneyUsd(d.netPriceUsd) ?? moneyUsd(d.netPrice);
    addAmt('Net price', net);
    const ppt = moneyUsd(d.perPersonTotalUsd) ??
        moneyUsd(d.perPersonTotal) ??
        moneyUsd(d.personTotalUsd) ??
        moneyUsd(d.personTotal);
    addAmt('Per person total', ppt);
    const rawList = d.pricingItems ?? d.lineItems;
    if (Array.isArray(rawList)) {
        for (const row of rawList) {
            if (!row || typeof row !== 'object')
                continue;
            const r = row;
            const name = String(r.name ?? '').trim();
            const amt = moneyUsd(r.amountUsd ?? r.amount);
            if (!name || amt === null)
                continue;
            items.push({ name, amountUsd: amt, kind: parseKind(r.kind) });
        }
    }
    return items;
}
function parseTransfer(raw) {
    const s = String(raw ?? 'none').toLowerCase();
    if (s === 'in' || s === 'out')
        return s;
    return 'none';
}
function zeroDayPricingRows(dayId) {
    return [
        { dayId, accommodationLevel: 'three', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
        { dayId, accommodationLevel: 'four', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
        { dayId, accommodationLevel: 'five', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
        { dayId, accommodationLevel: 'deluxe', activityPriceUsd: 0, transferPriceUsd: 0, accommodationPriceUsd: 0 },
    ];
}
function toDayLineItemRows(dayId, levelForLineItems, items) {
    return items.map((pi) => ({
        dayId,
        accommodationLevel: levelForLineItems,
        occupancy: OCCUPANCY_DEFAULT,
        name: pi.name,
        amountUsd: pi.amountUsd,
        kind: pi.kind,
    }));
}
async function materializeDaysAndLineItems(args) {
    const { itineraryId, itineraryRecord, it, levelForLineItems, apiLv } = args;
    const blankPricing = itineraryRecord.blankPricing;
    const days = Array.isArray(it.days) ? it.days : [];
    for (const raw of days) {
        const d = raw;
        const dayNum = typeof d.dayNumber === 'number' ? d.dayNumber : 1;
        const dt = new Date(itineraryRecord.startDate);
        dt.setDate(dt.getDate() + (dayNum - 1));
        const resolved = await resolveDestinationInput({
            destinationId: d.destinationId ?? null,
            destination: d.destination ?? null,
        });
        const createdDay = await prisma.day.create({
            data: {
                itineraryId,
                dayNumber: dayNum,
                title: String(d.title ?? `Day ${dayNum}`),
                description: String(d.description ?? 'TBD'),
                destination: resolved.destination ?? d.destination ?? 'TBD',
                destinationId: resolved.destinationId ?? undefined,
                accommodationLevel: apiToPrisma(parseApiLevel(d.accommodationLevel ?? apiLv)),
                transferStatus: parseTransfer(d.transferStatus),
                transferCount: typeof d.transferCount === 'number' ? Math.max(0, d.transferCount) : 0,
                hotelName: d.hotelName ?? null,
                date: dt,
                dayOfWeek: dt.toLocaleDateString('en-US', { weekday: 'long' }),
            },
        });
        await prisma.dayPricing.createMany({ data: zeroDayPricingRows(createdDay.id), skipDuplicates: true });
        if (!blankPricing) {
            await ensureDefaultDayPricingItems(createdDay.id);
        }
        const dayLineItems = collectDayPricingInputs(d);
        if (dayLineItems.length > 0) {
            await prisma.dayPricingItem.createMany({
                data: toDayLineItemRows(createdDay.id, levelForLineItems, dayLineItems),
            });
        }
    }
    const itineraryItems = collectItineraryPricingInputs(it);
    if (itineraryItems.length > 0) {
        await prisma.itineraryPricingItem.createMany({
            data: itineraryItems.map((pi) => ({
                itineraryId,
                accommodationLevel: levelForLineItems,
                occupancy: OCCUPANCY_DEFAULT,
                name: pi.name,
                amountUsd: pi.amountUsd,
                kind: pi.kind,
            })),
        });
    }
}
/** Full new itinerary row + days + line items (never modifies another itinerary). */
async function createFullItineraryFromImport(args) {
    const { publicUserId, it } = args;
    const title = String(it.title ?? '').trim();
    const start = it.startDate ? new Date(String(it.startDate)) : new Date();
    const blankPricing = !!it.blankPricing;
    const accLevel = apiToPrisma(parseApiLevel(it.accommodationLevel));
    const created = await prisma.itinerary.create({
        data: {
            userId: publicUserId,
            title,
            description: it.description ?? null,
            startDate: start,
            accommodationLevel: accLevel,
            blankPricing,
            createdByName: 'Import',
            updatedByName: 'Import',
        },
    });
    const itineraryRecord = await prisma.itinerary.findUnique({ where: { id: created.id } });
    if (!itineraryRecord)
        throw new Error('Itinerary missing after import');
    const apiLv = it.accommodationLevel !== undefined && it.accommodationLevel !== null
        ? parseApiLevel(it.accommodationLevel)
        : prismaToApi(itineraryRecord.accommodationLevel);
    const levelForLineItems = apiToPrisma(apiLv);
    await materializeDaysAndLineItems({
        itineraryId: created.id,
        itineraryRecord,
        it,
        levelForLineItems,
        apiLv,
    });
    await recomputePricing(created.id);
    return { id: created.id };
}
/** Append imported pricing line items to an existing itinerary; add missing days from the import without removing anything. */
async function mergePricingIntoExistingItinerary(args) {
    const { mergeIntoItineraryId, it } = args;
    const itineraryRecord = await prisma.itinerary.findUnique({ where: { id: mergeIntoItineraryId } });
    if (!itineraryRecord)
        throw new Error('Itinerary not found');
    const apiLv = it.accommodationLevel !== undefined && it.accommodationLevel !== null
        ? parseApiLevel(it.accommodationLevel)
        : prismaToApi(itineraryRecord.accommodationLevel);
    const levelForLineItems = apiToPrisma(apiLv);
    const itineraryItems = collectItineraryPricingInputs(it);
    if (itineraryItems.length > 0) {
        await prisma.itineraryPricingItem.createMany({
            data: itineraryItems.map((pi) => ({
                itineraryId: mergeIntoItineraryId,
                accommodationLevel: levelForLineItems,
                occupancy: OCCUPANCY_DEFAULT,
                name: pi.name,
                amountUsd: pi.amountUsd,
                kind: pi.kind,
            })),
        });
    }
    const days = Array.isArray(it.days) ? it.days : [];
    const existingDays = await prisma.day.findMany({
        where: { itineraryId: mergeIntoItineraryId },
        orderBy: { dayNumber: 'asc' },
    });
    const byNumber = new Map(existingDays.map((d) => [d.dayNumber, d]));
    for (const raw of days) {
        const d = raw;
        const dayNum = typeof d.dayNumber === 'number' ? d.dayNumber : 1;
        let dayRow = byNumber.get(dayNum);
        if (!dayRow) {
            const dt = new Date(itineraryRecord.startDate);
            dt.setDate(dt.getDate() + (dayNum - 1));
            const resolved = await resolveDestinationInput({
                destinationId: d.destinationId ?? null,
                destination: d.destination ?? null,
            });
            const apiLvDay = parseApiLevel(d.accommodationLevel ?? apiLv);
            const createdDay = await prisma.day.create({
                data: {
                    itineraryId: mergeIntoItineraryId,
                    dayNumber: dayNum,
                    title: String(d.title ?? `Day ${dayNum}`),
                    description: String(d.description ?? 'TBD'),
                    destination: resolved.destination ?? d.destination ?? 'TBD',
                    destinationId: resolved.destinationId ?? undefined,
                    accommodationLevel: apiToPrisma(apiLvDay),
                    transferStatus: parseTransfer(d.transferStatus),
                    transferCount: typeof d.transferCount === 'number' ? Math.max(0, d.transferCount) : 0,
                    hotelName: d.hotelName ?? null,
                    date: dt,
                    dayOfWeek: dt.toLocaleDateString('en-US', { weekday: 'long' }),
                },
            });
            await prisma.dayPricing.createMany({ data: zeroDayPricingRows(createdDay.id), skipDuplicates: true });
            if (!itineraryRecord.blankPricing) {
                await ensureDefaultDayPricingItems(createdDay.id);
            }
            dayRow = createdDay;
            byNumber.set(dayNum, createdDay);
        }
        const dayLineItems = collectDayPricingInputs(d);
        if (dayLineItems.length > 0) {
            await prisma.dayPricingItem.createMany({
                data: toDayLineItemRows(dayRow.id, levelForLineItems, dayLineItems),
            });
        }
    }
    await prisma.itinerary.update({
        where: { id: mergeIntoItineraryId },
        data: { updatedByName: 'Import' },
    });
    await recomputePricing(mergeIntoItineraryId);
    return { id: mergeIntoItineraryId };
}
export async function importSingleItineraryRecord(args) {
    const { publicUserId, it } = args;
    const resolution = (args.resolution ?? it.resolution ?? null) || null;
    const mergeIntoItineraryId = args.mergeIntoItineraryId ?? it.mergeIntoItineraryId ?? null;
    const title = String(it.title ?? '').trim();
    if (!title)
        throw new Error('Each itinerary must have a title');
    const existing = await prisma.itinerary.findFirst({
        where: {
            userId: publicUserId,
            title: { equals: title, mode: 'insensitive' },
        },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true },
    });
    if (existing && !resolution) {
        throw new TitleConflictError(title, { id: existing.id, title: existing.title });
    }
    if (existing && resolution === 'merge_into_existing') {
        if (!mergeIntoItineraryId || mergeIntoItineraryId !== existing.id) {
            throw new Error('mergeIntoItineraryId must match the existing itinerary with this title');
        }
        const { id } = await mergePricingIntoExistingItinerary({
            mergeIntoItineraryId: existing.id,
            it,
        });
        return { id, createdNewItinerary: false };
    }
    if (existing && resolution === 'create_new') {
        const { id } = await createFullItineraryFromImport({ publicUserId, it });
        return { id, createdNewItinerary: true };
    }
    if (!existing) {
        const { id } = await createFullItineraryFromImport({ publicUserId, it });
        return { id, createdNewItinerary: true };
    }
    throw new Error('Invalid import resolution');
}
