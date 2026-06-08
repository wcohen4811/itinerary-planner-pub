import readXlsxFile from 'read-excel-file/browser';

function canonHeader(cell: unknown): string | null {
  const k = String(cell ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  const map: Record<string, string> = {
    itinerarytitle: 'itineraryTitle',
    triptitle: 'itineraryTitle',
    tourname: 'itineraryTitle',
    tripname: 'itineraryTitle',
    daynumber: 'dayNumber',
    daynum: 'dayNumber',
    dayn: 'dayNumber',
    day: 'dayNumber',
    '#': 'dayNumber',
    no: 'dayNumber',
    index: 'dayNumber',
    title: 'title',
    daytitle: 'title',
    description: 'description',
    hotel: 'hotelName',
    hotelname: 'hotelName',
    transfers: 'transferCount',
    transfercount: 'transferCount',
    transfer: 'transferCount',
    netprice: 'netPriceUsd',
    netusd: 'netPriceUsd',
    net: 'netPriceUsd',
    perpersontotal: 'perPersonTotalUsd',
    persontotal: 'perPersonTotalUsd',
    perperson: 'perPersonTotalUsd',
    ppt: 'perPersonTotalUsd',
  };
  return map[k] ?? null;
}

function toNum(v: unknown): number | undefined {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (typeof v === 'string') {
    const t = v.trim().replace(/[$,]/g, '');
    if (!t) return undefined;
    const n = Number(t);
    return isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Maps the first worksheet to the JSON shape accepted by POST /admin/import-itineraries */
export async function parseExcelToItineraryImport(file: File): Promise<Record<string, unknown>> {
  // read-excel-file/browser can return rows directly, while some integrations
  // may provide a wrapped worksheet-like shape. Normalize to a 2D rows array.
  const parsed = await readXlsxFile(file);
  const rows =
    Array.isArray(parsed) && parsed.length > 0 && Array.isArray(parsed[0])
      ? (parsed as unknown as unknown[][])
      : Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && 'data' in (parsed[0] as Record<string, unknown>) && Array.isArray((parsed[0] as { data?: unknown }).data)
        ? ((parsed[0] as { data: unknown[][] }).data ?? [])
        : [];
  if (!rows.length) throw new Error('The spreadsheet is empty.');

  // Some files include intro/title rows above the actual headers.
  // Find the first row that looks like a header row for itinerary day data.
  let headerRowIndex = -1;
  let colKeys: (string | null)[] = [];
  const scanLimit = Math.min(rows.length, 25);
  for (let i = 0; i < scanLimit; i++) {
    const candidate = rows[i];
    if (!Array.isArray(candidate)) continue;
    const candidateKeys = candidate.map((cell) => canonHeader(cell));
    const recognized = candidateKeys.filter(Boolean).length;
    const hasDayCol = candidateKeys.some((k) => k === 'dayNumber' || k === 'title');
    if (recognized >= 2 && hasDayCol) {
      headerRowIndex = i;
      colKeys = candidateKeys;
      break;
    }
  }
  if (headerRowIndex < 0) {
    throw new Error(
      'Could not find day columns. Use a header row with labels such as Day number, Title, Description, Hotel, Transfers (optional: Net price, Per person total, Itinerary title).',
    );
  }

  let itineraryTitle = '';
  const days: Record<string, unknown>[] = [];

  for (let r = headerRowIndex + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!Array.isArray(row)) continue;
    const isBlankRow = row.every((v) => v === null || v === undefined || String(v).trim() === '');
    if (isBlankRow) continue;
    const o: Record<string, unknown> = {};
    for (let c = 0; c < row.length; c++) {
      const key = colKeys[c];
      if (!key) continue;
      o[key] = row[c];
    }

    const it = o.itineraryTitle;
    if (it !== undefined && it !== null && String(it).trim() !== '') {
      itineraryTitle = String(it).trim();
    }

    const dayNumRaw = toNum(o.dayNumber);
    const dayNumber = dayNumRaw !== undefined ? Math.max(1, Math.floor(dayNumRaw)) : days.length + 1;

    const titleRaw = o.title;
    const title =
      titleRaw !== undefined && titleRaw !== null && String(titleRaw).trim() !== ''
        ? String(titleRaw).trim()
        : `Day ${dayNumber}`;

    const descRaw = o.description;
    const description = descRaw !== undefined && descRaw !== null ? String(descRaw) : 'TBD';

    const hotelRaw = o.hotelName;
    const hotelName = hotelRaw !== undefined && hotelRaw !== null ? String(hotelRaw) : '';

    const tc = toNum(o.transferCount);
    const transferCount = tc !== undefined ? Math.max(0, Math.floor(tc)) : 0;

    const day: Record<string, unknown> = {
      dayNumber,
      title,
      description,
      hotelName,
      transferCount,
    };

    const np = toNum(o.netPriceUsd);
    const pp = toNum(o.perPersonTotalUsd);
    if (np !== undefined) day.netPriceUsd = np;
    if (pp !== undefined) day.perPersonTotalUsd = pp;

    days.push(day);
  }

  if (days.length === 0) throw new Error('No day rows found below the header row.');

  return {
    title: itineraryTitle || 'Imported itinerary',
    days,
    blankPricing: false,
  };
}
