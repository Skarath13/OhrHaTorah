import assert from "node:assert/strict";
import test from "node:test";

import {
  buildNotificationEmail,
  classifyEmailError,
  escapeHtml,
  parseQueueMessage,
  processOutboxMessage,
  type NotifierDependencies,
  type OutboxRepository,
  type TransactionalEmailClient,
  type UpdateRequestRecord,
} from "./index.ts";

const REQUEST_ID = "47bf646a-bd12-4db1-b10c-d9778ec9c523";
const OUTBOX_ID = `outbox:${REQUEST_ID}`;
const NOW = new Date("2026-08-12T20:00:00.000Z");

function validRequest(overrides: Partial<UpdateRequestRecord> = {}): UpdateRequestRecord {
  return {
    id: REQUEST_ID,
    firstName: "Ada",
    lastName: "Lovelace",
    email: "ada@example.com",
    phone: "+1 (714) 555-0123",
    consentText: "I would like to receive occasional email updates.",
    consentedAt: "2026-08-12T19:59:58.000Z",
    source: "website_footer",
    createdAt: "2026-08-12T19:59:58.000Z",
    ...overrides,
  };
}

function createHarness(options: {
  claim?: Awaited<ReturnType<OutboxRepository["claim"]>>;
  request?: UpdateRequestRecord | null;
  emailError?: unknown;
  emailResult?: { messageId: string };
} = {}) {
  const calls = {
    sent: [] as Parameters<TransactionalEmailClient["send"]>[0][],
    delivered: [] as string[],
    failed: [] as Array<{ code: string; dead: boolean }>,
  };

  const outbox: OutboxRepository = {
    async claim() {
      return (
        options.claim ?? {
          kind: "claimed",
          row: { outboxId: OUTBOX_ID, requestId: REQUEST_ID, attempt: 1 },
        }
      );
    },
    async getRequest() {
      return options.request === undefined ? validRequest() : options.request;
    },
    async markDelivered(_outboxId, _leaseToken, providerMessageId) {
      calls.delivered.push(providerMessageId);
    },
    async markFailed(_outboxId, _leaseToken, errorCode, _nowIso, dead) {
      calls.failed.push({ code: errorCode, dead });
    },
  };

  const email: TransactionalEmailClient = {
    async send(message) {
      calls.sent.push(message);
      if (options.emailError !== undefined) throw options.emailError;
      return options.emailResult ?? { messageId: "message-123" };
    },
  };

  const dependencies: NotifierDependencies = {
    outbox,
    email,
    now: () => NOW,
    createLeaseToken: () => "lease-123",
  };

  return { calls, dependencies };
}

test("parses only the versioned deterministic outbox message contract", () => {
  assert.deepEqual(parseQueueMessage({ version: 1, outboxId: OUTBOX_ID }), {
    version: 1,
    outboxId: OUTBOX_ID,
  });
  assert.equal(parseQueueMessage({ version: 2, outboxId: OUTBOX_ID }), null);
  assert.equal(parseQueueMessage({ version: 1, outboxId: REQUEST_ID }), null);
  assert.equal(parseQueueMessage({ version: 1, outboxId: `${OUTBOX_ID}\nBcc: bad@example.com` }), null);
});

test("escapes every HTML control character", () => {
  assert.equal(escapeHtml(`<>&"'`), "&lt;&gt;&amp;&quot;&#39;");
});

test("builds a fixed-header, dual-part notification and escapes visitor data", () => {
  const email = buildNotificationEmail(
    validRequest({ firstName: "<Ada>", lastName: "& Co.", phone: null }),
    OUTBOX_ID,
  );

  assert.equal(email.to, "drburton369@gmail.com");
  assert.deepEqual(email.from, {
    email: "admin@ohrhatorahoc.org",
    name: "Kehilat Ohr HaTorah Website",
  });
  assert.equal(email.replyTo, "ada@example.com");
  assert.equal(email.subject, "[STAGING] New Kehilat Ohr HaTorah website update request");
  assert.doesNotMatch(email.subject, /Ada|example\.com/i);
  assert.match(email.text, new RegExp(REQUEST_ID));
  assert.match(email.text, /Phone: Not provided/);
  assert.match(email.html, /&lt;Ada&gt; &amp; Co\./);
  assert.doesNotMatch(email.html, /<Ada>/);
});

test("delivers a valid request and records only the provider message ID", async () => {
  const { calls, dependencies } = createHarness();
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 1, dependencies);

  assert.deepEqual(decision, { action: "ack", outcome: "delivered", outboxId: OUTBOX_ID });
  assert.equal(calls.sent.length, 1);
  assert.deepEqual(calls.delivered, ["message-123"]);
  assert.deepEqual(calls.failed, []);
});

test("acknowledges a terminal outbox without another send", async () => {
  const { calls, dependencies } = createHarness({
    claim: { kind: "terminal", status: "delivered" },
  });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 2, dependencies);

  assert.deepEqual(decision, {
    action: "ack",
    outcome: "already-terminal",
    outboxId: OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 0);
});

test("retries a busy lease after the lease expires", async () => {
  const { calls, dependencies } = createHarness({
    claim: { kind: "busy", leaseExpiresAt: "2026-08-12T20:02:00.000Z" },
  });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 2, dependencies);

  assert.deepEqual(decision, {
    action: "retry",
    outcome: "busy",
    delaySeconds: 121,
    errorCode: "E_LEASE_BUSY",
    outboxId: OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 0);
});

test("retries an unexpected outbox state instead of discarding work", async () => {
  const { calls, dependencies } = createHarness({ claim: { kind: "invalid-state" } });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 1, dependencies);

  assert.deepEqual(decision, {
    action: "retry",
    outcome: "transient-failure",
    delaySeconds: 60,
    errorCode: "E_INVALID_OUTBOX_STATE",
    outboxId: OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 0);
});

test("classifies documented transient and permanent email errors", () => {
  assert.deepEqual(classifyEmailError({ code: "E_RATE_LIMIT_EXCEEDED" }), {
    code: "E_RATE_LIMIT_EXCEEDED",
    retryable: true,
  });
  assert.deepEqual(classifyEmailError({ code: "E_SENDER_NOT_VERIFIED" }), {
    code: "E_SENDER_NOT_VERIFIED",
    retryable: false,
  });
  assert.deepEqual(classifyEmailError(new Error("private provider detail")), {
    code: "E_UNKNOWN",
    retryable: true,
  });
});

test("persists a transient error code and retries with backoff", async () => {
  const { calls, dependencies } = createHarness({
    emailError: { code: "E_INTERNAL_SERVER_ERROR", message: "private provider detail" },
  });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 3, dependencies);

  assert.deepEqual(decision, {
    action: "retry",
    outcome: "transient-failure",
    delaySeconds: 540,
    errorCode: "E_INTERNAL_SERVER_ERROR",
    outboxId: OUTBOX_ID,
  });
  assert.deepEqual(calls.failed, [{ code: "E_INTERNAL_SERVER_ERROR", dead: false }]);
});

test("marks a permanent provider failure dead and acknowledges it", async () => {
  const { calls, dependencies } = createHarness({
    emailError: { code: "E_RECIPIENT_NOT_ALLOWED", message: "private provider detail" },
  });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 1, dependencies);

  assert.deepEqual(decision, {
    action: "ack",
    outcome: "permanent-failure",
    errorCode: "E_RECIPIENT_NOT_ALLOWED",
    outboxId: OUTBOX_ID,
  });
  assert.deepEqual(calls.failed, [{ code: "E_RECIPIENT_NOT_ALLOWED", dead: true }]);
});

test("rejects a control-character Reply-To before sending", async () => {
  const { calls, dependencies } = createHarness({
    request: validRequest({ email: "ada@example.com\r\nBcc: bad@example.com" }),
  });
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 1, dependencies);

  assert.deepEqual(decision, {
    action: "ack",
    outcome: "invalid-record",
    errorCode: "E_INVALID_RECORD",
    outboxId: OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 0);
  assert.deepEqual(calls.failed, [{ code: "E_INVALID_RECORD", dead: true }]);
});
