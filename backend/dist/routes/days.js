import { Router } from 'express';
import { z } from 'zod';
import { DayCreateSchema, DaySchema } from '../types/day.js';
import { dayStore } from '../store/inMemoryStore.js';
import { computeDayPricing } from '../services/pricing.js';
export const daysRouter = Router();
// List all days
daysRouter.get('/', (_req, res) => {
    res.json({ days: dayStore.list() });
});
// Get a single day by id
daysRouter.get('/:id', (req, res) => {
    const day = dayStore.get(req.params.id);
    if (!day)
        return res.status(404).json({ error: 'Day not found' });
    res.json({ day });
});
// Create a single day
daysRouter.post('/', (req, res) => {
    const parse = DayCreateSchema.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: 'Invalid day', details: parse.error.flatten() });
    }
    const base = parse.data;
    const pricing = computeDayPricing({
        itineraryAccommodation: base.accommodationLevel, // no itinerary context here, use day value
        dayAccommodation: base.accommodationLevel,
        transferCount: base.transferCount ?? 0,
        destination: base.destination ?? base.provider,
        activityPriceUsd: base.activity?.priceUsd ?? 0,
    });
    const created = dayStore.create({ ...base, pricing });
    res.status(201).json({ day: created });
});
// Create many days in one call
daysRouter.post('/batch', (req, res) => {
    const Payload = z.object({ days: z.array(DayCreateSchema).min(1) });
    const parse = Payload.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: 'Invalid payload', details: parse.error.flatten() });
    }
    const created = dayStore.createMany(parse.data.days.map((base) => ({
        ...base,
        pricing: computeDayPricing({
            itineraryAccommodation: base.accommodationLevel,
            dayAccommodation: base.accommodationLevel,
            transferCount: base.transferCount ?? 0,
            destination: base.destination ?? base.provider,
            activityPriceUsd: base.activity?.priceUsd ?? 0,
        }),
    })));
    res.status(201).json({ days: created });
});
// Update a day
daysRouter.put('/:id', (req, res) => {
    const existing = dayStore.get(req.params.id);
    if (!existing)
        return res.status(404).json({ error: 'Day not found' });
    const Partial = DaySchema.partial().omit({ id: true });
    const parse = Partial.safeParse(req.body);
    if (!parse.success) {
        return res.status(400).json({ error: 'Invalid update', details: parse.error.flatten() });
    }
    const merged = { ...existing, ...parse.data };
    const pricing = computeDayPricing({
        itineraryAccommodation: merged.accommodationLevel,
        dayAccommodation: merged.accommodationLevel,
        transferCount: merged.transferCount ?? 0,
        destination: merged.destination ?? merged.provider,
        activityPriceUsd: merged.activity?.priceUsd ?? 0,
    });
    const updated = dayStore.update(req.params.id, { ...parse.data, pricing });
    res.json({ day: updated });
});
// Delete a day
daysRouter.delete('/:id', (req, res) => {
    const ok = dayStore.delete(req.params.id);
    if (!ok)
        return res.status(404).json({ error: 'Day not found' });
    res.status(204).send();
});
