import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // SAFETY: wiping existing data is destructive and must NEVER run against a
  // real/production database. It only happens when SEED_RESET=true is passed
  // explicitly, and is hard-blocked whenever NODE_ENV=production or the
  // connection points at a non-local host (e.g. a Railway proxy).
  const allowReset = process.env.SEED_RESET === 'true';
  if (allowReset) {
    const dbUrl = process.env.DATABASE_URL ?? '';
    const isLocalDb = /@(localhost|127\.0\.0\.1|db)[:/]/.test(dbUrl);
    if (process.env.NODE_ENV === 'production' || !isLocalDb) {
      throw new Error(
        'Refusing to wipe data: SEED_RESET is only allowed against a local database ' +
          '(NODE_ENV must not be production and DATABASE_URL must be localhost/db).',
      );
    }
    // Wipe existing data (order matters due to FKs) — local reset only.
    await prisma.day.deleteMany({});
    await prisma.itinerary.deleteMany({});
    await prisma.destinationActivityPrice.deleteMany({});
    await prisma.destinationActivity.deleteMany({});
    await prisma.destinationTransferPrice.deleteMany({});
    await prisma.destinationAccommodationPrice.deleteMany({});
    await prisma.destination.deleteMany({});
    await prisma.provider.deleteMany({});
  }

  // Provider (organizer)
  const provider = await prisma.provider.upsert({
    where: { slug: 'andean-travel' },
    update: {},
    create: {
      name: 'AndeanTravel',
      slug: 'andean-travel',
      surchargeUsd: 0,
    },
  });

  // Destinations
  const destinations = await Promise.all(
    [
      { name: 'Lima', slug: 'lima' },
      { name: 'Cusco', slug: 'cusco' },
      { name: 'Sacred Valley', slug: 'sacred-valley' },
      { name: 'Machu Picchu', slug: 'machu-picchu' },
    ].map((d) =>
      prisma.destination.upsert({
        where: { slug: d.slug },
        update: { providerId: provider.id, name: d.name },
        create: { providerId: provider.id, name: d.name, slug: d.slug },
      }),
    ),
  );

  const validFrom = new Date('1970-01-01');
  const validTo = new Date('9999-12-31');

  // Helper to seed accommodation prices
  const levels: Array<'three' | 'four' | 'five' | 'deluxe'> = ['three', 'four', 'five', 'deluxe'];
  for (const dest of destinations) {
    for (const level of levels) {
      const base =
        level === 'three' ? 90 : level === 'four' ? 140 : level === 'five' ? 200 : 280; // USD
      await prisma.destinationAccommodationPrice.create({
        data: {
          destinationId: dest.id,
          accommodationLevel: level,
          basePriceUsd: base,
          validFrom,
          validTo,
        },
      });
    }
  }

  // Transfer add-ons: public for level 'three', private for all
  const transferTypes: Array<'in' | 'out' | 'none'> = ['in', 'out', 'none'];
  for (const dest of destinations) {
    for (const level of levels) {
      for (const tt of transferTypes) {
        const add =
          tt === 'none' ? 0 : tt === 'in' ? 30 : 20; // example add-ons in USD
        // private row
        await prisma.destinationTransferPrice.create({
          data: {
            destinationId: dest.id,
            accommodationLevel: level,
            transferType: tt,
            visibility: 'private',
            addUsd: add,
            validFrom,
            validTo,
          },
        });
        // public only for level three
        if (level === 'three') {
          await prisma.destinationTransferPrice.create({
            data: {
              destinationId: dest.id,
              accommodationLevel: level,
              transferType: tt,
              visibility: 'public',
              addUsd: Math.max(0, add - 5),
              validFrom,
              validTo,
            },
          });
        }
      }
    }
  }

  // Activities per destination with level-based pricing
  const activityMap: Record<string, string[]> = {
    'lima': ['Lima City Tour'],
    'cusco': ['Cusco City Tour'],
    'sacred-valley': ['Sacred Valley Tour'],
    'machu-picchu': ['Machu Picchu Guided Tour'],
  };

  for (const dest of destinations) {
    const acts = activityMap[dest.slug] ?? [];
    for (const name of acts) {
      const activity = await prisma.destinationActivity.create({
        data: {
          destinationId: dest.id,
          name,
        },
      });
      for (const level of levels) {
        const amt =
          level === 'three' ? 40 : level === 'four' ? 60 : level === 'five' ? 80 : 100;
        await prisma.destinationActivityPrice.create({
          data: {
            activityId: activity.id,
            accommodationLevel: level,
            amountUsd: amt,
            validFrom,
            validTo,
          },
        });
      }
    }
  }

  // Sample trips are inserted only when that title is missing, so a re-seed
  // never overwrites a planner's copy of the same name.
  const { ensureSampleItineraries } = await import('../src/services/sampleItineraries.js');
  const created = await ensureSampleItineraries();
  console.log(`Seed complete. Sample itineraries added: ${created}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


