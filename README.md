# Itinerary Planner

A production-focused itinerary planning platform with a React frontend and a TypeScript/Express API backed by Postgres + Prisma.

The project is designed around domain objects (Itinerary, Day, Pricing Items, Templates, Client, Proposal) and service-layer process optimization so planning workflows stay consistent, scalable, and auditable.

---

## Product Goals

- Build and manage multi-day travel itineraries with rich day-level metadata.
- Standardize pricing workflows with reusable templates and line items.
- Support high-speed import flows (JSON/Excel) while protecting existing work.
- Keep pricing logic deterministic and traceable through explicit service methods.
- Prepare the codebase for safe team collaboration and public GitHub publication.

---

## Architecture (Object-Oriented Domain Model)

### Core Domain Objects

- `Itinerary`: parent aggregate containing trip metadata, pricing mode, and `Day` records.
- `Day`: dated itinerary segment with destination, transfer, hotel/activity context, and pricing rows.
- `ItineraryPricingItem` / `DayPricingItem`: explicit line-item cost model for total composition.
- `PricingLineItemTemplate`: reusable pricing templates for consistency across itineraries.
- `Client`: traveler metadata linked to itineraries.
- `ProposalDraft`: serialized proposal payloads for outbound communication flows.

### Backend Layers

- `routes/`: HTTP boundary and request/response orchestration.
- `services/`: business logic and process composition (pricing recomputation, imports, templates).
- `utils/`: pure conversion/helpers (accommodation mappings, destination resolution, dates).
- `types/`: validation and DTO shapes.
- `prisma/`: schema + migrations + seed/backfill scripts.

### Frontend Layers

- `web/src/pages/`: UI entry points (Dashboard and related workflows).
- `web/src/services/`: domain orchestration for API-backed state transitions.
- `web/src/api/`: typed HTTP client and transport error handling.
- `web/src/utils/`: import parsing and helper transforms (including Excel parsing).

---

## Process Optimization Strategy

The current implementation optimizes for correctness first, then throughput:

- Batch DB writes where safe (`createMany` for pricing line items and per-day pricing bootstrap rows).
- Keep expensive recomputations scoped to affected itineraries.
- Use explicit import resolution on title conflicts:
  - `merge_into_existing`: append imported pricing data and add missing day numbers only.
  - `create_new`: build a new itinerary aggregate from imported payload.
- Avoid destructive writes by default when imported titles collide.

---

## Monorepo Structure

- `backend/`: Express + Prisma API.
- `web/`: React + Vite frontend (main app you actively develop).
- `frontend/`: legacy minimal test page (not the main UI).
- `itinerary-backend/`: older/auxiliary backend area (if retained for historical work).

---

## Local Development (Main App)

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Backend default URL: `http://localhost:3001`

### 2) Frontend

```bash
cd web
npm install
npm run dev
```

Open the Vite URL shown in terminal (typically `http://localhost:5173`).

---

## Environment Variables

Set these in `backend/.env` (never commit real secrets):

- `DATABASE_URL` (required)
- `OPENAI_API_KEY` (optional)
- `RESEND_API_KEY` (optional, email features)
- `RESEND_TEST_TO` (optional)
- `AUTH0_SECRET`, `AUTH0_BASE_URL`, `AUTH0_CLIENT_ID`, `AUTH0_ISSUER_BASE_URL` (optional auth mode)
- `PORT` (optional, default `3001`)

Quick start:

```bash
cp backend/.env.example backend/.env
```

---

## Import Behavior (JSON / Excel)

- Import accepts JSON and `.xlsx` in the frontend workflow.
- Matching title no longer auto-overwrites data.
- If an itinerary title already exists, user must choose:
  - **Merge into existing itinerary**, or
  - **Create a new itinerary object** from imported data.
- Net/per-person totals are preserved as line items for visibility.

---

## GitHub Publication Safety Checklist

Before pushing public:

1. Confirm secret files are ignored:
   - `.env`, `.env.*`, and nested variants are in `.gitignore`.
2. Ensure no secrets in committed history:
   - rotate any leaked key before publishing.
3. Exclude build artifacts/dependencies:
   - `dist/`, `coverage/`, `node_modules/` should not be tracked.
4. Verify `README.md` and setup instructions are current.
5. Run local quality checks:
   - backend typecheck/tests
   - frontend build
6. Add a sanitized `.env.example` if onboarding contributors.

---

## Suggested Next Improvements

- Add endpoint-level rate limiting and request logging middleware.
- Add import dry-run mode with summary diff before write.
- Add duplicate line-item suppression rules during merge imports.
- Add integration tests for conflict-resolution import flows.

