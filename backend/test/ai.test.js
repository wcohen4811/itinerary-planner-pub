import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { dayStore } from '../src/store/inMemoryStore.js';
const app = createServer();
describe('AI itinerary generation', () => {
    beforeEach(() => {
        dayStore.clear();
    });
    it('POST /ai/itinerary generates days (fallback works without API key)', async () => {
        const res = await request(app)
            .post('/ai/itinerary')
            .send({ numDays: 3, country: 'Japan', style: 'balanced', accommodationLevel: 'standard' });
        expect(res.status).toBe(201);
        expect(Array.isArray(res.body.days)).toBe(true);
        expect(res.body.days.length).toBe(3);
        expect(res.body.days[0].country).toBe('Japan');
    });
});
