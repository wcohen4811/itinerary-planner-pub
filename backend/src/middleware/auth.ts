import { auth as jwtAuth } from 'express-oauth2-jwt-bearer';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { prisma } from '../db/prisma.js';

const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;
const AUTH0_ISSUER_BASE_URL = process.env.AUTH0_ISSUER_BASE_URL;
const NAMESPACE = process.env.AUTH0_NAMESPACE || 'https://itineraryplanner';
const ROLES_CLAIM = process.env.AUTH0_ROLES_CLAIM || `${NAMESPACE}/roles`;
const EMAIL_CLAIM = `${NAMESPACE}/email`;
const EMAIL_VERIFIED_CLAIM = `${NAMESPACE}/email_verified`;
const ALLOWED_EMAIL_DOMAIN = (process.env.ALLOWED_EMAIL_DOMAIN || 'savacations.com').toLowerCase();

/**
 * Auth is "configured" (and therefore enforced) when an Auth0 API audience and
 * issuer are present. In production these MUST be set. When they are absent
 * (local dev / tests) we fall back to a permissive dev identity so the app is
 * still runnable locally without an Auth0 tenant.
 */
export const authConfigured = Boolean(AUTH0_AUDIENCE && AUTH0_ISSUER_BASE_URL);

export type AppUser = { id: string; email: string | null; name: string; roles: string[] };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      appUser?: AppUser;
    }
  }
}

const devBypass: RequestHandler = (req, _res, next) => {
  (req as unknown as { auth: { payload: Record<string, unknown> } }).auth = {
    payload: {
      sub: 'dev|local',
      email: 'dev@local.test',
      name: 'Local Dev',
      [ROLES_CLAIM]: ['admin', 'user'],
    },
  };
  next();
};

/**
 * Validates the incoming Auth0 access token (JWT) against the tenant JWKS.
 * Sets req.auth.payload on success. In local/test mode (no Auth0 env) this is
 * a no-op dev identity instead.
 */
export const requireAuth: RequestHandler = authConfigured
  ? jwtAuth({ audience: AUTH0_AUDIENCE!, issuerBaseURL: AUTH0_ISSUER_BASE_URL! })
  : devBypass;

function rolesFromPayload(payload: Record<string, unknown> | undefined): string[] {
  const raw = payload?.[ROLES_CLAIM];
  if (Array.isArray(raw)) return raw.map((r) => String(r));
  if (typeof raw === 'string') return [raw];
  return [];
}

/**
 * Runs after requireAuth. Upserts the authenticated user from the JWT and
 * attaches req.appUser (id, email, display name, roles) for downstream routes.
 */
export async function attachUser(req: Request, res: Response, next: NextFunction) {
  try {
    const payload = (req as unknown as { auth?: { payload?: Record<string, unknown> } }).auth?.payload;
    const sub = typeof payload?.sub === 'string' ? payload.sub : '';
    if (!sub) return res.status(401).json({ error: 'Unauthorized' });

    const provider = sub.includes('|') ? sub.split('|')[0] : 'auth0';
    const claimEmail = typeof payload?.[EMAIL_CLAIM] === 'string' ? (payload[EMAIL_CLAIM] as string) : null;
    const email = claimEmail ?? (typeof payload?.email === 'string' ? payload.email : null);
    const emailVerified =
      (payload?.[EMAIL_VERIFIED_CLAIM] as boolean | undefined) ?? (payload?.email_verified as boolean | undefined);

    // Defense-in-depth (authoritative check is the Auth0 Action). Only enforced
    // against a real Auth0 session, and only when the claim is present so a
    // misconfigured Action can't lock everyone out.
    if (authConfigured) {
      if (ALLOWED_EMAIL_DOMAIN && typeof email === 'string' && !email.toLowerCase().endsWith('@' + ALLOWED_EMAIL_DOMAIN)) {
        return res.status(403).json({ error: `Access restricted to @${ALLOWED_EMAIL_DOMAIN} accounts` });
      }
      if (emailVerified === false) {
        return res.status(403).json({ error: 'Email not verified' });
      }
    }
    const name =
      (typeof payload?.name === 'string' && payload.name) ||
      (typeof payload?.nickname === 'string' && payload.nickname) ||
      email ||
      'User';

    const user = await prisma.user.upsert({
      where: { providerId: sub },
      create: { provider, providerId: sub, email: email ?? undefined },
      update: { email: email ?? undefined },
      select: { id: true, email: true },
    });

    req.appUser = { id: user.id, email: user.email, name: String(name), roles: rolesFromPayload(payload) };
    next();
  } catch (err) {
    next(err);
  }
}

/** Rejects requests from users without the `admin` role. */
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const roles = req.appUser?.roles ?? [];
  if (!roles.includes('admin')) {
    return res.status(403).json({ error: 'Forbidden: admin access required' });
  }
  next();
}
