import { Router } from 'express';
import { prisma } from '../db/prisma.js';
export const destinationsRouter = Router();
destinationsRouter.get('/:id/prices/accommodation', async (req, res) => {
    const rows = await prisma.destinationAccommodationPrice.findMany({
        where: { destinationId: req.params.id },
        orderBy: [{ accommodationLevel: 'asc' }, { validFrom: 'asc' }],
    });
    res.json({ rows });
});
destinationsRouter.get('/:id/prices/transfer', async (req, res) => {
    const rows = await prisma.destinationTransferPrice.findMany({
        where: { destinationId: req.params.id },
        orderBy: [{ accommodationLevel: 'asc' }, { transferType: 'asc' }, { visibility: 'asc' }, { validFrom: 'asc' }],
    });
    res.json({ rows });
});
destinationsRouter.get('/:id/activities', async (req, res) => {
    const activities = await prisma.destinationActivity.findMany({
        where: { destinationId: req.params.id },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, description: true, active: true },
    });
    res.json({ activities });
});
destinationsRouter.get('/:id/activities/:activityId/prices', async (req, res) => {
    const prices = await prisma.destinationActivityPrice.findMany({
        where: { activityId: req.params.activityId },
        orderBy: [{ accommodationLevel: 'asc' }, { validFrom: 'asc' }],
    });
    res.json({ prices });
});
