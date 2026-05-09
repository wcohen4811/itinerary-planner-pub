import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const providersRouter = Router();

providersRouter.get('/', async (_req, res) => {
  const providers = await prisma.provider.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, active: true, surchargeUsd: true },
  });
  res.json({ providers });
});

providersRouter.get('/:id/destinations', async (req, res) => {
  const provider = await prisma.provider.findUnique({
    where: { id: req.params.id },
    select: { id: true },
  });
  if (!provider) return res.status(404).json({ error: 'Provider not found' });
  const destinations = await prisma.destination.findMany({
    where: { providerId: provider.id },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, slug: true, active: true },
  });
  res.json({ destinations });
});


