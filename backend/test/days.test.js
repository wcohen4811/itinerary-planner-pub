import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
import { dayStore } from '../src/store/inMemoryStore.js';
const app = createServer();
describe('days CRUD', () => {
    beforeEach(() => {
        dayStore.clear();
    });
    it('POST /days creates a day and GET /days lists it', async () => {
        const payload = {
            dayNumber: 1,
            title: 'Arrival',
            description: 'Arrive and check into hotel',
            accommodationLevel: 'standard',
            country: 'Italy',
            transferStatus: 'in',
        };
        const createRes = await request(app).post('/days').send(payload);
        expect(createRes.status).toBe(201);
        const id = createRes.body.day.id;
        expect(id).toBeTruthy();
        const listRes = await request(app).get('/days');
        expect(listRes.status).toBe(200);
        expect(Array.isArray(listRes.body.days)).toBe(true);
        expect(listRes.body.days.length).toBe(1);
        expect(listRes.body.days[0].id).toBe(id);
    });
});
