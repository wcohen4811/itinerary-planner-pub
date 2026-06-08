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
1. **User Management → Roles → Create Role** twice: `admin` and `user`.
2. Assign roles to your team members under **User Management → Users → (user) → Roles**.

### d. Login Action — restrict domain, require verification, inject claims
**Actions → Library → Build Custom** (Login flow trigger), paste the following, deploy, and add it to the **Login** flow:

```js
exports.onExecutePostLogin = async (event, api) => {
  const ns = 'https://itineraryplanner';
  const allowedDomain = 'savacations.com';
  const email = (event.user.email || '').toLowerCase();

  // 1) Only allow @savacations.com accounts.
  if (!email.endsWith('@' + allowedDomain)) {
    return api.access.deny(`Access is restricted to @${allowedDomain} accounts.`);
  }

  // 2) Surface email + verification + roles to BOTH tokens (namespaced claims),
  //    so the SPA and the API can read them.
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
- **Database signups:** to stop non-domain accounts from being *created* at all, also add a **Pre User Registration** Action: `exports.onExecutePreUserRegistration = async (event, api) => { if (!(event.user.email||'').toLowerCase().endsWith('@savacations.com')) api.access.deny('domain_not_allowed', 'Signups limited to @savacations.com'); };`

### e. (Optional) Allowlist instead of open domain signup
If you'd rather control exactly who can register (vs. anyone with a `@savacations.com` address):
- Turn **off** public signups: Connection settings → **Disable Sign Ups** on the Database connection, then create users manually under **User Management → Users → Create User** (or invite them). This is the simplest admin-controlled allowlist.
- Or keep the Pre-User-Registration Action above and check the email against a hardcoded list / an external list before allowing registration.

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
   - `ALLOWED_EMAIL_DOMAIN` = `savacations.com`
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
- [ ] `CORS_ORIGIN` is set to the Netlify domain; requests from other origins are blocked.
- [ ] No secret (`OPENAI_API_KEY`, `RESEND_API_KEY`, `DATABASE_URL`) appears in the browser bundle — only `VITE_*` public values.
- [ ] Rate limiting active (global, plus stricter on `/ai/*` and `/proposals/send-email`).
- [ ] HTTPS enforced by Render and Netlify.
