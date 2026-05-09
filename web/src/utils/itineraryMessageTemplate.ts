import type { ItineraryMessageTemplate } from '../api/client';

type CompileInputs = {
  template?: ItineraryMessageTemplate | null;
  clientName: string;
  itineraryName: string;
  airfareUsd?: number;
  startDate?: string | null;
  discountPercentage?: number;
  discountDeadline?: string | null;
  now?: Date;
};

type TokenVars = Record<string, string>;

function formatUsd(value?: number) {
  const safe = Number.isFinite(value) ? Math.round(Number(value)) : 0;
  return safe ? `$${safe.toLocaleString('en-US')}` : '';
}

function formatDate(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
}

function replaceTokens(text: string, vars: TokenVars) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => vars[key] ?? '');
}

function isDiscountActive(start?: string | null, end?: string | null, now = new Date()) {
  const startDate = start ? new Date(start) : null;
  const endDate = end ? new Date(end) : null;
  if (startDate && !Number.isNaN(startDate.getTime()) && now < startDate) return false;
  if (endDate && !Number.isNaN(endDate.getTime()) && now > endDate) return false;
  return true;
}

function buildDiscountParagraph(
  raw: { label?: string; message?: string; startDate?: string | null; endDate?: string | null },
  vars: TokenVars,
  now: Date,
) {
  if (!isDiscountActive(raw.startDate, raw.endDate, now)) return '';
  const base = (raw.message || raw.label || '').trim();
  if (!base) return '';
  const startLabel = formatDate(raw.startDate);
  const endLabel = formatDate(raw.endDate);
  const windowLabel =
    startLabel && endLabel ? `Valid ${startLabel} - ${endLabel}` : startLabel ? `Valid from ${startLabel}` : endLabel ? `Valid until ${endLabel}` : '';
  const resolved = replaceTokens(base, { ...vars, discountLabel: raw.label ?? '' });
  return windowLabel && !raw.message ? `${resolved} (${windowLabel})` : resolved;
}

export function splitMessageParagraphs(text: string | null | undefined) {
  return (text ?? '')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function compileItineraryMessageParagraphs({
  template,
  clientName,
  itineraryName,
  airfareUsd,
  startDate,
  discountPercentage,
  discountDeadline,
  now,
}: CompileInputs) {
  if (!template) return [];
  const cabinAvailability = (template.cabinAvailability || '').trim();
  const flightPricing = (template.flightPricing || '').trim() || (airfareUsd ? `${formatUsd(airfareUsd)} per person` : '');
  const startDateLabel = formatDate(startDate ?? null);
  const discountPctValue = Number.isFinite(discountPercentage) ? Math.round(discountPercentage || 0) : 0;
  const discountPctLabel = discountPctValue ? `${discountPctValue}%` : '';
  const discountDeadlineLabel = formatDate(discountDeadline ?? null);
  const vars: TokenVars = {
    clientName,
    itineraryName,
    cabinAvailability,
    flightPricing,
    startDate: startDateLabel,
    discountPercentage: discountPctLabel,
    discountDeadline: discountDeadlineLabel,
  };

  const paragraphs: string[] = [];
  const push = (value?: string) => {
    const cleaned = (value || '').trim();
    if (!cleaned) return;
    paragraphs.push(replaceTokens(cleaned, vars));
  };

  push(template.greeting);
  push(template.generalMessage);
  push(template.keyDetails);
  push(template.cabinAvailability);
  push(template.flightPricing);

  const current = now ?? new Date();
  const discountParagraphs =
    template.discounts?.map((d) => buildDiscountParagraph(d, vars, current)).filter(Boolean) ?? [];
  paragraphs.push(...discountParagraphs);

  if (template.inclusions?.length) {
    const list = template.inclusions.map((item) => item.trim()).filter(Boolean).join(', ');
    if (list) paragraphs.push(`Inclusions: ${replaceTokens(list, vars)}`);
  }
  if (template.exclusions?.length) {
    const list = template.exclusions.map((item) => item.trim()).filter(Boolean).join(', ');
    if (list) paragraphs.push(`Exclusions: ${replaceTokens(list, vars)}`);
  }

  return paragraphs;
}

