import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MAX_UPDATE_REQUEST_BODY_BYTES,
  TURNSTILE_EXPECTED_ACTION,
  TURNSTILE_EXPECTED_HOSTNAME,
  UPDATE_REQUEST_CONSENT,
  UpdateRequestMalformedBodyError,
  UpdateRequestPayloadTooLargeError,
  UpdateRequestUnsupportedMediaTypeError,
  isSameOriginRequest,
  parseUpdateRequestBody,
  validateUpdateRequestPayload,
  verifyTurnstile,
} from './updateRequests.ts';

test('the versioned email consent record is complete and readable', () => {
  assert.equal(
    UPDATE_REQUEST_CONSENT.text,
    'Yes, please send me weekly emails and occasional important or community updates from Kehilat Ohr HaTorah. Email frequency may vary, and I can unsubscribe at any time. I agree to the Terms and Conditions (effective August 20, 2026) and acknowledge the Privacy Notice.',
  );
});

const validPayload = {
  submissionId: '550e8400-e29b-41d4-a716-446655440000',
  firstName: '  Miriam  ',
  lastName: ' Cohen ',
  email: 'Miriam.Cohen@example.com',
  phone: ' (714) 555-0100 ',
  consent: true,
  website: '',
  turnstileToken: 'verified-token',
};

test('update request validation requires identity, contact, consent, and Turnstile', () => {
  assert.deepEqual(validateUpdateRequestPayload(validPayload), {
    ok: true,
    bot: false,
    value: {
      submissionId: validPayload.submissionId,
      firstName: 'Miriam',
      lastName: 'Cohen',
      email: 'miriam.cohen@example.com',
      phone: '(714) 555-0100',
      turnstileToken: 'verified-token',
    },
  });

  const result = validateUpdateRequestPayload({});
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.fields, ['firstName', 'lastName', 'email', 'consent', 'turnstileToken']);
  }
});

test('update request validation supports progressive form field aliases', () => {
  const result = validateUpdateRequestPayload({
    submission_id: validPayload.submissionId,
    first_name: 'Miriam',
    last_name: 'Cohen',
    email: 'miriam@example.com',
    phone: '',
    email_consent: 'on',
    botcheck: '',
    'cf-turnstile-response': 'verified-token',
  });

  assert.equal(result.ok, true);
  if (result.ok && !result.bot) assert.equal(result.value.phone, null);
});

test('a filled honeypot receives a generic accepted path without validating personal data', () => {
  assert.deepEqual(validateUpdateRequestPayload({ website: 'https://spam.example' }), {
    ok: true,
    bot: true,
  });
});

test('invalid field shapes and control characters are rejected', () => {
  const result = validateUpdateRequestPayload({
    ...validPayload,
    firstName: 'A\nB',
    email: 'not-an-email',
    phone: 'x'.repeat(41),
    consent: false,
    submissionId: 'not-a-uuid',
  });

  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.fields, ['firstName', 'email', 'phone', 'consent', 'submissionId']);
  }
});

test('body parsing accepts JSON and both browser form encodings', async () => {
  const jsonRequest = new Request('https://example.test/api/update-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validPayload),
  });
  assert.equal((await parseUpdateRequestBody(jsonRequest)).email, validPayload.email);

  const encodedRequest = new Request('https://example.test/api/update-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ firstName: 'Miriam', consent: 'on' }),
  });
  assert.deepEqual(await parseUpdateRequestBody(encodedRequest), {
    firstName: 'Miriam',
    consent: 'on',
  });

  const formData = new FormData();
  formData.set('firstName', 'Miriam');
  formData.set('consent', 'on');
  const multipartRequest = new Request('https://example.test/api/update-requests', {
    method: 'POST',
    body: formData,
  });
  assert.deepEqual(await parseUpdateRequestBody(multipartRequest), {
    firstName: 'Miriam',
    consent: 'on',
  });
});

test('body parsing rejects unsupported, malformed, and over-limit requests', async () => {
  await assert.rejects(
    parseUpdateRequestBody(new Request('https://example.test/api/update-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: 'no',
    })),
    UpdateRequestUnsupportedMediaTypeError,
  );

  await assert.rejects(
    parseUpdateRequestBody(new Request('https://example.test/api/update-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    })),
    UpdateRequestMalformedBodyError,
  );

  await assert.rejects(
    parseUpdateRequestBody(new Request('https://example.test/api/update-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'x'.repeat(MAX_UPDATE_REQUEST_BODY_BYTES + 1),
    })),
    UpdateRequestPayloadTooLargeError,
  );
});

test('same-origin validation rejects cross-site and originless scripted requests', () => {
  assert.equal(isSameOriginRequest(new Request('https://example.test/api/update-requests', {
    headers: { Origin: 'https://example.test', 'Sec-Fetch-Site': 'same-origin' },
  })), true);
  assert.equal(isSameOriginRequest(new Request('https://example.test/api/update-requests', {
    headers: { Origin: 'https://attacker.test', 'Sec-Fetch-Site': 'cross-site' },
  })), false);
  assert.equal(isSameOriginRequest(new Request('https://example.test/api/update-requests')), false);
});

test('Turnstile verification enforces success, exact hostname, and action', async () => {
  const seenBodies: URLSearchParams[] = [];
  const accepted = await verifyTurnstile({
    secret: 'test-secret',
    token: 'test-token',
    idempotencyKey: validPayload.submissionId,
    expectedHostname: TURNSTILE_EXPECTED_HOSTNAME,
    fetchImpl: async (_input, init) => {
      seenBodies.push(new URLSearchParams(init?.body as string));
      return Response.json({
        success: true,
        hostname: TURNSTILE_EXPECTED_HOSTNAME,
        action: TURNSTILE_EXPECTED_ACTION,
      });
    },
  });
  assert.equal(accepted, true);
  assert.equal(seenBodies[0].get('idempotency_key'), validPayload.submissionId);
  assert.equal(seenBodies[0].has('remoteip'), false);

  for (const verification of [
    { success: false, hostname: TURNSTILE_EXPECTED_HOSTNAME, action: TURNSTILE_EXPECTED_ACTION },
    { success: true, hostname: 'wrong.example', action: TURNSTILE_EXPECTED_ACTION },
    { success: true, hostname: TURNSTILE_EXPECTED_HOSTNAME, action: 'wrong_action' },
  ]) {
    assert.equal(await verifyTurnstile({
      secret: 'test-secret',
      token: 'test-token',
      idempotencyKey: validPayload.submissionId,
      expectedHostname: TURNSTILE_EXPECTED_HOSTNAME,
      fetchImpl: async () => Response.json(verification),
    }), false);
  }
});
