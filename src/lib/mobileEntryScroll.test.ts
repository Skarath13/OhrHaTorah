import assert from 'node:assert/strict';
import test from 'node:test';
import { mobileEntryScrollScript, shouldResetMobileEntry } from './mobileEntryScroll.ts';

const baseContext = {
    compactViewport: true,
    topLevel: true,
    hasHash: false,
    navigationType: 'navigate',
    hasReferrer: false,
};

test('mobile fresh entries without fragments reset to the top', () => {
    assert.equal(shouldResetMobileEntry(baseContext), true);
    assert.equal(shouldResetMobileEntry({ ...baseContext, hasReferrer: true }), true);
});

test('anchors, desktop, iframes, reloads, and ordinary history visits retain browser scroll behavior', () => {
    assert.equal(shouldResetMobileEntry({ ...baseContext, compactViewport: false }), false);
    assert.equal(shouldResetMobileEntry({ ...baseContext, topLevel: false }), false);
    assert.equal(shouldResetMobileEntry({ ...baseContext, hasHash: true }), false);
    assert.equal(shouldResetMobileEntry({ ...baseContext, navigationType: 'reload' }), false);
    assert.equal(shouldResetMobileEntry({ ...baseContext, navigationType: 'back_forward', hasReferrer: true }), false);
});

test('a direct restored Safari session is eligible for a bounded top reset', () => {
    assert.equal(shouldResetMobileEntry({ ...baseContext, navigationType: 'back_forward' }), true);
    assert.match(mobileEntryScrollScript, /maximumRestoredOffset/);
    assert.match(mobileEntryScrollScript, /manageRestoration = navigationType !== 'back_forward'/);
    assert.match(mobileEntryScrollScript, /pageshow/);
    assert.match(mobileEntryScrollScript, /scrollRestoration = 'manual'/);
});
