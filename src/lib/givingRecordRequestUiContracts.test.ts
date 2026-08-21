import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const readProjectFile = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const donateSource = readProjectFile('../pages/donate.astro');
const dialogSource = readProjectFile('../components/forms/GivingRecordRequestDialog.astro');
const footerSource = readProjectFile('../components/layout/Footer.astro');

test('the records disclosure opens a separate native, labeled dialog', () => {
  assert.match(donateSource, /<details class="giving-disclosure giving-disclosure-records" id="giving-records">/);
  assert.match(donateSource, /id="giving-record-trigger"[\s\S]*?aria-haspopup="dialog"[\s\S]*?aria-controls="giving-request-dialog"/);
  assert.ok(
    donateSource.indexOf('<GivingRecordRequestDialog />') > donateSource.indexOf('</section>'),
    'the top-layer dialog component should not be nested in the disclosure',
  );
  assert.match(dialogSource, /<dialog[\s\S]*?id="giving-request-dialog"[\s\S]*?aria-labelledby="giving-request-title"[\s\S]*?aria-describedby=/);
  assert.match(dialogSource, /dialog\.showModal\(\)/);
  assert.match(dialogSource, /previousFocus\?\.focus/);
  assert.match(dialogSource, /role="status" aria-live="polite" aria-atomic="true" tabindex="-1"/);
});

test('the form requests only bounded record-matching information', () => {
  for (const requiredName of [
    'requestType',
    'recordName',
    'email',
    'contributionDate',
    'amountText',
    'paymentMethod',
    'goodsServices',
    'confirmation',
  ]) {
    assert.match(dialogSource, new RegExp(`name="${requiredName}"[^>]*\\brequired\\b`));
  }
  assert.match(dialogSource, /name="reference" maxlength="120"/);
  assert.match(dialogSource, /name="reviewDetails" maxlength="2000"/);
  assert.match(dialogSource, /name="website" class="giving-request-botcheck"/);
  assert.doesNotMatch(dialogSource, /name="(?:ssn|tin|routing|accountNumber|cardNumber|phone|address)"/i);
  assert.match(dialogSource, /Submitting this form does not verify a contribution or determine whether an amount is deductible/);
  assert.match(dialogSource, /This confirmation is not a giving acknowledgment/);
});

test('multiple Turnstile widgets use explicit rendering and widget-scoped resets', () => {
  assert.match(footerSource, /api\.js\?onload=onKohTurnstileReady&render=explicit/);
  assert.match(footerSource, /newsletterTurnstileWidgetId = turnstile\.render/);
  assert.match(footerSource, /reset\(newsletterTurnstileWidgetId\)/);
  assert.doesNotMatch(footerSource, /turnstileApi\?\.reset\(\)/);
  assert.match(dialogSource, /turnstileWidgetId = turnstile\.render/);
  assert.match(dialogSource, /action: 'giving_record_request'/);
  assert.match(dialogSource, /reset\(turnstileWidgetId\)/);
});

test('the dialog is viewport-safe and keeps minimum touch targets', () => {
  assert.match(dialogSource, /width: min\(43rem, calc\(100% - 2rem\)\)/);
  assert.match(dialogSource, /max-height: calc\(100dvh - 2rem\)/);
  assert.match(dialogSource, /overscroll-behavior: contain/);
  assert.match(dialogSource, /@media \(max-width: 520px\)/);
  assert.match(dialogSource, /grid-template-columns: minmax\(0, 1fr\)/);
  assert.match(dialogSource, /font-size: 1rem/);
  assert.match(dialogSource, /min-height: 44px/);
  assert.match(dialogSource, /@media \(prefers-reduced-motion: reduce\)/);
});
