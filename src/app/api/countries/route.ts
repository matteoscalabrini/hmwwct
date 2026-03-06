import { NextResponse } from 'next/server';
import { fetchAllCountries } from '@/lib/api/restcountries';

export async function GET() {
  try {
    const countries = await fetchAllCountries();
    return NextResponse.json(countries, {
      headers: { 'Cache-Control': 'public, s-maxage=604800, stale-while-revalidate=86400' },
    });
  } catch (err) {
    console.error('[/api/countries]', err);
    return NextResponse.json({ error: 'Failed to fetch countries' }, { status: 502 });
  }
}
