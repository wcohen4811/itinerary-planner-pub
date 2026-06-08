import { Router } from 'express';
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
  if (inputIts.length === 0) return res.status(400).json({ error: 'No itineraries provided' });

  const ownerUserId = req.appUser!.id;

  const itineraryIds: string[] = [];
  const createdNewItinerary: boolean[] = [];

  try {
    for (const raw of inputIts) {
      const it = raw as Record<string, unknown>;
      const resolution = (payload as { resolution?: string }).resolution ?? (it.resolution as string | undefined);
      const mergeIntoItineraryId =
        (payload as { mergeIntoItineraryId?: string }).mergeIntoItineraryId ?? (it.mergeIntoItineraryId as string | undefined);

      const result = await importSingleItineraryRecord({
        publicUserId: ownerUserId,
        it,
        resolution: resolution as 'merge_into_existing' | 'create_new' | null | undefined,
        mergeIntoItineraryId: mergeIntoItineraryId ?? null,
      });
      itineraryIds.push(result.id);
      createdNewItinerary.push(result.createdNewItinerary);
    }
  } catch (err) {
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
