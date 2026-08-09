import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getChayyeiYeshuaCycleYear,
    getChayyeiYeshuaReading
} from './britChadashah.ts';

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
