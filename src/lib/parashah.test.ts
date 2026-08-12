import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildHebcalLeyningUrl,
    formatParashahDate,
    formatStructuredReadingRange,
    getBritOverrideKey,
    getUpcomingShabbatDate,
    parseLeyningPayload,
    parseShabbatPayload
} from './parashah.ts';

const reehLeyningFixture = {
    items: [{
        date: '2026-08-08',
        hdate: '25 Av 5786',
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

test('upcoming Shabbat is based on the Pacific calendar date', () => {
    const lateThursdayPacific = new Date('2026-08-07T06:53:00.000Z');
    assert.equal(getUpcomingShabbatDate(lateThursdayPacific), '2026-08-08');
});

test('strictly following Shabbat skips the current Pacific Saturday', () => {
    const saturdayMorningPdt = new Date('2026-08-08T16:00:00.000Z');

    assert.equal(getUpcomingShabbatDate(saturdayMorningPdt), '2026-08-08');
    assert.equal(
        getUpcomingShabbatDate(saturdayMorningPdt, 'America/Los_Angeles', {
            strictlyFollowing: true
        }),
        '2026-08-15'
    );
});

test('strict following behavior changes at Pacific midnight during PDT', () => {
    const beforeSaturdayPdt = new Date('2026-08-08T06:59:59.000Z');
    const startOfSaturdayPdt = new Date('2026-08-08T07:00:00.000Z');

    assert.equal(
        getUpcomingShabbatDate(beforeSaturdayPdt, 'America/Los_Angeles', {
            strictlyFollowing: true
        }),
        '2026-08-08'
    );
    assert.equal(
        getUpcomingShabbatDate(startOfSaturdayPdt, 'America/Los_Angeles', {
            strictlyFollowing: true
        }),
        '2026-08-15'
    );
});

test('strict following behavior changes at Pacific midnight during PST', () => {
    const beforeSaturdayPst = new Date('2026-01-10T07:59:59.000Z');
    const startOfSaturdayPst = new Date('2026-01-10T08:00:00.000Z');

    assert.equal(
        getUpcomingShabbatDate(beforeSaturdayPst, 'America/Los_Angeles', {
            strictlyFollowing: true
        }),
        '2026-01-10'
    );
    assert.equal(
        getUpcomingShabbatDate(startOfSaturdayPst, 'America/Los_Angeles', {
            strictlyFollowing: true
        }),
        '2026-01-17'
    );
});

test('Leyning parser uses structured Triennial fields and official year', () => {
    const parsed = parseLeyningPayload(reehLeyningFixture, '2026-08-08');
    assert.equal(parsed?.triennial?.torah, 'Deuteronomy 11:26-12:28');
    assert.equal(parsed?.triennial?.haftarah, 'Isaiah 54:11-55:5');
    assert.equal(parsed?.triennial?.year, 1);
    assert.equal(parsed?.annual.hebrewYear, 5786);
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

test('holiday Shabbat readings are accepted without inventing a Triennial cycle', () => {
    const parsed = parseLeyningPayload({
        items: [{
            date: '2026-09-12',
            type: 'holiday',
            name: { en: 'Rosh Hashana I (on Shabbat)' },
            fullkriyah: {
                '1': { k: 'Genesis', b: '21:1', e: '21:4' },
                '5': { k: 'Genesis', b: '21:18', e: '21:21' },
                '7': { k: 'Genesis', b: '21:28', e: '21:34' },
                M: { k: 'Numbers', b: '29:1', e: '29:6' }
            },
            summary: 'Genesis 21:1-34; Numbers 29:1-6',
            haftara: 'I Samuel 1:1-2:10'
        }]
    }, '2026-09-12');

    assert.equal(parsed?.annual.name, 'Rosh Hashana I (on Shabbat)');
    assert.equal(parsed?.annual.torah, 'Genesis 21:1-34; Numbers 29:1-6');
    assert.equal(parsed?.triennial, null);
});

test('structured reading ranges use the available numeric aliyot', () => {
    assert.equal(formatStructuredReadingRange({
        '1': { k: 'Exodus', b: '33:12', e: '33:16' },
        '5': { k: 'Exodus', b: '34:4', e: '34:10' }
    }), 'Exodus 33:12-34:10');
});

test('Triennial data is hidden unless Hebcal supplies an official cycle year', () => {
    const fixture = structuredClone(reehLeyningFixture);
    delete fixture.items[0].triYear;
    assert.equal(parseLeyningPayload(fixture, '2026-08-08')?.triennial, null);
});

test('Hebcal policy is explicitly Diaspora and Brit overrides are date scoped', () => {
    const url = new URL(buildHebcalLeyningUrl('2026-08-15'));
    assert.equal(url.searchParams.get('i'), 'off');
    assert.equal(url.searchParams.get('triennial'), 'on');
    assert.equal(url.searchParams.get('date'), '2026-08-15');
    assert.equal(getBritOverrideKey('2026-08-15'), 'brit-chadashah:2026-08-15');
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
