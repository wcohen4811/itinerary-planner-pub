import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { apiToPrisma, prismaToApi } from '../utils/accommodation.js';

export const clientsRouter = Router();

function toClientResponse(c: any) {
  return {
    ...c,
    accommodationLevel: prismaToApi(c.accommodationLevel),
    travelStartDate: c.travelStartDate ? c.travelStartDate.toISOString() : null,
  };
}

clientsRouter.get('/', async (req, res) => {
  const sort = typeof req.query.sort === 'string' ? req.query.sort : 'name';
  const query = typeof req.query.query === 'string' ? req.query.query.trim() : (typeof req.query.q === 'string' ? req.query.q.trim() : '');
  const where = query
    ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' as const } },
          { lastName: { contains: query, mode: 'insensitive' as const } },
          { email: { contains: query, mode: 'insensitive' as const } },
          { itinerary: { title: { contains: query, mode: 'insensitive' as const } } },
        ],
      }
    : undefined;

  const orderBy =
    sort === 'createdAt'
      ? [{ createdAt: 'desc' as const }]
      : sort === 'itinerary'
        ? [{ itinerary: { title: 'asc' as const } }, { lastName: 'asc' as const }]
        : [{ lastName: 'asc' as const }, { firstName: 'asc' as const }];

  const clients = await prisma.client.findMany({
    where,
    orderBy,
    include: { itinerary: { select: { id: true, title: true } } },
  });
  res.json({ clients: clients.map(toClientResponse) });
});

clientsRouter.post('/', async (req, res) => {
  const body = req.body ?? {};
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = body.email ? String(body.email).trim() : null;
  const itineraryId = body.itineraryId ? String(body.itineraryId) : null;
  const passengers = Math.max(1, Math.floor(Number(body.passengers) || 1));
  const accommodationLevel = body.accommodationLevel ? apiToPrisma(body.accommodationLevel) : 'three';
  const notes = body.notes !== undefined ? String(body.notes) : null;
  const travelStartDate = body.travelStartDate ? new Date(body.travelStartDate) : null;
  const occupancy = body.occupancy ?? 'double';

  if (!firstName || !lastName) return res.status(400).json({ error: 'firstName and lastName required' });

  const client = await prisma.client.create({
    data: {
      firstName,
      lastName,
      email,
      itineraryId,
      passengers,
      accommodationLevel,
      occupancy,
      notes,
      travelStartDate,
    },
    include: { itinerary: { select: { id: true, title: true } } },
  });
  res.status(201).json({ client: toClientResponse(client) });
});

clientsRouter.put('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  const body = req.body ?? {};
  const data: any = {};
  if (body.firstName !== undefined) data.firstName = String(body.firstName).trim();
  if (body.lastName !== undefined) data.lastName = String(body.lastName).trim();
  if (body.email !== undefined) data.email = body.email ? String(body.email).trim() : null;
  if (body.itineraryId !== undefined) data.itineraryId = body.itineraryId || null;
  if (body.passengers !== undefined) data.passengers = Math.max(1, Math.floor(Number(body.passengers) || 1));
  if (body.accommodationLevel !== undefined) data.accommodationLevel = apiToPrisma(body.accommodationLevel);
  if (body.notes !== undefined) data.notes = body.notes ? String(body.notes) : null;
  if (body.travelStartDate !== undefined) data.travelStartDate = body.travelStartDate ? new Date(body.travelStartDate) : null;
  if (body.occupancy !== undefined) data.occupancy = body.occupancy;

  const updated = await prisma.client.update({
    where: { id },
    data,
    include: { itinerary: { select: { id: true, title: true } } },
  });
  res.json({ client: toClientResponse(updated) });
});

clientsRouter.delete('/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  await prisma.client.delete({ where: { id } });
  res.status(204).send();
});

