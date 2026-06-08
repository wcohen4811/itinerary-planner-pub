import OpenAI from 'openai';
import { DayJsonSchema, accommodationLevelValues, transferStatusValues } from '../types/day.js';
function haveOpenAI() {
    return Boolean(process.env.OPENAI_API_KEY);
}
export async function generateItinerary(params) {
    if (!haveOpenAI()) {
        return fallbackGenerate(params);
    }
    try {
        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const system = [
            'You are an expert travel planner.',
            'Generate a day-by-day itinerary strictly following the JSON schema provided.',
            'Ensure each day contains: dayNumber, title, description, accommodationLevel, destination, transferStatus, transferCount.',
            'Use the provided country and desired style; keep titles short and descriptions practical.',
            'Do not include IDs; the server will assign them.',
        ].join(' ');
        const user = [
            `Create an itinerary for ${params.numDays} days at destination ${params.destination}.`,
            params.title ? `Title: ${params.title}.` : '',
            params.style ? `Style: ${params.style}.` : '',
            params.accommodationLevel ? `Accommodation level: ${params.accommodationLevel}.` : '',
            params.preferences?.length ? `Preferences: ${params.preferences.join(', ')}.` : '',
            'Return only JSON matching the schema.',
        ].join(' ');
        // Using Responses API with JSON schema if available in SDK
        const response = await client.responses.create({
            model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
            input: [
                { role: 'system', content: system },
                { role: 'user', content: user },
            ],
            response_format: {
                type: 'json_schema',
                json_schema: DayJsonSchema,
            },
        });
        const text = response?.output_text ?? '';
        const parsed = JSON.parse(text);
        const days = parsed.days.map((d, i) => {
            const transferStatus = normalizeTransfer(d.transferStatus);
            const transferCount = typeof d.transferCount === 'number'
                ? Math.max(0, Math.floor(d.transferCount))
                : transferStatus === 'none'
                    ? 0
                    : 1;
            return {
                // server will assign id
                dayNumber: toInt(d.dayNumber) ?? i + 1,
                title: String(d.title ?? `Day ${i + 1}`),
                description: String(d.description ?? `Activities in ${params.destination}`),
                accommodationLevel: normalizeAccommodation(d.accommodationLevel, params.accommodationLevel),
                destination: String(d.destination ?? params.destination),
                transferStatus,
                transferCount,
                components: Array.isArray(d.components) ? d.components : undefined,
            };
        });
        return days;
    }
    catch {
        // Fall back if API fails or schema not supported by model
        return fallbackGenerate(params);
    }
}
/**
 * General-purpose authenticated text completion used by future AI features.
 * Keeps the OpenAI key fully server-side. Throws if no key is configured.
 */
export async function completeText(params) {
    if (!haveOpenAI()) {
        throw new Error('OPENAI_API_KEY not configured');
    }
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        input: [
            ...(params.system ? [{ role: 'system', content: params.system }] : []),
            { role: 'user', content: params.prompt },
        ],
        max_output_tokens: Math.min(2000, Math.max(1, params.maxTokens ?? 800)),
    });
    return String(response?.output_text ?? '').trim();
}
function fallbackGenerate(params) {
    const days = [];
    for (let i = 1; i <= params.numDays; i += 1) {
        const transferStatus = i === 1 ? 'in' : i === params.numDays ? 'out' : 'none';
        days.push({
            dayNumber: i,
            title: params.title ? `${params.title} — Day ${i}` : `Day ${i} in ${params.destination}`,
            description: makeDescription(params.destination, i, params.style, params.preferences),
            accommodationLevel: params.accommodationLevel ?? '4',
            destination: params.destination,
            transferStatus: transferStatus,
            transferCount: transferStatus === 'none' ? 0 : 1,
        });
    }
    return days;
}
function makeDescription(destination, i, style, preferences) {
    const styleText = style === 'relaxed'
        ? 'with a relaxed pace and ample downtime'
        : style === 'active'
            ? 'with an active schedule and longer excursions'
            : 'with a balanced mix of activities and free time';
    const prefs = preferences?.length ? ` Focus on ${preferences.join(', ')}.` : '';
    return `Enjoy ${destination} on day ${i}, ${styleText}. Morning activities, afternoon experiences, and evening dining.${prefs}`;
}
function toInt(value) {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}
function normalizeAccommodation(value, defaultLevel) {
    const v = String(value ?? '').toLowerCase();
    if (accommodationLevelValues.includes(v)) {
        return v;
    }
    return defaultLevel ?? '4';
}
function normalizeTransfer(value) {
    const v = String(value ?? '').toLowerCase();
    if (transferStatusValues.includes(v)) {
        return v;
    }
    return 'none';
}
