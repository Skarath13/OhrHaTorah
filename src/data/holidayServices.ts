import { congregationCalendarTimeZone, congregationEvents, type CongregationEvent } from './congregationEvents.ts';

// September 2 congregation email, supplied by Dylan September 4, 2026.
// The same definitions prepare the reviewed D1 data operation and offline preview.
// A bound database is always authoritative; these are never merged over its rows.
export const autumnHolidayServices: readonly CongregationEvent[] = ([
    { id: 'holiday-2026-rosh-hashanah', title: 'Rosh HaShanah · Yom Teruah', description: 'Traditional Prayers, Torah Service, and shofar sounding.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-12', allDay: false, startTime: '14:30' } },
    { id: 'holiday-2026-kol-nidre', title: 'Erev Yom Kippur · Kol Nidre', description: 'Kol Nidre evening service.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-20', allDay: false, startTime: '18:30', endTime: '20:00' } },
    { id: 'holiday-2026-yom-kippur-mincha', title: 'Yom Kippur · Mincha', description: 'Afternoon service. Come any time after 1:30 p.m.; the service begins at 3:00 p.m.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-21', allDay: false, startTime: '15:00' } },
    { id: 'holiday-2026-neilah', title: 'Yom Kippur · Neilah', description: 'Concluding prayers. The start time is approximate.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-21', allDay: false, startTime: '18:45' } },
    { id: 'holiday-2026-break-fast', title: 'Yom Kippur · Havdalah and break-the-fast', description: 'The start time is approximate.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-21', allDay: false, startTime: '19:26' } },
    { id: 'holiday-2026-sukkot', title: 'Sukkot · First Day', description: 'Traditional prayers, waving of the lulav, and Torah Service.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-09-26', allDay: false, startTime: '14:30' } },
    { id: 'holiday-2026-shemini-atzeret', title: 'Shemini Atzeret & Simchat Torah', description: 'Our combined holiday gathering on October 3.', timeZone: congregationCalendarTimeZone, schedule: { kind: 'single', date: '2026-10-03', allDay: false, startTime: '14:30' } },
] satisfies readonly CongregationEvent[]).map(event => ({ ...event, location: '10460 Slater Ave, Fountain Valley, CA 92708' }));

export const holidaySaturdayDates = ['2026-09-12', '2026-09-26', '2026-10-03'] as const;
export const holidayReplacedSeriesIds = ['shabbat-messianic-music-and-dance', 'shabbat-traditional-prayers-and-torah-service'] as const;
export const calendarFallbackEvents: readonly CongregationEvent[] = [
    ...congregationEvents.map(event => event.schedule.kind === 'weekly' && holidayReplacedSeriesIds.some(id => id === event.id)
        ? { ...event, schedule: { ...event.schedule, excludedDates: holidaySaturdayDates } }
        : event),
    ...autumnHolidayServices,
];
export const holidayServiceIds = new Set(autumnHolidayServices.map(event => event.id));
