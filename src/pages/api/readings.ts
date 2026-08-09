import type { APIRoute } from 'astro';
import { buildHebcalLeyningUrl, parseLeyningPayload } from '../../lib/parashah';

const JSON_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8'
};

const isSaturdayIsoDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return !Number.isNaN(date.getTime())
    && date.toISOString().slice(0, 10) === value
    && date.getUTCDay() === 6;
};

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const expectedDate = url.searchParams.get('date')?.trim() || '';

  if (!isSaturdayIsoDate(expectedDate)) {
    return new Response(JSON.stringify({
      success: false,
      error: 'A valid Saturday date is required'
    }), { status: 400, headers: JSON_HEADERS });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const hebcalResponse = await fetch(buildHebcalLeyningUrl(expectedDate), {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });
    if (!hebcalResponse.ok) {
      throw new Error(`Hebcal returned ${hebcalResponse.status}`);
    }

    const payload = await hebcalResponse.json();
    const bundle = parseLeyningPayload(payload, expectedDate);
    if (!bundle) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No verified reading was returned for that Shabbat'
      }), { status: 404, headers: JSON_HEADERS });
    }

    return new Response(JSON.stringify({
      success: true,
      data: bundle,
      meta: {
        date: expectedDate,
        calendar: 'Diaspora',
        source: 'Hebcal Leyning API',
        attributionUrl: 'https://www.hebcal.com/home/4277/leyning-torah-reading-api'
      }
    }), {
      status: 200,
      headers: {
        ...JSON_HEADERS,
        'Cache-Control': 'public, max-age=300, s-maxage=21600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Weekly reading lookup failed:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Weekly readings are temporarily unavailable'
    }), { status: 502, headers: JSON_HEADERS });
  } finally {
    clearTimeout(timeoutId);
  }
};
