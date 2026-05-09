import { prisma } from '../db/prisma.js';
export async function resolveDestinationInput(params) {
    if (params.destinationId) {
        const byId = await prisma.destination.findUnique({
            where: { id: params.destinationId },
            select: { id: true, name: true },
        });
        if (byId)
            return { destinationId: byId.id, destination: byId.name, found: true };
    }
    if (params.destination) {
        const byName = await prisma.destination.findFirst({
            where: { name: { equals: params.destination, mode: 'insensitive' } },
            select: { id: true, name: true },
        });
        if (byName)
            return { destinationId: byName.id, destination: byName.name, found: true };
    }
    return { destinationId: null, destination: params.destination ?? null, found: false };
}
