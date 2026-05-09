import { z } from 'zod';
import { accommodationLevelValues, DaySchema } from './day.js';
export const ItinerarySchema = z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    accommodationLevel: z.enum(accommodationLevelValues),
    providers: z.array(z.string().min(1)).default([]),
    // Server-computed itinerary pricing (sum of day totals)
    pricing: z
        .object({
        currency: z.string().default('USD'),
        totalPriceUsd: z.number().int().nonnegative(),
    })
        .optional(),
    days: z.array(DaySchema).default([]),
});
export const ItineraryCreateSchema = z.object({
    title: z.string().min(1),
    accommodationLevel: z.enum(accommodationLevelValues).default('3'),
});
