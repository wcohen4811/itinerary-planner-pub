import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export async function ensureUser(req: Request, res: Response, next: NextFunction) {
  const oidc: any = (req as any).oidc;
  const u = oidc?.user;
  if (!u?.sub) return res.status(401).json({ error: 'Unauthorized' });

  const provider = String((u.sub as string).split('|')[0] ?? 'unknown');
  const providerId = String(u.sub);
  const email = typeof u.email === 'string' ? u.email : null;

  await prisma.user.upsert({
    where: { providerId },
    create: { provider, providerId, email: email ?? undefined },
    update: { email: email ?? undefined },
    select: { id: true },
  });

  next();
}


