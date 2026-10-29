# Deployment & Auth0 Setup

This app deploys as two pieces:

- **Frontend** — Vite SPA in `web/`, hosted on **Netlify**.
- **Backend** — Express API in `backend/`, hosted on **Render**, with a managed **Postgres** database.

Authentication uses **Auth0** (Authorization Code + PKCE on the SPA; the API validates Auth0 JWT access tokens). Roles (`admin`, `user`) are assigned in Auth0 and carried in a namespaced claim.

> Local development note: if the Auth0 env vars are **not** set, both the frontend and backend fall back to a permissive **dev identity** with the `admin` role so the app stays runnable without an Auth0 tenant. In production you **must** set the Auth0 env vars so auth is enforced.

---

## 1. Auth0 tenant setup

In the [Auth0 Dashboard](https://manage.auth0.com):

### a. Single Page Application (frontend)
1. **Applications → Create Application** → type **Single Page Web App**.
2. Note the **Domain** and **Client ID**.
3. In the app **Settings**, set (replace with your Netlify domain):
   - **Allowed Callback URLs**: `https://YOUR-APP.netlify.app, http://localhost:5173`
   - **Allowed Logout URLs**: `https://YOUR-APP.netlify.app, http://localhost:5173`
   - **Allowed Web Origins**: `https://YOUR-APP.netlify.app, http://localhost:5173`

### b. API (sets the audience)
1. **Applications → APIs → Create API**.
2. **Identifier (audience)**: `https://api.itineraryplanner` (any stable URI; this becomes `AUTH0_AUDIENCE` / `VITE_AUTH0_AUDIENCE`).
3. Enable **RBAC** and **Add Permissions in the Access Token** for this API.

### c. Roles
1. **User Management → Roles → Create Role** named `admin`.
2. Assign it under **User Management → Users → (user) → Roles**. That role is the admin switch. See section e.

### d. Login Action — copy roles into the token
**Actions → Library → Build Custom** (Login flow trigger). Replace any Action that denies an email or domain with the script below, **Deploy** it, and keep it on the **Login** flow.

The app does not keep its own allowlist. This Action must not call `api.access.deny` based on the email address. Also delete a **Pre User Registration** Action if it denies signups by domain.

```js
exports.onExecutePostLogin = async (event, api) => {
  const ns = 'https://itineraryplanner';
  const roles = event.authorization?.roles || [];
  api.idToken.setCustomClaim(`${ns}/roles`, roles);
  api.accessToken.setCustomClaim(`${ns}/roles`, roles);
  api.idToken.setCustomClaim(`${ns}/email`, event.user.email);
  api.accessToken.setCustomClaim(`${ns}/email`, event.user.email);
  api.idToken.setCustomClaim(`${ns}/email_verified`, event.user.email_verified === true);
  api.accessToken.setCustomClaim(`${ns}/email_verified`, event.user.email_verified === true);
};
```

Notes:
- The namespace must match `AUTH0_NAMESPACE`/`AUTH0_ROLES_CLAIM` (backend) and `VITE_AUTH0_ROLES_CLAIM` (frontend); default base is `https://itineraryplanner`.
- **Email verification UX:** the app does not hard-deny unverified users at Auth0 — instead the SPA shows a "Verify your email" waiting screen (reading `email_verified` from the ID token) and the API rejects unverified tokens (403). If you'd prefer Auth0 to block unverified logins outright, add `if (!event.user.email_verified) return api.access.deny('Please verify your email first.');` to the Action (the waiting screen then won't be reachable).

### e. Who can sign in, and who is an admin
Auth0 user management is the control. Any account Auth0 accepts can use the planner, including clients, proposals, and itineraries. Email domain is not checked.

1. **Stop open signup** if you want to choose each person: **Authentication → Database → Username-Password-Authentication → Disable Sign Ups**. Do the same on any social connection you enable. Then people cannot create their own accounts.
2. **Add someone:** **User Management → Users → Create User**. Any email works. For Google, **Authentication → Social → Create Connection → Google**, enable it on the SPA, and the user is created on their first login. They must verify the email before the app lets them in.
3. **Make them an admin:** open the user → **Roles** → assign `admin`. They sign out and back in. That unlocks `/admin`, the providers page, itinerary delete, and pricing-template writes.
4. **Remove access:** open the user → **Block**, or delete the user. **Remove** the `admin` role to leave them in the app without admin tools. Blocking takes effect on the next login.

---

## 2. Backend on Railway

The backend deploys to Railway as one **service** (the Express API) plus a **PostgreSQL** database in the same project. Config lives in `backend/railway.json` (build/start/healthcheck + a `preDeployCommand` that runs migrations).

1. Push this repo to GitHub.
2. In Railway: **New Project → Deploy from GitHub repo** → select this repo.
3. Open the created service → **Settings**:
   - **Root Directory** = `/backend` (so Railway builds the API, not the repo root).
   - **Config-as-code file path** = `/backend/railway.json` (Railway's config file does **not** follow the root directory, so this absolute path is required).
4. Add the database: **+ New → Database → PostgreSQL** (in the same project).
5. On the API service → **Variables**, set:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}` (reference the Postgres service; rename `Postgres` if your DB service has a different name)
   - `NODE_ENV` = `production`
   - `AUTH0_ISSUER_BASE_URL` = `https://YOUR-TENANT.us.auth0.com/` (trailing slash)
   - `AUTH0_AUDIENCE` = `https://api.itineraryplanner`
   - `AUTH0_NAMESPACE` = `https://itineraryplanner`
   - `AUTH0_ROLES_CLAIM` = `https://itineraryplanner/roles`
   - `CORS_ORIGIN` = `https://YOUR-APP.netlify.app` (your Netlify origin; comma-separate to allow more)
   - `OPENAI_API_KEY`, `RESEND_API_KEY` (optional features)
6. Deploy. Build runs `npm run build`; the `preDeployCommand` runs `prisma migrate deploy` against the database before the new version goes live. Railway injects `PORT` automatically (the server reads `process.env.PORT`).
7. Under **Settings → Networking**, generate a public domain. Verify `https://<your-app>.up.railway.app/health`.

> The Prisma CLI is in `dependencies` (not `devDependencies`) so `prisma migrate deploy` works at deploy time even if dev deps are pruned.

> **Alternative — Render:** `render.yaml` is also included (Render Blueprint → provisions a `basic-256mb` Postgres + a web service, migrations run in the build command). Use either Railway *or* Render, not both.

---

## 3. Frontend on Netlify

1. In Netlify: **Add new site → Import from Git**, point at this repo. `netlify.toml` sets base `web`, build `npm run build`, publish `dist`, and the SPA redirect.
2. Set environment variables (Site settings → Environment variables):
   - `VITE_API_URL` = `https://<your-app>.up.railway.app` (your Railway API URL; or the Render URL if you used Render)
   - `VITE_AUTH0_DOMAIN` = `YOUR-TENANT.us.auth0.com`
   - `VITE_AUTH0_CLIENT_ID` = SPA client id
   - `VITE_AUTH0_AUDIENCE` = `https://api.itineraryplanner`
   - `VITE_AUTH0_ROLES_CLAIM` = `https://itineraryplanner/roles`
3. Deploy. After the Netlify URL is known, double-check the Auth0 Allowed Callback/Logout/Web Origins and the backend `CORS_ORIGIN` all reference it.

---

## 4. Security checklist (verify post-deploy)

- [ ] Visiting the app while logged out redirects to `/login` → Auth0.
- [ ] Every API route (except `/health`, `/ping`, `/`) rejects requests without a valid Bearer token (401).
- [ ] Admin-only routes (`/admin/*`, pricing template writes, itinerary delete) reject non-admins (403).
- [ ] Clients, proposals, and itineraries are available to every signed-in Auth0 user. Block the user in Auth0 to remove that access.
- [ ] Proposal send still requires a `@savacations.com` From address.
- [ ] `CORS_ORIGIN` is set to the Netlify domain; requests from other origins are blocked.
- [ ] No secret (`OPENAI_API_KEY`, `RESEND_API_KEY`, `DATABASE_URL`) appears in the browser bundle — only `VITE_*` public values.
- [ ] Rate limiting active (global, plus stricter on `/ai/*` and `/proposals/send-email`).
- [ ] HTTPS enforced by Render and Netlify.
