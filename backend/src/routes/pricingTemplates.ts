import { Router } from 'express';
import { prisma } from '../db/prisma.js';
import { apiToPrisma } from '../utils/accommodation.js';
import { ensurePricingTemplate } from '../services/pricingTemplates.js';
import { requireAdmin } from '../middleware/auth.js';

const occupancyValues = ['single', 'double', 'triple'] as const;
type ApiOccupancy = typeof occupancyValues[number];
function parseOccupancy(raw: any): ApiOccupancy {
  if (occupancyValues.includes(raw)) return raw;
  return 'double';
}

export const pricingTemplatesRouter = Router();

pricingTemplatesRouter.get('/templates', async (req, res) => {
  const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
  const level = typeof req.query.level === 'string' ? (req.query.level as '3' | '4' | '5' | 'deluxe') : null;
  const occupancy = parseOccupancy(req.query.occupancy);
  const lv = level ? apiToPrisma(level) : null;

  if (lv) {
    const templates = await prisma.pricingLineItemTemplate.findMany({
      where: kind ? { kind: kind as any } : undefined,
      orderBy: { name: 'asc' },
      include: {
        prices: {
          where: { accommodationLevel: lv, occupancy },
        },
      },
    });
    const result = templates.map((t) => ({
      id: t.id,
      name: t.name,
      sku: t.sku,
      kind: t.kind,
      defaultAmountUsd: t.defaultAmountUsd,
      amountUsd: t.prices?.[0]?.amountUsd ?? t.defaultAmountUsd,
    }));
    return res.json({ templates: result });
  }

  const templates = await prisma.pricingLineItemTemplate.findMany({
    where: kind ? { kind: kind as any } : undefined,
    orderBy: { name: 'asc' },
  });
  const result = templates.map((t) => ({
    id: t.id,
    name: t.name,
    sku: t.sku,
    kind: t.kind,
    defaultAmountUsd: t.defaultAmountUsd,
    amountUsd: t.defaultAmountUsd,
  }));
  res.json({ templates: result });
});

pricingTemplatesRouter.post('/templates', requireAdmin, async (req, res) => {
  const body = req.body ?? {};
  const name = (body.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'name required' });
  const amountUsd = typeof body.amountUsd === 'number' ? Math.max(0, Math.floor(body.amountUsd)) : 0;
  const kind = body.kind ?? 'custom';
  const level = body.accommodationLevel as '3' | '4' | '5' | 'deluxe';
  const occupancy = parseOccupancy(body.occupancy);
  const lv = level ? apiToPrisma(level) : null;
  const created = await ensurePricingTemplate({ name, kind, defaultAmountUsd: amountUsd });
  if (lv) {
    await prisma.pricingLineItemTemplatePrice.upsert({
      where: { templateId_accommodationLevel_occupancy: { templateId: created.id, accommodationLevel: lv, occupancy } },
      update: { amountUsd },
      create: { templateId: created.id, accommodationLevel: lv, occupancy, amountUsd },
    });
  }
  res.status(201).json({ template: created });
});

pricingTemplatesRouter.put('/templates/:id', requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const template = await prisma.pricingLineItemTemplate.findFirst({ where: { id } });
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const body = req.body ?? {};
  const data: any = {};
  if (body.name !== undefined) data.name = String(body.name).trim();
  if (body.kind !== undefined) data.kind = body.kind;
  if (body.defaultAmountUsd !== undefined) {
    data.defaultAmountUsd = Math.max(0, Math.floor(Number(body.defaultAmountUsd)));
  }
  if (data.name === '') return res.status(400).json({ error: 'name required' });
  try {
    const updated = await prisma.pricingLineItemTemplate.update({ where: { id }, data });
    res.json({ template: updated });
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Template name already exists' });
    throw e;
  }
});

pricingTemplatesRouter.delete('/templates/:id', requireAdmin, async (req, res) => {
  const { id } = req.params as { id: string };
  const template = await prisma.pricingLineItemTemplate.findFirst({ where: { id } });
  if (!template) return res.status(404).json({ error: 'Template not found' });
  await prisma.$transaction([
    prisma.itineraryPricingItem.updateMany({ where: { templateId: id }, data: { templateId: null } }),
    prisma.dayPricingItem.updateMany({ where: { templateId: id }, data: { templateId: null } }),
    prisma.pricingLineItemTemplatePrice.deleteMany({ where: { templateId: id } }),
    prisma.pricingLineItemTemplate.delete({ where: { id } }),
  ]);
  res.status(204).send();
});

