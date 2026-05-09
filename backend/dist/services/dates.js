import { prisma } from '../db/prisma.js';
export async function cascadeItineraryDates(itineraryId) {
    const it = await prisma.itinerary.findUnique({
        where: { id: itineraryId },
        include: { days: true },
    });
    if (!it)
        return;
    for (const d of it.days) {
        const dt = new Date(it.startDate);
        dt.setDate(dt.getDate() + (d.dayNumber - 1));
        await prisma.day.update({
            where: { id: d.id },
            data: {
                date: dt,
                dayOfWeek: dt.toLocaleDateString('en-US', { weekday: 'long' }),
            },
        });
    }
}
export function computeEndDate(startDate, daysCount) {
    const dt = new Date(startDate);
    if (daysCount > 0) {
        dt.setDate(dt.getDate() + (daysCount - 1));
    }
    return dt;
}
