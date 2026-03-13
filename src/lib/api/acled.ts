import { AcledConflictSignal } from '@/types';

const ACLED_TOKEN_URL = 'https://acleddata.com/oauth/token';
const ACLED_EVENTS_URL = 'https://acleddata.com/api/acled/read';
const LOOKBACK_DAYS = 365;

type JsonRecord = Record<string, unknown>;

let tokenCache: { accessToken: string; expiresAt: number } | null = null;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null;
}

function parseNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const normalized = value.replace(/,/g, '').trim();
    if (!normalized) return null;
    const parsed = Number.parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function parseAcledDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value.trim()) return null;

  const direct = Date.parse(value);
  if (!Number.isNaN(direct)) return new Date(direct);

  const normalized = value.replace(/^(\d{1,2}) ([A-Za-z]+) (\d{4})$/, '$2 $1, $3');
  const fallback = Date.parse(normalized);
  return Number.isNaN(fallback) ? null : new Date(fallback);
}

function extractRows(payload: unknown): JsonRecord[] {
  if (Array.isArray(payload)) return payload.filter(isRecord);
  if (isRecord(payload) && Array.isArray(payload.data)) {
    return payload.data.filter(isRecord);
  }
  return [];
}

async function getAcledAccessToken(signal?: AbortSignal): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.accessToken;
  }

  const email = process.env.ACLED_EMAIL;
  const password = process.env.ACLED_PASSWORD;
  if (!email || !password) return null;

  const body = new URLSearchParams({
    grant_type: 'password',
    username: email,
    password,
  });

  try {
    const res = await fetch(ACLED_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
      signal,
    });
    if (!res.ok) return null;

    const payload = (await res.json()) as {
      access_token?: string;
      expires_in?: number;
    };
    if (!payload.access_token) return null;

    tokenCache = {
      accessToken: payload.access_token,
      expiresAt: Date.now() + Math.max((payload.expires_in ?? 3600) - 60, 60) * 1000,
    };

    return tokenCache.accessToken;
  } catch {
    return null;
  }
}

async function fetchAcledYear(
  countryName: string,
  year: number,
  token: string,
  signal?: AbortSignal
): Promise<JsonRecord[]> {
  const params = new URLSearchParams({
    _format: 'json',
    country: countryName,
    year: String(year),
    event_type: 'Battles|Violence against civilians|Explosions/Remote violence',
    fields: 'event_date|event_type|fatalities|country',
    limit: '5000',
  });

  const res = await fetch(`${ACLED_EVENTS_URL}?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 21600 },
    signal,
  });

  if (!res.ok) return [];

  const payload = (await res.json()) as unknown;
  return extractRows(payload);
}

export async function fetchAcledConflictSignal(
  countryName: string,
  signal?: AbortSignal
): Promise<AcledConflictSignal | null> {
  const token = await getAcledAccessToken(signal);
  if (!token) return null;

  const currentYear = new Date().getFullYear();
  const [currentRows, previousRows] = await Promise.all([
    fetchAcledYear(countryName, currentYear, token, signal),
    fetchAcledYear(countryName, currentYear - 1, token, signal),
  ]);

  const windowStart = new Date();
  windowStart.setUTCDate(windowStart.getUTCDate() - LOOKBACK_DAYS);

  const recentRows = [...currentRows, ...previousRows].filter((row) => {
    const date = parseAcledDate(row.event_date);
    return date !== null && date >= windowStart;
  });

  const politicalViolenceEvents = recentRows.length;
  const reportedFatalities = recentRows.reduce((sum, row) => sum + (parseNumber(row.fatalities) ?? 0), 0);

  let fragilityMultiplier = 1;
  if (politicalViolenceEvents >= 10 || reportedFatalities >= 50) {
    const eventSignal = Math.min(politicalViolenceEvents / 250, 1);
    const fatalitySignal = Math.min(reportedFatalities / 2000, 1);
    fragilityMultiplier = Number((1 + (0.08 * eventSignal) + (0.17 * fatalitySignal)).toFixed(3));
  }

  return {
    country: countryName,
    lookbackDays: LOOKBACK_DAYS,
    politicalViolenceEvents,
    reportedFatalities,
    fragilityMultiplier,
    fetchedAt: new Date().toISOString(),
  };
}
