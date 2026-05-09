import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { TitleConflictError, importSingleItineraryRecord } from '../services/importItineraries.js';
export const adminRouter = Router();
// Import endpoint. Accepts:
// - { itineraries: [ { title, days, ... resolution?, mergeIntoItineraryId? } ] }
// - OR a single itinerary object with the same shape.
// Optional body fields: resolution, mergeIntoItineraryId (also allowed on each itinerary object).
//
// If title matches an existing itinerary (case-insensitive) and resolution is omitted → 409 TITLE_EXISTS.
// resolution 'merge_into_existing' requires mergeIntoItineraryId === matched itinerary id (appends pricing line items; adds missing days; never deletes).
// resolution 'create_new' always creates another itinerary row with full import content.
adminRouter.post('/import-itineraries', async (req, res) => {
    const payload = req.body ?? {};
    const inputIts = Array.isArray(payload?.itineraries)
        ? payload.itineraries
        : payload?.title
            ? [payload]
            : [];
    if (inputIts.length === 0)
        return res.status(400).json({ error: 'No itineraries provided' });
    const publicUser = await prisma.user.upsert({
        where: { providerId: 'public' },
        update: {},
        create: { provider: 'public', providerId: 'public', email: null },
        select: { id: true },
    });
    const itineraryIds = [];
    const createdNewItinerary = [];
    try {
        for (const raw of inputIts) {
            const it = raw;
            const resolution = payload.resolution ?? it.resolution;
            const mergeIntoItineraryId = payload.mergeIntoItineraryId ?? it.mergeIntoItineraryId;
            const result = await importSingleItineraryRecord({
                publicUserId: publicUser.id,
                it,
                resolution: resolution,
                mergeIntoItineraryId: mergeIntoItineraryId ?? null,
            });
            itineraryIds.push(result.id);
            createdNewItinerary.push(result.createdNewItinerary);
        }
    }
    catch (err) {
        if (err instanceof TitleConflictError) {
            return res.status(409).json({
                code: err.code,
                importedTitle: err.importedTitle,
                existingItinerary: err.existingItinerary,
            });
        }
        const message = err instanceof Error ? err.message : 'Import failed';
        return res.status(400).json({ error: message });
    }
    res.json({
        itineraryIds,
        createdNewItinerary,
        createdItineraryIds: itineraryIds,
    });
});
