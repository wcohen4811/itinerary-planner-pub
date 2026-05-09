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
      .send({ numDays: 3, destination: 'Japan', style: 'balanced', accommodationLevel: '4' });
    expect(res.status).toBe(201);
    expect(Array.isArray(res.body.days)).toBe(true);
    expect(res.body.days.length).toBe(3);
    expect(res.body.days[0].destination).toBe('Japan');
  });
});


