import assert from 'node:assert/strict';
import test from 'node:test';
import { parseSingleByteRange } from './mediaRange.ts';

test('parses bounded, open-ended, and suffix byte ranges', () => {
    assert.deepEqual(parseSingleByteRange('bytes=0-1023', 5000), { start: 0, end: 1023 });
    assert.deepEqual(parseSingleByteRange('bytes=1024-', 5000), { start: 1024, end: 4999 });
    assert.deepEqual(parseSingleByteRange('bytes=-500', 5000), { start: 4500, end: 4999 });
});

test('clamps range ends and rejects unsupported or unsatisfiable ranges', () => {
    assert.deepEqual(parseSingleByteRange('bytes=4900-9000', 5000), { start: 4900, end: 4999 });
    assert.equal(parseSingleByteRange('bytes=5000-', 5000), null);
    assert.equal(parseSingleByteRange('bytes=10-4', 5000), null);
    assert.equal(parseSingleByteRange('bytes=0-1,4-5', 5000), null);
    assert.equal(parseSingleByteRange('items=0-1', 5000), null);
});
