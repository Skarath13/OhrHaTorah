import { autumnHolidayServices, holidayServiceIds } from '../data/holidayServices.ts';
import { getManagedCongregationCalendarEvents } from './congregationCalendarEvents.ts';
import type { CongregationEvent } from '../data/congregationEvents.ts';

export async function getHolidayServiceProgramme(db?: D1Database): Promise<readonly CongregationEvent[]> {
    const events = db ? await getManagedCongregationCalendarEvents(db) : autumnHolidayServices;
    return events.filter(event => holidayServiceIds.has(event.id) && event.schedule.kind === 'single')
        .sort((a, b) => {
            if (a.schedule.kind !== 'single' || b.schedule.kind !== 'single') return 0;
            return (a.schedule.date + (a.schedule.allDay ? '' : a.schedule.startTime))
                .localeCompare(b.schedule.date + (b.schedule.allDay ? '' : b.schedule.startTime));
        });
}
