import type { PricingLineItemKind } from '@prisma/client';
import { prisma } from '../db/prisma.js';

function normalizeSku(raw: string): string {
  const base = raw
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base || 'ITEM';
}

async function findUniqueSku(base: string): Promise<string> {
  let sku = base;
  let suffix = 1;
  // ensure uniqueness against existing templates
  while (await prisma.pricingLineItemTemplate.findUnique({ where: { sku } })) {
    suffix += 1;
    sku = `${base}-${suffix}`;
  }
  return sku;
}

export async function ensurePricingTemplate(params: {
  name: string;
  kind: PricingLineItemKind;
  defaultAmountUsd?: number;
}) {
  const existing = await prisma.pricingLineItemTemplate.findUnique({ where: { name: params.name } });
  if (existing) {
    if (existing.kind !== params.kind) {
      return prisma.pricingLineItemTemplate.update({
        where: { id: existing.id },
        data: { kind: params.kind },
      });
    }
    return existing;
  }
  const base = normalizeSku(params.name);
  const sku = await findUniqueSku(base);
  return prisma.pricingLineItemTemplate.create({
    data: {
      name: params.name,
      kind: params.kind,
      sku,
      defaultAmountUsd: params.defaultAmountUsd ?? 0,
    },
  });
}


