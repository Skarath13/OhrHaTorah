import { mkdirSync, writeFileSync } from 'node:fs';
import { buildAutumn2026CalendarChange } from '../src/lib/holidayCalendarChange.ts';

const output = new URL('../docs/data-changes/autumn-2026-calendar.sql', import.meta.url);
mkdirSync(new URL('../docs/data-changes/', import.meta.url), { recursive: true });
writeFileSync(output, buildAutumn2026CalendarChange());
console.log(`Prepared ${output.pathname}. No database connection or mutation.`);
