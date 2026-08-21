import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../pages/api/giving-record-requests.ts';
import {
  DONOR_RECORD_REQUEST_CONFIRMATION,
  DONOR_RECORD_REQUEST_TURNSTILE_ACTION,
} from './givingRecordRequests.ts';
import { TURNSTILE_EXPECTED_HOSTNAME } from './updateRequests.ts';

const endpointUrl = `https://${TURNSTILE_EXPECTED_HOSTNAME}/api/giving-record-requests`;
const submissionId = '550e8400-e29b-41d4-a716-446655440000';

function jsonRequest(payload: Record<string, unknown>, origin = `https://${TURNSTILE_EXPECTED_HOSTNAME}`): Request {
  return new Request(endpointUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: origin,
      'Sec-Fetch-Site': origin.includes(TURNSTILE_EXPECTED_HOSTNAME) ? 'same-origin' : 'cross-site',
    },
    body: JSON.stringify(payload),
  });
}

const validPayload = {
  submissionId,
  requestType: 'acknowledgment',
  recordName: 'Miriam Cohen',
  email: 'miriam@example.com',
  contributionDate: '2026-08-20',
  amountText: '$36.00 USD',
  paymentMethod: 'zelle',
  reference: 'ZELLE-123',
  goodsServices: 'no',
  reviewDetails: '',
  confirmation: true,
  website: '',
  turnstileToken: 'verified-token',
};

test('durably writes a donor request and outbox before enqueueing an identifier-only message', async () => {
  const prepared: Array<{ sql: string; values?: unknown[] }> = [];
  const enqueued: unknown[] = [];
  const eventOrder: string[] = [];
  const formDb = {
    prepare(sql: string) {
      const statement = { sql } as { sql: string; values?: unknown[] };
      prepared.push(statement);
      return {
        bind(...values: unknown[]) {
          statement.values = values;
          return statement;
        },
      };
    },
    async batch(statements: unknown[]) {
      eventOrder.push('batch');
      assert.equal(statements.length, 2);
      return [{ success: true }, { success: true }];
    },
  };
  const queue = {
    async send(message: unknown) {
      eventOrder.push('queue');
      enqueued.push(message);
    },
  };

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: true,
    hostname: TURNSTILE_EXPECTED_HOSTNAME,
    action: DONOR_RECORD_REQUEST_TURNSTILE_ACTION,
  });

  try {
    const response = await POST({
      request: jsonRequest(validPayload),
      locals: {
        runtime: {
          env: {
            FORM_DB: formDb,
            UPDATE_REQUEST_QUEUE: queue,
            TURNSTILE_SECRET_KEY: 'test-secret',
          },
        },
      },
    } as never);

    assert.equal(response.status, 202);
    assert.deepEqual(eventOrder, ['batch', 'queue']);
    assert.match(prepared[0].sql, /INSERT INTO donor_record_requests/);
    assert.match(prepared[0].sql, /ON CONFLICT\(id\) DO NOTHING/);
    assert.equal(prepared[0].values?.[10], DONOR_RECORD_REQUEST_CONFIRMATION);
    assert.match(prepared[1].sql, /INSERT INTO donor_record_request_outbox/);
    assert.deepEqual(enqueued, [{
      version: 2,
      type: 'donor_record_request',
      outboxId: `donor-outbox:${submissionId}`,
    }]);
    assert.doesNotMatch(JSON.stringify(enqueued), /Miriam|miriam@example|ZELLE-123|36\.00/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('silently accepts a honeypot without touching protected services', async () => {
  const response = await POST({
    request: jsonRequest({ website: 'spam.example' }),
    locals: { runtime: { env: {} } },
  } as never);

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Your giving record request was received.',
  });
});

test('rejects cross-origin and invalid Turnstile action before persistence', async () => {
  assert.equal((await POST({
    request: jsonRequest(validPayload, 'https://attacker.example'),
    locals: {},
  } as never)).status, 403);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: true,
    hostname: TURNSTILE_EXPECTED_HOSTNAME,
    action: 'updates_request',
  });
  try {
    const response = await POST({
      request: jsonRequest(validPayload),
      locals: {
        runtime: {
          env: {
            FORM_DB: { batch: () => assert.fail('must not persist failed Turnstile') },
            UPDATE_REQUEST_QUEUE: { send: () => assert.fail('must not enqueue failed Turnstile') },
            TURNSTILE_SECRET_KEY: 'test-secret',
          },
        },
      },
    } as never);
    assert.equal(response.status, 403);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('returns field errors before persistence and preserves the non-JavaScript redirect', async () => {
  const invalid = await POST({
    request: jsonRequest({ ...validPayload, confirmation: false }),
    locals: { runtime: { env: {} } },
  } as never);
  assert.equal(invalid.status, 400);
  assert.deepEqual((await invalid.json()).fields, ['confirmation']);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: true,
    hostname: TURNSTILE_EXPECTED_HOSTNAME,
    action: DONOR_RECORD_REQUEST_TURNSTILE_ACTION,
  });
  try {
    const htmlRequest = new Request(endpointUrl, {
      method: 'POST',
      headers: {
        Accept: 'text/html',
        'Content-Type': 'application/x-www-form-urlencoded',
        Origin: `https://${TURNSTILE_EXPECTED_HOSTNAME}`,
        'Sec-Fetch-Site': 'same-origin',
      },
      body: new URLSearchParams(Object.entries(validPayload).map(([key, value]) => [key, String(value)])),
    });
    const response = await POST({
      request: htmlRequest,
      locals: {
        runtime: {
          env: {
            FORM_DB: {
              prepare: () => ({ bind: () => ({}) }),
              batch: async () => [{ success: true }, { success: true }],
            },
            UPDATE_REQUEST_QUEUE: { send: async () => undefined },
            TURNSTILE_SECRET_KEY: 'test-secret',
          },
        },
      },
    } as never);
    assert.equal(response.status, 303);
    assert.equal(response.headers.get('Location'), '/donate?giving=requested#giving-records');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
