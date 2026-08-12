import type { APIRoute } from 'astro';
import {
    buildHebcalHolidayUrl,
    getCongregationCalendarEvents,
    getHebcalCalendarEvents,
    parseCalendarRange,
    type PublicCalendarEvent,
} from '../../../lib/calendar';
import { congregationCalendarTimeZone } from '../../../data/congregationEvents';

const JSON_HEADERS = {
    'Content-Type': 'application/json; charset=utf-8',
};

const isIncluded = (value: string | null): boolean => value !== '0';

export const GET: APIRoute = async ({ request }) => {
    const requestUrl = new URL(request.url);
    const start = requestUrl.searchParams.get('start')?.trim() || '';
    const end = requestUrl.searchParams.get('end')?.trim() || '';

    let range;
    try {
        range = parseCalendarRange(start, end);
    } catch {
        return new Response(JSON.stringify({
            success: false,
            error: 'A valid calendar range is required',
        }), { status: 400, headers: JSON_HEADERS });
    }

    const includeCongregation = isIncluded(requestUrl.searchParams.get('congregation'));
    const includeHolidays = isIncluded(requestUrl.searchParams.get('holidays'));
    const includeObservances = isIncluded(requestUrl.searchParams.get('observances'));
    const includeCandleLighting = isIncluded(requestUrl.searchParams.get('candleLighting'));
    const localEvents = includeCongregation ? getCongregationCalendarEvents(range) : [];

    let holidayEvents: PublicCalendarEvent[] = [];
    let holidayStatus: 'available' | 'unavailable' | 'not-requested' = 'not-requested';
    let warning: string | undefined;

    if (includeHolidays || includeObservances || includeCandleLighting) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        try {
            const response = await fetch(buildHebcalHolidayUrl(range), {
                signal: controller.signal,
                headers: { Accept: 'application/json' },
            });
            if (!response.ok) throw new Error(`Hebcal returned ${response.status}`);
            const payload = await response.json();
            holidayEvents = getHebcalCalendarEvents(payload, range, {
                includeHolidays,
                includeObservances,
                includeCandleLighting,
            });
            holidayStatus = 'available';
        } catch (error) {
            console.error('Jewish holiday calendar lookup failed:', error);
            holidayStatus = 'unavailable';
            warning = 'Jewish holiday and candle-lighting data is temporarily unavailable. Congregation events are still shown.';
        } finally {
            clearTimeout(timeoutId);
        }
    }

    return new Response(JSON.stringify({
        success: true,
        events: [...localEvents, ...holidayEvents],
        meta: {
            timeZone: congregationCalendarTimeZone,
            range,
            holidayStatus,
            warning,
            holidaySource: 'Hebcal.com',
            holidayLicense: 'CC BY 4.0',
        },
    }), {
        status: 200,
        headers: {
            ...JSON_HEADERS,
            'Cache-Control': 'public, max-age=300, s-maxage=86400, stale-while-revalidate=604800',
        },
    });
};
