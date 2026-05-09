import { Router } from 'express';
import { z } from 'zod';
import { DayCreateSchema } from '../types/day.js';
import { generateItinerary } from '../services/ai.js';
import { dayStore } from '../store/inMemoryStore.js';
import { prisma } from '../db/prisma.js';
import type { Prisma } from '@prisma/client';
import { apiToPrisma } from '../utils/accommodation.js';
import { recomputePricing } from '../services/pricing.js';
import { resolveDestinationInput } from '../utils/destination.js';
import { ensureDefaultDayPricingItems } from '../services/pricingLineItems.js';

export const aiRouter = Router();

const ItineraryRequest = z.object({
  numDays: z.number().int().min(1).max(30),
  destination: z.string().min(1),
  title: z.string().min(1).max(120).optional(),
  style: z.enum(['relaxed', 'balanced', 'active']).optional(),
  preferences: z.array(z.string().min(1)).max(10).optional(),
  accommodationLevel: DayCreateSchema.shape.accommodationLevel.optional(),
});

aiRouter.post('/itinerary', async (req, res) => {
  const parse = ItineraryRequest.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Invalid request', details: parse.error.flatten() });
  }
  try {
    const result = await generateItinerary(parse.data);
    // Persist itinerary + days in DB using a public user for now
    const publicUser = await prisma.user.upsert({
      where: { providerId: 'public' },
      update: {},
      create: { provider: 'public', providerId: 'public', email: null },
      select: { id: true },
    });

    const itinerary = await prisma.itinerary.create({
      data: {
        userId: publicUser.id,
        title: parse.data.title ?? `${parse.data.destination} Trip`,
        startDate: new Date(),
        accommodationLevel: apiToPrisma(parse.data.accommodationLevel ?? '4'),
      },
    });
    const dayRows: Prisma.DayCreateManyInput[] = [];
    for (let i = 0; i < result.length; i += 1) {
      const d = result[i];
      const destinationInput = (d as any).destination ?? parse.data.destination;
      const resolved = await resolveDestinationInput({
        destinationId: (d as any).destinationId ?? null,
        destination: destinationInput ?? null,
      });
      dayRows.push({
        itineraryId: itinerary.id,
        dayNumber: d.dayNumber ?? i + 1,
        title: d.title,
        description: d.description,
        accommodationLevel: apiToPrisma(d.accommodationLevel),
        destination: resolved.destination ?? destinationInput ?? 'TBD',
        destinationId: resolved.destinationId ?? undefined,
        transferStatus: d.transferStatus,
        components: (d.components as Prisma.JsonValue) ?? undefined,
        activityName: d.activity?.name ?? null,
        activityPriceUsd: typeof d.activity?.priceUsd === 'number' ? Math.max(0, d.activity.priceUsd) : 0,
      });
    }
    await prisma.day.createMany({ data: dayRows });
    const createdDays = await prisma.day.findMany({
      where: { itineraryId: itinerary.id },
      select: { id: true },
    });
    for (const d of createdDays) {
      await ensureDefaultDayPricingItems(d.id);
    }
    await recomputePricing(itinerary.id);
    const days = await prisma.day.findMany({
      where: { itineraryId: itinerary.id },
      orderBy: { dayNumber: 'asc' },
    });
    return res.status(201).json({ itineraryId: itinerary.id, days });

    // Fallback: in-memory (legacy)
    const created = dayStore.createMany(result.map((d, i) => ({ ...d, dayNumber: d.dayNumber ?? i + 1 })));
    return res.status(201).json({ days: created });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to generate itinerary';
    res.status(500).json({ error: message });
  }
});


