Itinerary Planner Backend

Overview
This is a TypeScript/Express API that manages itinerary days and can generate itineraries with an AI helper (OpenAI if configured, with a local fallback when not).

Getting Started
1) Install dependencies:
   npm install

2) Copy environment file:
   cp .env.example .env

3) Start PostgreSQL locally (recommended: Postgres.app) and ensure a database named `itineraryplanner` exists.

4) Create/apply Prisma migration and generate client:
   npm run db:setup

5) Run in development:
   npm run dev

6) Run tests:
   npm test

Environment
- PORT: API port (default 3001)
- OPENAI_API_KEY: Optional. If set, the /ai/itinerary endpoint will attempt to use OpenAI for structured output; otherwise a deterministic fallback is used.
- DATABASE_URL: PostgreSQL connection string (local Prisma-first default in `.env.example`)
- CORS_ORIGIN: Comma-separated list of allowed origins for credentials (e.g., http://localhost:5173)
- AUTH0_SECRET: Long random string (for cookie/session encryption)
- AUTH0_BASE_URL: Backend base URL (e.g., http://localhost:3001)
- AUTH0_CLIENT_ID: Auth0 application Client ID
- AUTH0_ISSUER_BASE_URL: Auth0 tenant URL (e.g., https://YOUR_TENANT.auth0.com)

Key Endpoints
- GET /health → status, uptime, env, aiReady
- GET /ping → pong + timestamp
- GET /days → list all days
- GET /days/:id → fetch a specific day
- POST /days → create a day
- POST /days/batch → create multiple days
- PUT /days/:id → update a day
- DELETE /days/:id → delete a day
- POST /ai/itinerary → generate days with body: { numDays, country, title?, style?, preferences?, accommodationLevel? }
- GET /itineraries (auth) → list current user itineraries
- POST /itineraries (auth) → create itinerary
- GET /itineraries/:itineraryId/days (auth) → list days for itinerary
- POST /itineraries/:itineraryId/days (auth) → add a day to itinerary

Example cURL
Create a day:
  curl -X POST http://localhost:3001/days \
    -H "Content-Type: application/json" \
    -d '{ "dayNumber": 1, "title": "Arrival", "description": "Arrive and check in", "accommodationLevel": "standard", "country": "Italy", "transferStatus": "in" }'

Generate an itinerary (fallback works without API key):
  curl -X POST http://localhost:3001/ai/itinerary \
    -H "Content-Type: application/json" \
    -d '{ "numDays": 3, "country": "Japan", "style": "balanced" }'

Prisma
- Generate client: npm run prisma:generate
- Create dev migration: npm run prisma:migrate -- --name init
- One-step local setup (migrate + generate): npm run db:setup
- Push schema without migration files: npm run prisma:push
- Open Prisma Studio: npm run prisma:studio
- Reset DB in Prisma: npm run prisma:reset
- Optional Docker workflow: npm run db:up / npm run db:down

OAuth (Auth0)
- Set AUTH0_* variables above and CORS_ORIGIN to your frontend origin
- In dev, Vite proxy can simplify same-origin cookies. Example vite.config.ts:
  export default { server: { proxy: { '/itineraries': 'http://localhost:3001', '/auth': 'http://localhost:3001' } } }


