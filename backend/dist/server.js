import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import eoc from 'express-openid-connect';
const { auth } = eoc;
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
export function createServer() {
    const app = express();
    // CORS with credentials for frontend dev domain(s)
    const corsOrigins = (process.env.CORS_ORIGIN ?? '').split(',').filter(Boolean);
    app.use(cors({
        origin: corsOrigins.length > 0 ? corsOrigins : true,
        credentials: true,
    }));
    app.use(cookieParser());
    app.use(express.json({ limit: '1mb' }));
    // Optional Auth0 wiring (skips if env is not set)
    const haveAuth0 = !!process.env.AUTH0_SECRET &&
        !!process.env.AUTH0_BASE_URL &&
        !!process.env.AUTH0_CLIENT_ID &&
        !!process.env.AUTH0_ISSUER_BASE_URL;
    if (haveAuth0) {
        app.use(auth({
            authRequired: false,
            auth0Logout: true,
            secret: process.env.AUTH0_SECRET,
            baseURL: process.env.AUTH0_BASE_URL,
            clientID: process.env.AUTH0_CLIENT_ID,
            issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL,
        }));
    }
    app.use('/health', healthRouter);
    app.use('/ping', pingRouter);
    app.use('/days', daysRouter);
    app.use('/ai', aiRouter);
    app.use('/itineraries', itinerariesRouter);
    app.use('/itineraries', itineraryDaysRouter);
    app.use('/providers', providersRouter);
    app.use('/destinations', destinationsRouter);
    app.use('/admin', adminRouter);
    app.use('/itineraries', dayPricingRouter);
    app.use('/itineraries', pricingLineItemsRouter);
    app.use('/pricing', pricingTemplatesRouter);
    app.use('/proposals', proposalsRouter);
    app.use('/proposals', proposalsEmailRouter);
    app.use('/clients', clientsRouter);
    // Root info
    app.get('/', (req, res) => {
        res.json({
            name: 'itineraryplanner-backend',
            status: 'ok',
            endpoints: [
                '/health',
                '/ping',
                '/days',
                '/ai/itinerary',
                '/itineraries',
                '/itineraries/:itineraryId/days',
                '/itineraries/:itineraryId/days/clone',
                '/itineraries/library/days',
                '/providers',
                '/providers/:id/destinations',
                '/destinations/:id/*',
                '/admin/import-itineraries',
                '/itineraries/:itineraryId/pricing/levels/:level',
                '/itineraries/:itineraryId/pricing/levels/:level/days/:dayId',
                '/itineraries/:itineraryId/pricing/line-items',
                '/itineraries/:itineraryId/days/:dayId/pricing/items',
                '/pricing/templates',
                '/proposals/drafts',
                '/proposals/send-email',
                '/clients',
            ],
        });
    });
    // Error handler
    app.use((err, _req, res, _next) => {
        const message = err?.message ?? 'Internal Server Error';
        res.status(500).json({ error: message });
    });
    return app;
}
