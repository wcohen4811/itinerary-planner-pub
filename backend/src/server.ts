import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { healthRouter } from './routes/health.js';
import { pingRouter } from './routes/ping.js';
import { daysRouter } from './routes/days.js';
import { aiRouter } from './routes/ai.js';
import { itinerariesRouter } from './routes/itineraries.js';
import { itineraryDaysRouter } from './routes/itineraryDays.js';
import { providersRouter } from './routes/providers.js';
import { destinationsRouter } from './routes/destinations.js';
import { adminRouter } from './routes/admin.js';
import { dayPricingRouter } from './routes/dayPricing.js';
import { pricingLineItemsRouter } from './routes/pricingLineItems.js';
import { pricingTemplatesRouter } from './routes/pricingTemplates.js';
import { proposalsRouter } from './routes/proposals.js';
import { clientsRouter } from './routes/clients.js';
import { proposalsEmailRouter } from './routes/proposalsEmail.js';
import { requireAuth, attachUser, requireAdmin } from './middleware/auth.js';

export function createServer() {
  const app = express();
  const isProd = process.env.NODE_ENV === 'production';

  // Security headers
  app.use(helmet());

  // CORS: lock to explicit origins in production; allow all only in local dev.
  const corsOrigins = (process.env.CORS_ORIGIN ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : isProd ? false : true,
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));

  // Rate limiting
  const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 600, standardHeaders: true, legacyHeaders: false });
  const aiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });
  const emailLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });
  app.use(globalLimiter);

  // Public, unauthenticated endpoints (uptime checks + root info)
  app.use('/health', healthRouter);
  app.use('/ping', pingRouter);
  app.get('/', (req: Request, res: Response) => {
    res.json({
      name: 'itineraryplanner-backend',
      status: 'ok',
      endpoints: [
        '/health',
        '/ping',
        '/days',
        '/ai/itinerary',
        '/ai/complete',
        '/itineraries',
        '/providers',
        '/destinations',
        '/admin/import-itineraries',
        '/pricing/templates',
        '/proposals/drafts',
        '/proposals/send-email',
        '/clients',
      ],
    });
  });

  // Everything below requires a valid Auth0 access token.
  app.use(requireAuth, attachUser);

  app.use('/days', daysRouter);
  app.use('/ai', aiLimiter, aiRouter);
  app.use('/itineraries', itinerariesRouter);
  app.use('/itineraries', itineraryDaysRouter);
  app.use('/providers', providersRouter);
  app.use('/destinations', destinationsRouter);
  app.use('/admin', requireAdmin, adminRouter);
  app.use('/itineraries', dayPricingRouter);
  app.use('/itineraries', pricingLineItemsRouter);
  app.use('/pricing', pricingTemplatesRouter);
  app.use('/proposals/send-email', emailLimiter);
  app.use('/proposals', proposalsRouter);
  app.use('/proposals', proposalsEmailRouter);
  app.use('/clients', clientsRouter);

  // Error handler. Surfaces auth (401/403) and validation (4xx) statuses; hides
  // internal error details in production.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    const status = (err as { status?: number; statusCode?: number })?.status
      ?? (err as { statusCode?: number })?.statusCode
      ?? 500;
    const message = status >= 500 && isProd ? 'Internal Server Error' : (err?.message ?? 'Internal Server Error');
    res.status(status).json({ error: message });
  });

  return app;
}
