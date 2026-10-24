import { autumnHolidayServices, holidayServiceIds } from '../data/holidayServices.ts';
import { getManagedCongregationCalendarEvents } from './congregationCalendarEvents.ts';
import { congregationCalendarTimeZone, type CongregationEvent } from '../data/congregationEvents.ts';

export async function getHolidayServiceProgramme(db?: D1Database): Promise<readonly CongregationEvent[]> {
    const events = db ? await getManagedCongregationCalendarEvents(db) : autumnHolidayServices;
    return events.filter(event => holidayServiceIds.has(event.id) && event.schedule.kind === 'single')
        .sort((a, b) => {
            if (a.schedule.kind !== 'single' || b.schedule.kind !== 'single') return 0;
            return (a.schedule.date + (a.schedule.allDay ? '' : a.schedule.startTime))
                .localeCompare(b.schedule.date + (b.schedule.allDay ? '' : b.schedule.startTime));
        });
}

export type CongregationClock = { readonly date: string; readonly time: string };

/** The congregation's local date (YYYY-MM-DD) and 24-hour time (HH:MM) at an instant. */
export const congregationClock = (instant: Date = new Date()): CongregationClock => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: congregationCalendarTimeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(instant);
    const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
    return { date: `${part('year')}-${part('month')}-${part('day')}`, time: `${part('hour')}:${part('minute')}` };
};

/** A service stays on the invitation list until it ends; one without an end time stays through its day. */
export const isUpcomingService = (event: CongregationEvent, clock: CongregationClock): boolean => {
    if (event.schedule.kind !== 'single') return false;
    if (event.schedule.date !== clock.date) return event.schedule.date > clock.date;
    return event.schedule.allDay || !event.schedule.endTime || event.schedule.endTime > clock.time;
};
