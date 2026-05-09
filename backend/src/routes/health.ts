import { Router } from 'express';
import { prisma } from '../db/prisma.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req, res) => {
  const startedAt = process.uptime();
  let dbReady = false;
  let providerCount: number | null = null;
  let destinationCount: number | null = null;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbReady = true;
    providerCount = await prisma.provider.count();
    destinationCount = await prisma.destination.count();
  } catch {
    dbReady = false;
  }
  res.json({
    status: 'ok',
    uptimeSeconds: Math.round(startedAt),
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version ?? null,
    env: process.env.NODE_ENV ?? 'development',
    aiReady: Boolean(process.env.OPENAI_API_KEY),
    dbReady,
    providerCount,
    destinationCount,
  });
});


