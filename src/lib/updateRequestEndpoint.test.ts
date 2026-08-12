import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../pages/api/update-requests.ts';
import { TURNSTILE_EXPECTED_ACTION, TURNSTILE_EXPECTED_HOSTNAME } from './updateRequests.ts';

const endpointUrl = `https://${TURNSTILE_EXPECTED_HOSTNAME}/api/update-requests`;
const submissionId = '550e8400-e29b-41d4-a716-446655440000';

function jsonRequest(payload: Record<string, unknown>): Request {
  return new Request(endpointUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Origin: `https://${TURNSTILE_EXPECTED_HOSTNAME}`,
      'Sec-Fetch-Site': 'same-origin',
    },
    body: JSON.stringify(payload),
  });
}

const validPayload = {
  submissionId,
  firstName: 'Miriam',
  lastName: 'Cohen',
  email: 'miriam@example.com',
  phone: '',
  consent: true,
  website: '',
  turnstileToken: 'verified-token',
};

test('endpoint durably writes request and outbox before enqueueing an identifier-only message', async () => {
  const prepared: Array<{ sql: string; values?: unknown[] }> = [];
  const enqueued: unknown[] = [];
  const eventOrder: string[] = [];
  const formDb = {
    prepare(sql: string) {
      const statement = { sql };
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
    action: TURNSTILE_EXPECTED_ACTION,
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
    assert.match(prepared[0].sql, /INSERT INTO update_requests/);
    assert.match(prepared[0].sql, /ON CONFLICT\(id\) DO NOTHING/);
    assert.match(prepared[1].sql, /INSERT INTO update_request_outbox/);
    assert.match(prepared[1].sql, /ON CONFLICT\(id\) DO NOTHING/);
    assert.deepEqual(enqueued, [{ version: 1, outboxId: `outbox:${submissionId}` }]);
    assert.doesNotMatch(JSON.stringify(enqueued), /Miriam|Cohen|miriam@example\.com/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('endpoint silently accepts a honeypot without touching protected services', async () => {
  const response = await POST({
    request: jsonRequest({ website: 'spam.example' }),
    locals: { runtime: { env: {} } },
  } as never);

  assert.equal(response.status, 202);
  assert.deepEqual(await response.json(), {
    success: true,
    message: 'Your update request was received.',
  });
});

test('endpoint rejects cross-origin and failed Turnstile requests before persistence', async () => {
  const crossOrigin = new Request(endpointUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: 'https://attacker.example',
      'Sec-Fetch-Site': 'cross-site',
    },
    body: JSON.stringify(validPayload),
  });
  assert.equal((await POST({ request: crossOrigin, locals: {} } as never)).status, 403);

  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json({
    success: true,
    hostname: 'wrong.example',
    action: TURNSTILE_EXPECTED_ACTION,
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
