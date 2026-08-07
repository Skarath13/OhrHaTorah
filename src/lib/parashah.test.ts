import assert from 'node:assert/strict';
import test from 'node:test';
import {
    formatParashahDate,
    getUpcomingShabbatDate,
    parseLeyningPayload,
    parseShabbatPayload
} from './parashah.ts';

const reehLeyningFixture = {
    items: [{
        date: '2026-08-08',
        type: 'shabbat',
        name: { en: "Re'eh" },
        summary: 'Deuteronomy 11:26-16:17',
        haftara: 'Isaiah 54:11-55:5',
        triennial: {
            '1': { k: 'Deuteronomy', b: '11:26', e: '11:31' },
            '7': { k: 'Deuteronomy', b: '12:26', e: '12:28' }
        },
        triYear: 1,
        triHaftara: 'Isaiah 54:11-55:5'
    }]
};

test('late Pacific evening still resolves the upcoming Saturday', () => {
    const lateThursdayPacific = new Date('2026-08-07T06:53:00.000Z');
    assert.equal(getUpcomingShabbatDate(lateThursdayPacific), '2026-08-08');
});

test('Leyning parser uses structured Triennial fields and official year', () => {
    const parsed = parseLeyningPayload(reehLeyningFixture, '2026-08-08');
    assert.equal(parsed?.triennial?.torah, 'Deuteronomy 11:26-12:28');
    assert.equal(parsed?.triennial?.haftarah, 'Isaiah 54:11-55:5');
    assert.equal(parsed?.triennial?.year, 1);
});

test('official Triennial year is preserved without a calendar-year guess', () => {
    const parsed = parseLeyningPayload({
        items: [{
            date: '2026-09-19',
            type: 'shabbat',
            name: { en: "Ha'azinu" },
            summary: 'Deuteronomy 32:1-52',
            haftara: 'Hosea 14:2-10; Joel 2:15-27',
            triennial: {
                '1': { k: 'Deuteronomy', b: '32:1', e: '32:6' },
                '7': { k: 'Deuteronomy', b: '32:44', e: '32:52' }
            },
            triYear: 2
        }]
    }, '2026-09-19');

    assert.equal(parsed?.triennial?.year, 2);
    assert.equal(parsed?.triennial?.haftarah, 'See weekly bulletin');
});

test('official alternate Triennial Haftarah wins over the annual Haftarah', () => {
    const parsed = parseLeyningPayload({
        items: [{
            date: '2025-10-18',
            type: 'shabbat',
            name: { en: 'Bereshit' },
            summary: 'Genesis 1:1-6:8',
            haftara: 'Isaiah 42:5-43:10',
            triennial: {
                '1': { k: 'Genesis', b: '1:1', e: '1:5' },
                '7': { k: 'Genesis', b: '2:1', e: '2:3' }
            },
            triYear: 1,
            triHaftara: 'Isaiah 42:5-21'
        }]
    }, '2025-10-18');

    assert.equal(parsed?.triennial?.haftarah, 'Isaiah 42:5-21');
});

test('Shabbat parser supplies a truthful embedded-reading fallback', () => {
    const parsed = parseShabbatPayload({
        items: [{
            title: 'Parashat Re’eh',
            title_orig: "Parashat Re'eh",
            category: 'parashat',
            date: '2026-08-08',
            leyning: {
                torah: 'Deuteronomy 11:26-16:17',
                haftarah: 'Isaiah 54:11-55:5',
                triennial: {
                    '1': 'Deuteronomy 11:26-11:31',
                    '7': 'Deuteronomy 12:26-12:28'
                }
            }
        }]
    });

    assert.equal(parsed?.triennial?.torah, 'Deuteronomy 11:26-12:28');
    assert.equal(parsed?.triennial?.haftarah, 'See weekly bulletin');
});

test('malformed payloads fail closed and date formatting does not shift backward', () => {
    assert.equal(parseLeyningPayload({ items: [] }, '2026-08-08'), null);
    assert.equal(parseShabbatPayload({ items: [{}] }), null);
    assert.equal(formatParashahDate('2026-08-08'), 'Aug 8');
});
