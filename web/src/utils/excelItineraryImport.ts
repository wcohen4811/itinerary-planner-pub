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
  const sheets = await readXlsxFile(file);
  const rows = sheets[0]?.data ?? [];
  if (!rows.length) throw new Error('The spreadsheet is empty.');

  const headerRow = rows[0] as unknown[];
  const colKeys: (string | null)[] = headerRow.map((cell) => canonHeader(cell));

  const hasDayCol = colKeys.some((k) => k === 'dayNumber' || k === 'title');
  if (!hasDayCol) {
    throw new Error(
      'Could not find day columns. Use a header row with labels such as Day number, Title, Description, Hotel, Transfers (optional: Net price, Per person total, Itinerary title).',
    );
  }

  let itineraryTitle = '';
  const days: Record<string, unknown>[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r] as unknown[];
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
    const dayNumber = dayNumRaw !== undefined ? Math.max(1, Math.floor(dayNumRaw)) : r;

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
