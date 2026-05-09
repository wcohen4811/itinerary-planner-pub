import { Router } from 'express';
import { prisma } from '../db/prisma.js';
export const proposalsRouter = Router();
function toTitle(data, fallback) {
    const raw = typeof fallback === 'string' && fallback.trim() ? fallback : data?.title;
    const title = typeof raw === 'string' ? raw.trim() : '';
    return title || 'Untitled Proposal';
}
proposalsRouter.get('/drafts', async (_req, res) => {
    const drafts = await prisma.proposalDraft.findMany({
        orderBy: { updatedAt: 'desc' },
    });
    res.json({ drafts });
});
proposalsRouter.post('/drafts', async (req, res) => {
    const body = req.body ?? {};
    const data = body.data ?? body;
    if (!data)
        return res.status(400).json({ error: 'data required' });
    const title = toTitle(data, body.title);
    const draft = await prisma.proposalDraft.create({
        data: { title, data },
    });
    res.status(201).json({ draft });
});
proposalsRouter.put('/drafts/:id', async (req, res) => {
    const { id } = req.params;
    const body = req.body ?? {};
    const data = body.data ?? body;
    if (!data)
        return res.status(400).json({ error: 'data required' });
    const title = toTitle(data, body.title);
    const draft = await prisma.proposalDraft.update({
        where: { id },
        data: { title, data },
    });
    res.json({ draft });
});
