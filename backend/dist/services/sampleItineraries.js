import { prisma } from '../db/prisma.js';
import { ensureDefaultDayPricingItems } from './pricingLineItems.js';
const SAMPLE_AUTHOR = 'Sample';
const SAMPLES = [
    {
        title: 'Classic Machu Picchu',
        description: 'Eight days through Lima, Cusco, the Sacred Valley, and Machu Picchu. A full first trip to Peru.',
        startDate: '2027-06-01',
        accommodationLevel: 'four',
        days: [
            {
                dayNumber: 1,
                title: 'Lima — Arrival',
                description: 'Arrive in Lima. After immigration, meet your driver and transfer to the hotel in Miraflores. Evening at leisure.',
                destination: 'Lima',
                hotelName: 'Casa Andina Premium Miraflores',
                transferStatus: 'in',
            },
            {
                dayNumber: 2,
                title: 'Lima City Tour',
                description: 'Miraflores and the Parque del Amor, then the historic center: Plaza de Armas, the Cathedral, and Santo Domingo. Return to the hotel. (B)',
                destination: 'Lima',
                hotelName: 'Casa Andina Premium Miraflores',
                activityName: 'Lima City Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 3,
                title: 'Lima to Cusco — City Tour',
                description: 'Morning flight to Cusco. Rest for the altitude, then a city tour of the Cathedral, Qorikancha, Sacsayhuaman, Qenqo, Puca Pucara, and Tambomachay. Overnight in Cusco. (B)',
                destination: 'Cusco',
                hotelName: 'Palacio del Inka',
                activityName: 'Cusco City Tour',
                transferStatus: 'in',
            },
            {
                dayNumber: 4,
                title: 'Sacred Valley',
                description: 'Full day in the Sacred Valley: Awanakancha, the Pisac market, and the Ollantaytambo fortress. Lunch included. Overnight in Cusco. (B, L)',
                destination: 'Sacred Valley',
                hotelName: 'Palacio del Inka',
                activityName: 'Sacred Valley Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 5,
                title: 'Cusco to Machu Picchu',
                description: 'Early train to Aguas Calientes and a guided visit of Machu Picchu. Afternoon at leisure in town. Overnight below the citadel. (B, L)',
                destination: 'Machu Picchu',
                hotelName: 'Inkaterra Machu Picchu Pueblo',
                activityName: 'Machu Picchu Guided Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 6,
                title: 'Machu Picchu to Cusco',
                description: 'Morning free for a second entry or Huayna Picchu when permits allow. Afternoon train back to Cusco. (B)',
                destination: 'Cusco',
                hotelName: 'Palacio del Inka',
                transferStatus: 'none',
            },
            {
                dayNumber: 7,
                title: 'Cusco to Lima',
                description: 'Fly to Lima. Afternoon at the Larco Museum and a folkloric dinner show. Overnight in Miraflores. (B, D)',
                destination: 'Lima',
                hotelName: 'Casa Andina Premium Miraflores',
                activityName: 'Larco Museum',
                transferStatus: 'in',
            },
            {
                dayNumber: 8,
                title: 'Lima — Departure',
                description: 'Breakfast and a transfer to the airport for your international flight. (B)',
                destination: 'Lima',
                transferStatus: 'out',
            },
        ],
    },
    {
        title: 'Cusco & Machu Picchu Express',
        description: 'Five days for travelers who fly straight into Cusco: acclimatization, the Sacred Valley, and Machu Picchu.',
        startDate: '2027-07-06',
        accommodationLevel: 'four',
        days: [
            {
                dayNumber: 1,
                title: 'Arrive in Cusco',
                description: 'Arrive in Cusco and transfer to the hotel. Keep the afternoon light while you adjust to the altitude.',
                destination: 'Cusco',
                hotelName: 'JW Marriott El Convento Cusco',
                transferStatus: 'in',
            },
            {
                dayNumber: 2,
                title: 'Sacred Valley',
                description: 'Pisac ruins and market, then Ollantaytambo. The valley sits lower than Cusco, which makes this a good second day. Overnight in Cusco. (B, L)',
                destination: 'Sacred Valley',
                hotelName: 'JW Marriott El Convento Cusco',
                activityName: 'Sacred Valley Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 3,
                title: 'Machu Picchu',
                description: 'Train from Ollantaytambo to Aguas Calientes and a guided visit of the citadel. Overnight in Aguas Calientes. (B, L)',
                destination: 'Machu Picchu',
                hotelName: 'Sumaq Machu Picchu Hotel',
                activityName: 'Machu Picchu Guided Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 4,
                title: 'Return to Cusco',
                description: 'Morning train to Cusco. Afternoon free for San Blas, the San Pedro market, or a cooking class. (B)',
                destination: 'Cusco',
                hotelName: 'JW Marriott El Convento Cusco',
                transferStatus: 'none',
            },
            {
                dayNumber: 5,
                title: 'Cusco — Departure',
                description: 'Transfer to the Cusco airport for your onward flight. (B)',
                destination: 'Cusco',
                transferStatus: 'out',
            },
        ],
    },
    {
        title: 'Sacred Valley & Machu Picchu',
        description: 'Six days with a night in the Sacred Valley before Machu Picchu, for a slower pace than the classic circuit.',
        startDate: '2027-08-10',
        accommodationLevel: 'five',
        days: [
            {
                dayNumber: 1,
                title: 'Lima — Arrival',
                description: 'Arrive in Lima and transfer to Miraflores. Time to walk the malecón if the flight lands early.',
                destination: 'Lima',
                hotelName: 'Belmond Miraflores Park',
                transferStatus: 'in',
            },
            {
                dayNumber: 2,
                title: 'Lima to the Sacred Valley',
                description: 'Fly to Cusco and drive down into the Sacred Valley. Afternoon visit to the Pisac ruins. Overnight in Urubamba. (B)',
                destination: 'Sacred Valley',
                hotelName: 'Tambo del Inka',
                activityName: 'Pisac Ruins',
                transferStatus: 'in',
            },
            {
                dayNumber: 3,
                title: 'Ollantaytambo and Chinchero',
                description: 'Morning at the Chinchero weaving community, then the living Inca town of Ollantaytambo. Overnight in the valley. (B, L)',
                destination: 'Sacred Valley',
                hotelName: 'Tambo del Inka',
                activityName: 'Sacred Valley Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 4,
                title: 'Machu Picchu',
                description: 'Short train from Ollantaytambo and a guided visit of Machu Picchu, with time to walk the upper terraces. Overnight in Aguas Calientes. (B, L)',
                destination: 'Machu Picchu',
                hotelName: 'Inkaterra Machu Picchu Pueblo',
                activityName: 'Machu Picchu Guided Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 5,
                title: 'Cusco',
                description: 'Train and private transfer to Cusco. Afternoon city orientation: Qorikancha and the main square. (B)',
                destination: 'Cusco',
                hotelName: 'Belmond Monasterio',
                activityName: 'Cusco City Tour',
                transferStatus: 'in',
            },
            {
                dayNumber: 6,
                title: 'Cusco — Departure',
                description: 'Breakfast and transfer to the airport. Connect in Lima for international flights. (B)',
                destination: 'Cusco',
                transferStatus: 'out',
            },
        ],
    },
    {
        title: 'Lima City Break',
        description: 'Four days in Lima for travelers adding a city stay before or after the highlands.',
        startDate: '2027-09-03',
        accommodationLevel: 'three',
        days: [
            {
                dayNumber: 1,
                title: 'Lima — Arrival',
                description: 'Arrive in Lima and transfer to Miraflores. Evening walk along the cliffs above the Pacific.',
                destination: 'Lima',
                hotelName: 'Atemporal Miraflores',
                transferStatus: 'in',
            },
            {
                dayNumber: 2,
                title: 'Historic Lima',
                description: 'Plaza Mayor, the Cathedral, San Francisco catacombs, and a tasting lunch in the center. Return to Miraflores. (B, L)',
                destination: 'Lima',
                hotelName: 'Atemporal Miraflores',
                activityName: 'Lima City Tour',
                transferStatus: 'none',
            },
            {
                dayNumber: 3,
                title: 'Barranco and museums',
                description: 'Morning at the Larco Museum, then Barranco for the Bridge of Sighs and the street galleries. (B)',
                destination: 'Lima',
                hotelName: 'Atemporal Miraflores',
                activityName: 'Larco Museum',
                transferStatus: 'none',
            },
            {
                dayNumber: 4,
                title: 'Lima — Departure',
                description: 'Hotel checkout and transfer to the airport. (B)',
                destination: 'Lima',
                transferStatus: 'out',
            },
        ],
    },
];
function dayDate(startIso, dayNumber) {
    const dt = new Date(`${startIso}T00:00:00.000Z`);
    dt.setUTCDate(dt.getUTCDate() + (dayNumber - 1));
    return dt;
}
/**
 * Inserts any missing sample itineraries. Existing trips with the same title,
 * including ones a planner has edited, are left as they are. Shared with every
 * signed-in user because the itinerary list is not filtered by owner.
 */
export async function ensureSampleItineraries() {
    const owner = await prisma.user.upsert({
        where: { providerId: 'public' },
        update: {},
        create: { provider: 'public', providerId: 'public', email: null },
        select: { id: true },
    });
    const destinations = await prisma.destination.findMany({ select: { id: true, name: true } });
    const destinationIdByName = new Map(destinations.map((d) => [d.name.toLowerCase(), d.id]));
    let created = 0;
    for (const sample of SAMPLES) {
        const existing = await prisma.itinerary.findFirst({
            where: { title: sample.title },
            select: { id: true },
        });
        if (existing)
            continue;
        const itinerary = await prisma.itinerary.create({
            data: {
                userId: owner.id,
                title: sample.title,
                description: sample.description,
                startDate: new Date(`${sample.startDate}T00:00:00.000Z`),
                accommodationLevel: sample.accommodationLevel,
                createdByName: SAMPLE_AUTHOR,
                updatedByName: SAMPLE_AUTHOR,
                totalPriceUsd: 0,
            },
        });
        for (const day of sample.days) {
            const date = dayDate(sample.startDate, day.dayNumber);
            const createdDay = await prisma.day.create({
                data: {
                    itineraryId: itinerary.id,
                    dayNumber: day.dayNumber,
                    title: day.title,
                    description: day.description,
                    hotelName: day.hotelName ?? null,
                    activityName: day.activityName ?? null,
                    date,
                    dayOfWeek: date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' }),
                    accommodationLevel: sample.accommodationLevel,
                    destination: day.destination,
                    destinationId: destinationIdByName.get(day.destination.toLowerCase()),
                    transferStatus: day.transferStatus,
                    transferCount: day.transferStatus === 'none' ? 0 : 1,
                },
            });
            await prisma.dayPricing.createMany({
                data: ['three', 'four', 'five', 'deluxe'].map((level) => ({
                    dayId: createdDay.id,
                    accommodationLevel: level,
                })),
            });
            await ensureDefaultDayPricingItems(createdDay.id);
        }
        created += 1;
    }
    return created;
}
