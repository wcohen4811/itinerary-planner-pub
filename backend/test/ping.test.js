import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createServer } from '../src/server.js';
const app = createServer();
describe('ping', () => {
    it('GET /ping returns pong', async () => {
        const res = await request(app).get('/ping');
        expect(res.status).toBe(200);
        expect(res.body.message).toBe('pong');
        expect(typeof res.body.now).toBe('string');
    });
});
