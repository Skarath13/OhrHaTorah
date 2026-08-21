import assert from "node:assert/strict";
import test from "node:test";

import {
  buildDonorRecordNotificationEmail,
  buildNotificationEmail,
  classifyEmailError,
  escapeHtml,
  isValidDonorRecordRequest,
  parseQueueMessage,
  processOutboxMessage,
  type DonorRecordRequestRecord,
  type NotificationRequestRecord,
  type NotifierDependencies,
  type OutboxRepository,
  type TransactionalEmailClient,
  type UpdateRequestRecord,
} from "./index.ts";

const REQUEST_ID = "47bf646a-bd12-4db1-b10c-d9778ec9c523";
const OUTBOX_ID = `outbox:${REQUEST_ID}`;
const DONOR_OUTBOX_ID = `donor-outbox:${REQUEST_ID}`;
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

function validDonorRequest(
  overrides: Partial<DonorRecordRequestRecord> = {},
): DonorRecordRequestRecord {
  return {
    id: REQUEST_ID,
    requestType: "acknowledgment",
    recordName: "Ada Lovelace",
    email: "ada@example.com",
    contributionDate: "2026-08-01",
    amountText: "$180.00 USD",
    paymentMethod: "zelle",
    reference: "Bank reference 1234",
    goodsServices: "no",
    reviewDetails: null,
    confirmationText:
      "I confirm these details are accurate and understand this is a records request.",
    confirmedAt: "2026-08-12T19:59:58.000Z",
    source: "website_donate",
    createdAt: "2026-08-12T19:59:58.000Z",
    status: "pending",
    matchNotes: null,
    acknowledgmentIssuedAt: null,
    ...overrides,
  };
}

function createHarness(options: {
  claim?: Awaited<ReturnType<OutboxRepository["claim"]>>;
  request?: NotificationRequestRecord | null;
  outboxId?: string;
  emailError?: unknown;
  emailResult?: { messageId: string };
} = {}) {
  const outboxId = options.outboxId ?? OUTBOX_ID;
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
          row: { outboxId, requestId: REQUEST_ID, attempt: 1 },
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

test("parses both versioned deterministic outbox message contracts", () => {
  assert.deepEqual(parseQueueMessage({ version: 1, outboxId: OUTBOX_ID }), {
    version: 1,
    outboxId: OUTBOX_ID,
  });
  assert.deepEqual(
    parseQueueMessage({
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
    }),
    {
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
    },
  );
  assert.equal(
    parseQueueMessage({ version: 2, type: "donor_record_request", outboxId: OUTBOX_ID }),
    null,
  );
  assert.equal(parseQueueMessage({ version: 2, outboxId: DONOR_OUTBOX_ID }), null);
  assert.equal(
    parseQueueMessage({ version: 2, type: "update_request", outboxId: DONOR_OUTBOX_ID }),
    null,
  );
  assert.equal(
    parseQueueMessage({
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
      email: "must-not-be-in-queue@example.com",
    }),
    null,
  );
  assert.equal(parseQueueMessage({ version: 1, outboxId: REQUEST_ID }), null);
  assert.equal(parseQueueMessage({ version: 1, outboxId: `${OUTBOX_ID}\nBcc: bad@example.com` }), null);
  assert.equal(
    parseQueueMessage({
      version: 2,
      type: "donor_record_request",
      outboxId: `${DONOR_OUTBOX_ID}\nBcc: bad@example.com`,
    }),
    null,
  );
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

test("builds a fixed-header donor notification, escapes details, and keeps PII out of the subject", () => {
  const email = buildDonorRecordNotificationEmail(
    validDonorRequest({
      recordName: '<Ada & "Co">',
      reviewDetails: "Please check <script>alert('x')</script> & correct it.",
    }),
    DONOR_OUTBOX_ID,
  );

  assert.equal(email.to, "ohrhatorahoc2@gmail.com");
  assert.deepEqual(email.from, {
    email: "admin@ohrhatorahoc.org",
    name: "Kehilat Ohr HaTorah Website",
  });
  assert.equal(email.replyTo, "ada@example.com");
  assert.equal(email.subject, "[STAGING] New donor record request");
  assert.doesNotMatch(email.subject, /Ada|example\.com|180|2026-08-01/i);
  assert.match(email.text, /Amount supplied: \$180\.00 USD/);
  assert.match(email.text, new RegExp(REQUEST_ID));
  assert.match(email.html, /&lt;Ada &amp; &quot;Co&quot;&gt;/);
  assert.match(email.html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt; &amp; correct it\./);
  assert.doesNotMatch(email.html, /<script>/);
  assert.match(email.text, /not itself proof of a contribution/i);
});

test("validates donor records and the conditional review-details requirement", () => {
  assert.equal(isValidDonorRecordRequest(validDonorRequest()), true);
  assert.equal(
    isValidDonorRecordRequest(
      validDonorRequest({ requestType: "correction", reviewDetails: null }),
    ),
    false,
  );
  assert.equal(
    isValidDonorRecordRequest(
      validDonorRequest({ goodsServices: "yes_or_unsure", reviewDetails: null }),
    ),
    false,
  );
  assert.equal(
    isValidDonorRecordRequest(
      validDonorRequest({
        requestType: "correction",
        goodsServices: "yes_or_unsure",
        reviewDetails: "The amount needs review.",
      }),
    ),
    true,
  );
  assert.equal(
    isValidDonorRecordRequest(validDonorRequest({ contributionDate: "2026-02-31" })),
    false,
  );
  assert.equal(isValidDonorRecordRequest(validDonorRequest({ amountText: "180.00" })), true);
  assert.equal(
    isValidDonorRecordRequest(validDonorRequest({ amountText: "180.00\nUSD" })),
    false,
  );
  assert.equal(
    isValidDonorRecordRequest(validDonorRequest({ recordName: "Ada\nLovelace" })),
    false,
  );
  assert.equal(
    isValidDonorRecordRequest(validDonorRequest({ reference: "ref\r\nBcc: bad@example.com" })),
    false,
  );
  assert.equal(
    isValidDonorRecordRequest(validDonorRequest({ reviewDetails: "review\u0000details" })),
    false,
  );
});

test("delivers a valid request and records only the provider message ID", async () => {
  const { calls, dependencies } = createHarness();
  const decision = await processOutboxMessage({ version: 1, outboxId: OUTBOX_ID }, 1, dependencies);

  assert.deepEqual(decision, { action: "ack", outcome: "delivered", outboxId: OUTBOX_ID });
  assert.equal(calls.sent.length, 1);
  assert.deepEqual(calls.delivered, ["message-123"]);
  assert.deepEqual(calls.failed, []);
});

test("delivers a valid donor record request through the v2 contract", async () => {
  const { calls, dependencies } = createHarness({
    request: validDonorRequest(),
    outboxId: DONOR_OUTBOX_ID,
  });
  const decision = await processOutboxMessage(
    {
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
    },
    1,
    dependencies,
  );

  assert.deepEqual(decision, {
    action: "ack",
    outcome: "delivered",
    outboxId: DONOR_OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 1);
  assert.equal(calls.sent[0]?.replyTo, "ada@example.com");
  assert.equal(calls.sent[0]?.subject, "[STAGING] New donor record request");
  assert.deepEqual(calls.delivered, ["message-123"]);
  assert.deepEqual(calls.failed, []);
});

test("marks an invalid donor record dead without sending", async () => {
  const { calls, dependencies } = createHarness({
    request: validDonorRequest({ email: "ada@example.com\r\nBcc: bad@example.com" }),
    outboxId: DONOR_OUTBOX_ID,
  });
  const decision = await processOutboxMessage(
    {
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
    },
    1,
    dependencies,
  );

  assert.deepEqual(decision, {
    action: "ack",
    outcome: "invalid-record",
    errorCode: "E_INVALID_RECORD",
    outboxId: DONOR_OUTBOX_ID,
  });
  assert.equal(calls.sent.length, 0);
  assert.deepEqual(calls.failed, [{ code: "E_INVALID_RECORD", dead: true }]);
});

test("rejects a v2 message paired with a legacy request record", async () => {
  const { calls, dependencies } = createHarness({
    request: validRequest(),
    outboxId: DONOR_OUTBOX_ID,
  });
  const decision = await processOutboxMessage(
    {
      version: 2,
      type: "donor_record_request",
      outboxId: DONOR_OUTBOX_ID,
    },
    1,
    dependencies,
  );

  assert.equal(decision.action, "ack");
  assert.equal(decision.outcome, "invalid-record");
  assert.equal(calls.sent.length, 0);
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
