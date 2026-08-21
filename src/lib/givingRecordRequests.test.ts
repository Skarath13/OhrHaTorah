import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DONOR_RECORD_REQUEST_CONFIRMATION,
  validateDonorRecordRequestPayload,
} from './givingRecordRequests.ts';

const validPayload = {
  submissionId: '550e8400-e29b-41d4-a716-446655440000',
  requestType: 'acknowledgment',
  recordName: '  Miriam   Cohen  ',
  email: 'MIRIAM@example.com',
  contributionDate: '2026-08-20',
  amountText: '$36.00 USD',
  paymentMethod: 'paypal',
  reference: '  PP-123  ',
  goodsServices: 'no',
  reviewDetails: '',
  confirmation: true,
  website: '',
  turnstileToken: 'verified-token',
};

test('normalizes a valid acknowledgment request without changing its meaning', () => {
  const result = validateDonorRecordRequestPayload(validPayload);
  assert.equal(result.ok, true);
  if (!result.ok || result.bot) assert.fail('expected a visitor request');

  assert.deepEqual(result.value, {
    submissionId: validPayload.submissionId,
    requestType: 'acknowledgment',
    recordName: 'Miriam Cohen',
    email: 'miriam@example.com',
    contributionDate: '2026-08-20',
    amountText: '$36.00 USD',
    paymentMethod: 'paypal',
    reference: 'PP-123',
    goodsServices: 'no',
    reviewDetails: null,
    turnstileToken: 'verified-token',
  });
  assert.match(DONOR_RECORD_REQUEST_CONFIRMATION, /not an acknowledgment, tax receipt/);
});

test('requires review details for corrections and possible goods or services', () => {
  for (const payload of [
    { ...validPayload, requestType: 'correction', reviewDetails: '' },
    { ...validPayload, goodsServices: 'yes_or_unsure', reviewDetails: '' },
  ]) {
    const result = validateDonorRecordRequestPayload(payload);
    assert.deepEqual(result, { ok: false, fields: ['reviewDetails'] });
  }

  const result = validateDonorRecordRequestPayload({
    ...validPayload,
    requestType: 'correction',
    goodsServices: 'yes_or_unsure',
    reviewDetails: '  Amount should be $72.\r\nPlease review.  ',
  });
  assert.equal(result.ok, true);
  if (!result.ok || result.bot) assert.fail('expected a visitor request');
  assert.equal(result.value.reviewDetails, 'Amount should be $72.\nPlease review.');
});

test('rejects unsupported choices, invalid dates, missing confirmation, and control characters', () => {
  const result = validateDonorRecordRequestPayload({
    ...validPayload,
    requestType: 'receipt',
    email: 'bad@example.com\r\nBcc: attacker@example.com',
    contributionDate: '2026-02-30',
    paymentMethod: 'wire',
    goodsServices: 'maybe',
    confirmation: false,
  });
  assert.equal(result.ok, false);
  if (result.ok) assert.fail('expected validation errors');
  assert.deepEqual(result.fields, [
    'requestType',
    'email',
    'contributionDate',
    'paymentMethod',
    'goodsServices',
    'confirmation',
  ]);
});

test('enforces bounded fields and UUID/token requirements', () => {
  const result = validateDonorRecordRequestPayload({
    ...validPayload,
    submissionId: 'not-a-uuid',
    amountText: 'x'.repeat(41),
    reference: 'x'.repeat(121),
    reviewDetails: 'x'.repeat(2_001),
    turnstileToken: '',
  });
  assert.equal(result.ok, false);
  if (result.ok) assert.fail('expected validation errors');
  assert.deepEqual(result.fields, [
    'amountText',
    'reference',
    'reviewDetails',
    'turnstileToken',
    'submissionId',
  ]);
});

test('silently accepts a filled honeypot before validating visitor fields', () => {
  assert.deepEqual(validateDonorRecordRequestPayload({ website: 'spam.example' }), {
    ok: true,
    bot: true,
  });
});
