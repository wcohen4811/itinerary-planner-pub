import * as React from 'react';
import { Router } from 'express';
import { Resend } from 'resend';
import { ProposalEmail, ProposalEmailData } from '../emails/ProposalEmail.js';

export const proposalsEmailRouter = Router();

function isEmail(val: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
}

function splitEmails(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
}

function asString(value: unknown, fallback = '') {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  return fallback;
}

function asNumber(value: unknown, fallback = 0) {
  const num = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function splitParagraphs(raw: string | undefined) {
  if (!raw) return [];
  return raw
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

proposalsEmailRouter.post('/send-email', async (req, res) => {
  const body = req.body ?? {};
  const testMode = !!body.testMode;
  const from = String(body.from ?? '').trim();
  const to = String(body.to ?? '').trim();
  const cc = splitEmails(body.cc);
  const subject = String(body.subject ?? '').trim();
  const rawData = body.data ?? {};

  if (!from && !testMode) {
    return res.status(400).json({ error: 'from required' });
  }
  if (!testMode && !from.toLowerCase().endsWith('@savacations.com')) {
    return res.status(400).json({ error: 'from must be a savacations.com address' });
  }
  const testToFallback = process.env.RESEND_TEST_TO || 'delivered@resend.dev';
  const resolvedTo = to || (testMode ? testToFallback : '');
  if (!isEmail(resolvedTo)) return res.status(400).json({ error: 'to must be a valid email' });
  if (!subject) return res.status(400).json({ error: 'subject required' });
  if (cc.some((c) => !isEmail(c))) return res.status(400).json({ error: 'cc contains invalid email' });

  if (!rawData || typeof rawData !== 'object') {
    return res.status(400).json({ error: 'data required' });
  }

  const emailData: ProposalEmailData = {
    logoUrl: asString((rawData as any).logoUrl, 'https://s3-eu-west-1.amazonaws.com/tpd/logos/56cdc0d60000ff000589570b/0x0.png'),
    companyName: asString((rawData as any).companyName, 'SA Vacations'),
    preparedBy: asString((rawData as any).preparedBy, 'Public'),
    heading: asString((rawData as any).heading, subject),
    messageParagraphs: Array.isArray((rawData as any).messageParagraphs)
      ? (rawData as any).messageParagraphs.map((p: any) => asString(p)).filter(Boolean)
      : splitParagraphs(asString((rawData as any).personalMessage, '')),
    airfareUsd: asNumber((rawData as any).airfareUsd, 0),
    travelersCount: asNumber((rawData as any).travelersCount, 1),
    daysCount: asNumber((rawData as any).daysCount, 0),
    nightsCount: asNumber((rawData as any).nightsCount, 0),
    accommodationLabel: asString((rawData as any).accommodationLabel, ''),
    inclusions: asStringArray((rawData as any).inclusions),
    exclusions: asStringArray((rawData as any).exclusions),
    flights: Array.isArray((rawData as any).flights)
      ? (rawData as any).flights.map((flight: any) => ({
          airlineCode: asString(flight?.airlineCode),
          flightNumber: asString(flight?.flightNumber),
          from: asString(flight?.from),
          to: asString(flight?.to),
          depart: asString(flight?.depart),
          arrive: asString(flight?.arrive),
          dateLabel: asString(flight?.dateLabel),
        }))
      : [],
    days: Array.isArray((rawData as any).days)
      ? (rawData as any).days.map((day: any) => ({
          dayLabel: asString(day?.dayLabel),
          title: asString(day?.title),
          description: asString(day?.description),
          tags: Array.isArray(day?.tags) ? day.tags.map((tag: any) => asString(tag)) : [],
        }))
      : [],
    pricing: {
      baseWithMarginUsd: asNumber((rawData as any)?.pricing?.baseWithMarginUsd, 0),
      pricingFeesUsd: asNumber((rawData as any)?.pricing?.pricingFeesUsd, 0),
      airfareUsd: asNumber((rawData as any)?.pricing?.airfareUsd, 0),
      discountUsd: asNumber((rawData as any)?.pricing?.discountUsd, 0),
      totalAfterDiscountUsd: asNumber(
        (rawData as any)?.pricing?.totalAfterDiscountUsd,
        asNumber((rawData as any)?.pricing?.finalTotalUsd, 0),
      ),
      finalTotalUsd: asNumber((rawData as any)?.pricing?.finalTotalUsd, 0),
      selectedPricingLabel: asString((rawData as any)?.pricing?.selectedPricingLabel, 'Selected option'),
    },
  };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'RESEND_API_KEY not configured' });

  const resend = new Resend(apiKey);
  const result = await resend.emails.send({
    from: testMode ? (from || 'onboarding@resend.dev') : from,
    to: resolvedTo,
    cc: cc.length ? cc : undefined,
    subject,
    react: React.createElement(ProposalEmail, emailData),
  });

  res.json({ id: result.data?.id ?? null });
});

