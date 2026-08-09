import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
    getChayyeiYeshuaCycleYear,
    getChayyeiYeshuaReading,
    getPreferredBritReading
} from './britChadashah.ts';
import { getFfozReading } from './ffozReadings.ts';

test('Chayyei Yeshua cycle follows the MJRC A-B-C Hebrew-year sequence', () => {
    assert.equal(getChayyeiYeshuaCycleYear(5786), 'A');
    assert.equal(getChayyeiYeshuaCycleYear(5787), 'B');
    assert.equal(getChayyeiYeshuaCycleYear(5788), 'C');
    assert.equal(getChayyeiYeshuaCycleYear(5789), 'A');
});

test('the upcoming Shoftim reading uses the documented cycle and normalizes names', () => {
    assert.deepEqual(getChayyeiYeshuaReading('Shoftim', 5786), {
        reading: 'John 20:19–29',
        cycleYear: 'A'
    });
    assert.equal(getChayyeiYeshuaReading('Re’eh', 5787)?.reading, 'Luke 24:33–49');
});

test('special Shabbat readings are represented and unknown entries fail closed', () => {
    assert.equal(
        getChayyeiYeshuaReading('Rosh Hashana I (on Shabbat)', 5787)?.reading,
        'Romans 8:31–39'
    );
    assert.equal(getChayyeiYeshuaReading('Unknown observance', 5787), null);
});

test('FFOZ is the primary congregation reading and normalizes Hebcal names', () => {
    assert.deepEqual(getPreferredBritReading('Shoftim', 5786), {
        reading: 'John 14:9-20',
        source: 'ffoz',
        sourceName: 'First Fruits of Zion',
        sourceUrl: 'https://ffoz.org/torahportions/parashah/shoftim'
    });
    assert.equal(getFfozReading('Re’eh')?.reading, 'John 6:35-51');
    assert.equal(
        getFfozReading('Pesach Shabbat Chol ha-Moed')?.reading,
        'Luke 23:42-56'
    );
});

test('MJRC is used only when FFOZ has no matching reading', () => {
    assert.deepEqual(getPreferredBritReading('Shabbat Shuva', 5787), {
        reading: 'Luke 15:11–32',
        source: 'mjrc',
        sourceName: 'Chayyei Yeshua Three-Year Besorah Reading Cycle',
        sourceUrl: 'https://www.ourrabbis.org/main/resources/chayyei-yeshua-reading-cycle',
        cycleYear: 'B'
    });
    assert.equal(getPreferredBritReading('Unknown observance', 5787), null);
});

test('the card has no unverified legacy reading table', () => {
    const component = readFileSync(
        new URL('../components/islands/ParashahCard.astro', import.meta.url),
        'utf8'
    );
    assert.doesNotMatch(component, /const britReadings/);
    assert.match(component, /getPreferredBritReading/);
});
