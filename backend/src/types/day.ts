import { z } from 'zod';

export const transferStatusValues = ['in', 'out', 'none'] as const;
export type TransferStatus = typeof transferStatusValues[number];

export const accommodationLevelValues = ['3', '4', '5', 'deluxe'] as const;
export type AccommodationLevel = typeof accommodationLevelValues[number];

export const DaySchema = z.object({
  id: z.string().min(1).describe('Unique identifier for the day'),
  itineraryId: z.string().min(1).optional().describe('FK to itinerary'),
  dayNumber: z.number().int().positive().describe('Order of the day in the itinerary'),
  title: z.string().min(1).max(120).describe('Short title for the day'),
  description: z.string().min(1).describe('Detailed description of the day plan'),
  date: z.string().datetime().optional().describe('Calendar date for this day (ISO)'),
  dayOfWeek: z.string().optional().describe('Day of the week label (e.g., Monday)'),
  accommodationLevel: z.enum(accommodationLevelValues).describe('Accommodation comfort level'),
  destination: z.string().min(1).describe('Destination for this day'),
  destinationId: z.string().min(1).optional().describe('FK to Destination'),
  transferStatus: z.enum(transferStatusValues).default('none').describe('Transfer into, out of, or none for this day'),
  transferCount: z.number().int().nonnegative().default(0).describe('Number of transfers for this day'),
  activity: z
    .object({
      name: z.string().min(1).describe('Name of the primary activity for the day'),
      priceUsd: z.number().int().nonnegative().default(0).describe('Activity price in USD'),
    })
    .optional(),
  // Room for future components (activities, meals, notes, coordinates, etc.)
  components: z
    .array(
      z.object({
        type: z.string().min(1),
        data: z.unknown(),
      }),
    )
    .optional()
    .describe('Extensible components for the day'),
  // Server-computed pricing breakdown for this day (read-only to clients)
  pricing: z
    .object({
      currency: z.string().default('USD'),
      accommodationPriceUsd: z.number().int().nonnegative(),
      transferPriceUsd: z.number().int().nonnegative(),
      destinationPriceUsd: z.number().int().nonnegative(),
      activityPriceUsd: z.number().int().nonnegative(),
      totalPriceUsd: z.number().int().nonnegative(),
    })
    .optional(),
});

export type Day = z.infer<typeof DaySchema>;

// Input schema for creation (without id)
export const DayCreateSchema = DaySchema.omit({ id: true });
export type DayCreate = z.infer<typeof DayCreateSchema>;

// JSON Schema for strict AI output (OpenAI structured output compatible)
export const DayJsonSchema = {
  name: 'ItineraryDays',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      days: {
        type: 'array',
        minItems: 1,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            dayNumber: { type: 'integer', minimum: 1 },
            title: { type: 'string' },
            description: { type: 'string' },
            accommodationLevel: { enum: [...accommodationLevelValues] },
            destination: { type: 'string' },
            destinationId: { type: 'string' },
            transferStatus: { enum: [...transferStatusValues] },
            transferCount: { type: 'integer', minimum: 0 },
            activity: {
              type: 'object',
              additionalProperties: true,
              properties: {
                name: { type: 'string' },
                priceUsd: { type: 'integer', minimum: 0 },
              },
              required: [],
            },
            components: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: true,
                properties: {
                  type: { type: 'string' },
                  data: {},
                },
                required: ['type', 'data'],
              },
            },
            pricing: {
              type: 'object',
              additionalProperties: true,
              properties: {
                currency: { type: 'string' },
                accommodationPriceUsd: { type: 'integer', minimum: 0 },
                transferPriceUsd: { type: 'integer', minimum: 0 },
                destinationPriceUsd: { type: 'integer', minimum: 0 },
                activityPriceUsd: { type: 'integer', minimum: 0 },
                totalPriceUsd: { type: 'integer', minimum: 0 },
              },
            },
          },
          required: ['id', 'dayNumber', 'title', 'description', 'accommodationLevel', 'destination'],
        },
      },
    },
    required: ['days'],
  },
} as const;


