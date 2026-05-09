import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEVELS = ['three', 'four', 'five', 'deluxe'] as const;
const OCCUPANCIES = ['single', 'double', 'triple'] as const;


async function ensureTemplatesFromItems() {
  const dayItems = await prisma.dayPricingItem.findMany();
  const itItems = await prisma.itineraryPricingItem.findMany();
  const allItems = [...dayItems.map((i) => ({ name: i.name, kind: i.kind })), ...itItems.map((i) => ({ name: i.name, kind: i.kind }))];

  for (const item of allItems) {
    await prisma.pricingLineItemTemplate.upsert({
      where: { name: item.name },
      update: { kind: item.kind },
      create: { name: item.name, kind: item.kind, defaultAmountUsd: 0 },
    });
  }
}

async function backfillLineItems() {
  const templates = await prisma.pricingLineItemTemplate.findMany();
  const templateByName = new Map(templates.map((t) => [t.name, t.id]));

  const itItems = await prisma.itineraryPricingItem.findMany();
  const itKeys = new Set(itItems.map((i) => `${i.itineraryId}:${i.name}:${i.kind}:${i.accommodationLevel}:${i.occupancy}`));
  const itToCreate: any[] = [];
  for (const item of itItems) {
    const templateId = templateByName.get(item.name) ?? null;
    if (!item.templateId && templateId) {
      await prisma.itineraryPricingItem.update({ where: { id: item.id }, data: { templateId } });
    }
    for (const lv of LEVELS) {
      for (const occ of OCCUPANCIES) {
        const key = `${item.itineraryId}:${item.name}:${item.kind}:${lv}:${occ}`;
        if (itKeys.has(key)) continue;
        itKeys.add(key);
        itToCreate.push({
          itineraryId: item.itineraryId,
          accommodationLevel: lv,
          occupancy: occ,
          name: item.name,
          amountUsd: item.amountUsd,
          kind: item.kind,
          templateId,
        });
      }
    }
  }
  if (itToCreate.length > 0) {
    await prisma.itineraryPricingItem.createMany({ data: itToCreate });
  }

  const dayItems = await prisma.dayPricingItem.findMany();
  const dayKeys = new Set(dayItems.map((i) => `${i.dayId}:${i.name}:${i.kind}:${i.accommodationLevel}:${i.occupancy}`));
  const dayToCreate: any[] = [];
  for (const item of dayItems) {
    const templateId = templateByName.get(item.name) ?? null;
    if (!item.templateId && templateId) {
      await prisma.dayPricingItem.update({ where: { id: item.id }, data: { templateId } });
    }
    for (const lv of LEVELS) {
      for (const occ of OCCUPANCIES) {
        const key = `${item.dayId}:${item.name}:${item.kind}:${lv}:${occ}`;
        if (dayKeys.has(key)) continue;
        dayKeys.add(key);
        dayToCreate.push({
          dayId: item.dayId,
          accommodationLevel: lv,
          occupancy: occ,
          name: item.name,
          amountUsd: item.amountUsd,
          kind: item.kind,
          templateId,
        });
      }
    }
  }
  if (dayToCreate.length > 0) {
    await prisma.dayPricingItem.createMany({ data: dayToCreate });
  }
}

async function backfillTemplatePrices() {
  const templates = await prisma.pricingLineItemTemplate.findMany();
  const templateByName = new Map(templates.map((t) => [t.name, t.id]));

  const items = await prisma.dayPricingItem.findMany();
  for (const item of items) {
    const templateId = templateByName.get(item.name);
    if (!templateId) continue;
    await prisma.pricingLineItemTemplatePrice.upsert({
      where: { templateId_accommodationLevel_occupancy: { templateId, accommodationLevel: item.accommodationLevel, occupancy: item.occupancy } },
      update: { amountUsd: item.amountUsd },
      create: { templateId, accommodationLevel: item.accommodationLevel, occupancy: item.occupancy, amountUsd: item.amountUsd },
    });
  }
}

async function main() {
  await ensureTemplatesFromItems();
  await backfillLineItems();
  await backfillTemplatePrices();
  console.log('Pricing backfill complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

