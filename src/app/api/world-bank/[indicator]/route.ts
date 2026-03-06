import { NextResponse } from 'next/server';
import { fetchWorldBankIndicator } from '@/lib/api/worldbank';

// Allowlist of permitted indicators (prevents abuse)
const ALLOWED_INDICATORS = new Set([
  'NY.GDP.MKTP.CD',     // GDP
  'MS.MIL.XPND.GD.ZS', // Military % GDP
  'SP.POP.TOTL',        // Population
  'NE.TRD.GNFS.ZS',    // Trade % GDP
]);

export async function GET(
  req: Request,
  { params }: { params: Promise<{ indicator: string }> }
) {
  const { indicator } = await params;
  const { searchParams } = new URL(req.url);
  const countries = searchParams.get('countries');

  if (!ALLOWED_INDICATORS.has(indicator)) {
    return NextResponse.json({ error: 'Indicator not permitted' }, { status: 400 });
  }
  if (!countries) {
    return NextResponse.json({ error: 'Missing countries parameter' }, { status: 400 });
  }

  const codes = countries.split(';').filter(Boolean).slice(0, 10); // max 10 countries
  try {
    const data = await fetchWorldBankIndicator(codes, indicator);
    const result = Object.fromEntries(data);
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600' },
    });
  } catch (err) {
    console.error('[/api/world-bank]', err);
    return NextResponse.json({ error: 'World Bank API error' }, { status: 502 });
  }
}
