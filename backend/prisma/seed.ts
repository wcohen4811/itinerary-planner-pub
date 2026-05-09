import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Wipe existing data (order matters due to FKs)
  await prisma.day.deleteMany({});
  await prisma.itinerary.deleteMany({});
  await prisma.destinationActivityPrice.deleteMany({});
  await prisma.destinationActivity.deleteMany({});
  await prisma.destinationTransferPrice.deleteMany({});
  await prisma.destinationAccommodationPrice.deleteMany({});
  await prisma.destination.deleteMany({});
  await prisma.provider.deleteMany({});

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
  const destinationByName = new Map(destinations.map((d) => [d.name.toLowerCase(), d]));

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

  // Seed sample itinerary “Classic Machu Picchu”
  // Choose a startDate; can be adjusted later
  const startDate = new Date('2025-05-01');
  // Ensure a public user exists
  const publicUser = await prisma.user.upsert({
    where: { providerId: 'public' },
    update: {},
    create: { provider: 'public', providerId: 'public', email: null },
    select: { id: true },
  });
  const itinerary = await prisma.itinerary.create({
    data: {
      userId: publicUser.id,
      title: 'Classic Machu Picchu',
      startDate,
      createdByName: 'Public',
      updatedByName: 'Public',
      accommodationLevel: 'four',
    },
  });

  const dayData = [
    {
      dayNumber: 1,
      title: 'Lima - Arrival',
      description:
        'Depart to Lima. After immigration and customs, meet our rep with a sign. Transfer to hotel. Overnight in Lima.',
      destination: 'Lima',
      transferStatus: 'in',
    },
    {
      dayNumber: 2,
      title: 'Lima City Tour',
      description:
        'Miraflores (Parque del Amor), drive by Huaca Huallamarca, Plaza de Armas (City Hall, Government Palace, Cathedral), Convent of Santo Domingo. Return to hotel. (B)',
      destination: 'Lima',
      transferStatus: 'none',
    },
    {
      dayNumber: 3,
      title: 'Lima → Cusco - City Tour',
      description:
        'Morning flight to Cusco. Rest for altitude. Afternoon city tour: Cathedral, Koricancha, and the four ruins: Sacsayhuaman, Kenko, Puca Pucara, Tampumachay. Overnight in Cusco. (B)',
      destination: 'Cusco',
      transferStatus: 'none',
    },
    {
      dayNumber: 4,
      title: 'Sacred Valley - Awanakancha, Pisac Market, Ollantaytambo',
      description:
        'Full-day Sacred Valley: Awanakancha, Pisac artisan market (or Inca ruins when market closed), lunch included, Ollantaytambo ruins. Overnight in Cusco. (B,L)',
      destination: 'Sacred Valley',
      transferStatus: 'none',
    },
    {
      dayNumber: 5,
      title: 'Cusco → Machu Picchu',
      description:
        'Early train to Machu Picchu. Guided visit and lunch at Sanctuary Lodge. Transfer to hotel in Aguas Calientes. (B,L)',
      destination: 'Machu Picchu',
      transferStatus: 'none',
    },
    {
      dayNumber: 6,
      title: 'Machu Picchu → Cusco - Free Day',
      description:
        'Free day to explore Machu Picchu (optional Huayna Picchu with permit). Afternoon train to Poroy and transfer to hotel in Cusco. (B)',
      destination: 'Machu Picchu',
      transferStatus: 'none',
    },
    {
      dayNumber: 7,
      title: 'Cusco → Lima - Larco Museum & Folkloric Dinner',
      description:
        'Fly to Lima. Visit Larco Museum. Evening Folkloric Dinner Show at Dpaso Restaurant. Overnight in Lima. (B,D)',
      destination: 'Lima',
      transferStatus: 'none',
    },
    {
      dayNumber: 8,
      title: 'Lima - Departure',
      description: 'Check out at noon. Transfer to airport for your return flight. (B)',
      destination: 'Lima',
      transferStatus: 'out',
    },
  ] as const;

  for (const d of dayData) {
    const dt = new Date(new Date(startDate).setDate(startDate.getDate() + (d.dayNumber - 1)));
    const dest = destinationByName.get(d.destination.toLowerCase());
    await prisma.day.create({
      data: {
        itineraryId: itinerary.id,
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description,
        date: dt,
        dayOfWeek: dt.toLocaleDateString('en-US', { weekday: 'long' }),
        accommodationLevel: 'four',
        destination: d.destination,
        destinationId: dest?.id,
        transferStatus: d.transferStatus as any,
      },
    });
    const createdDay = await prisma.day.findFirst({
      where: { itineraryId: itinerary.id, dayNumber: d.dayNumber },
      select: { id: true },
    });
    if (createdDay) {
      const levels: Array<'three' | 'four' | 'five' | 'deluxe'> = ['three', 'four', 'five', 'deluxe'];
      const occupancies: Array<'single' | 'double' | 'triple'> = ['single', 'double', 'triple'];
      const items = [];
      for (const lv of levels) {
        for (const occ of occupancies) {
          items.push({ dayId: createdDay.id, name: 'Hotel', amountUsd: 0, kind: 'hotel', accommodationLevel: lv, occupancy: occ });
          items.push({ dayId: createdDay.id, name: 'Activity', amountUsd: 0, kind: 'activity', accommodationLevel: lv, occupancy: occ });
        }
      }
      await prisma.dayPricingItem.createMany({
        data: items,
        skipDuplicates: true,
      });
    }
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


