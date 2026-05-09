import { Router } from 'express';
export const pingRouter = Router();
pingRouter.get('/', (_req, res) => {
    res.json({ message: 'pong', now: new Date().toISOString() });
});
