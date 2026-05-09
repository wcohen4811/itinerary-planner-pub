import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const destinations = await prisma.destination.findMany({
    select: { id: true, name: true },
  });
  const destinationByName = new Map(destinations.map((d) => [d.name.toLowerCase(), d.id]));

  const days = await prisma.day.findMany({
    where: { destinationId: null },
    select: { id: true, destination: true },
  });

  let updated = 0;
  for (const day of days) {
    const destId = destinationByName.get(day.destination.toLowerCase());
    if (!destId) continue;
    await prisma.day.update({
      where: { id: day.id },
      data: { destinationId: destId },
    });
    updated += 1;
  }

  console.log(`Backfill complete. Updated ${updated} of ${days.length} days.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


