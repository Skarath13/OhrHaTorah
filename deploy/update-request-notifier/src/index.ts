const UPDATE_REQUEST_QUEUE_MESSAGE_VERSION = 1;
const DONOR_RECORD_QUEUE_MESSAGE_VERSION = 2;
const LEASE_DURATION_MS = 5 * 60 * 1000;
const UPDATE_REQUEST_DESTINATION = "drburton369@gmail.com";
const DONOR_RECORD_DESTINATION = "ohrhatorahoc2@gmail.com";
const FIXED_SENDER = "admin@ohrhatorahoc.org";
const SENDER_NAME = "Kehilat Ohr HaTorah Website";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const OUTBOX_ID_PATTERN =
  /^outbox:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DONOR_OUTBOX_ID_PATTERN =
  /^donor-outbox:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/;
const CONTRIBUTION_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const TRANSIENT_EMAIL_ERROR_CODES = new Set([
  "E_DAILY_LIMIT_EXCEEDED",
  "E_DELIVERY_FAILED",
  "E_INTERNAL_SERVER_ERROR",
  "E_RATE_LIMIT_EXCEEDED",
]);

const PERMANENT_EMAIL_ERROR_CODES = new Set([
  "E_CONTENT_TOO_LARGE",
  "E_FIELD_MISSING",
  "E_HEADER_NAME_INVALID",
  "E_HEADER_NOT_ALLOWED",
  "E_HEADERS_TOO_LARGE",
  "E_HEADERS_TOO_MANY",
  "E_HEADER_USE_API_FIELD",
  "E_HEADER_VALUE_INVALID",
  "E_HEADER_VALUE_TOO_LONG",
  "E_RECIPIENT_NOT_ALLOWED",
  "E_RECIPIENT_SUPPRESSED",
  "E_SENDER_DOMAIN_NOT_AVAILABLE",
  "E_SENDER_NOT_VERIFIED",
  "E_TOO_MANY_ATTACHMENTS",
  "E_TOO_MANY_RECIPIENTS",
  "E_VALIDATION_ERROR",
]);

export interface UpdateRequestQueueMessage {
  version: 1;
  outboxId: string;
}

export interface DonorRecordRequestQueueMessage {
  version: 2;
  type: "donor_record_request";
  outboxId: string;
}

export type NotificationQueueMessage =
  | UpdateRequestQueueMessage
  | DonorRecordRequestQueueMessage;

export interface UpdateRequestRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  consentText: string;
  consentedAt: string;
  source: string;
  createdAt: string;
}

export interface DonorRecordRequestRecord {
  id: string;
  requestType: "acknowledgment" | "correction";
  recordName: string;
  email: string;
  contributionDate: string;
  amountText: string;
  paymentMethod: "zelle" | "paypal" | "check" | "other";
  reference: string | null;
  goodsServices: "no" | "yes_or_unsure";
  reviewDetails: string | null;
  confirmationText: string;
  confirmedAt: string;
  source: string;
  createdAt: string;
  status: "pending" | "matched" | "needs_review" | "completed";
  matchNotes: string | null;
  acknowledgmentIssuedAt: string | null;
}

export type NotificationRequestRecord =
  | UpdateRequestRecord
  | DonorRecordRequestRecord;

export interface NotificationEmail {
  to: string;
  from: {
    email: string;
    name: string;
  };
  replyTo: string;
  subject: string;
  text: string;
  html: string;
}

interface ClaimedOutbox {
  outboxId: string;
  requestId: string;
  attempt: number;
}

type ClaimResult =
  | { kind: "claimed"; row: ClaimedOutbox }
  | { kind: "busy"; leaseExpiresAt: string | null }
  | { kind: "terminal"; status: "dead" | "delivered" }
  | { kind: "missing" }
  | { kind: "invalid-state" };

export interface OutboxRepository {
  claim(
    outboxId: string,
    leaseToken: string,
    nowIso: string,
    leaseExpiresIso: string,
  ): Promise<ClaimResult>;
  getRequest(requestId: string): Promise<NotificationRequestRecord | null>;
  markDelivered(
    outboxId: string,
    leaseToken: string,
    providerMessageId: string,
    nowIso: string,
  ): Promise<void>;
  markFailed(
    outboxId: string,
    leaseToken: string,
    errorCode: string,
    nowIso: string,
    dead: boolean,
  ): Promise<void>;
}

export interface TransactionalEmailClient {
  send(message: NotificationEmail): Promise<{ messageId: string }>;
}

export interface NotifierDependencies {
  outbox: OutboxRepository;
  email: TransactionalEmailClient;
  now(): Date;
  createLeaseToken(): string;
}

export type ProcessingDecision =
  | {
      action: "ack";
      outcome:
        | "already-terminal"
        | "delivered"
        | "invalid-message"
        | "invalid-record"
        | "missing-outbox"
        | "missing-request"
        | "permanent-failure";
      errorCode?: string;
      outboxId?: string;
    }
  | {
      action: "retry";
      outcome: "busy" | "transient-failure";
      delaySeconds: number;
      errorCode: string;
      outboxId?: string;
    };

type RawRequestRow = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  consent_text: string;
  consented_at: string;
  source: string;
  created_at: string;
};

type RawDonorRecordRequestRow = {
  id: string;
  request_type: DonorRecordRequestRecord["requestType"];
  record_name: string;
  email: string;
  contribution_date: string;
  amount_text: string;
  payment_method: DonorRecordRequestRecord["paymentMethod"];
  reference: string | null;
  goods_services: DonorRecordRequestRecord["goodsServices"];
  review_details: string | null;
  confirmation_text: string;
  confirmed_at: string;
  source: string;
  created_at: string;
  status: DonorRecordRequestRecord["status"];
  match_notes: string | null;
  acknowledgment_issued_at: string | null;
};

type RawClaimedOutboxRow = {
  id: string;
  request_id: string;
  attempts: number;
};

type RawOutboxState = {
  status: string;
  lease_expires_at: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseQueueMessage(value: unknown): NotificationQueueMessage | null {
  if (!isRecord(value)) return null;
  if (value.version === UPDATE_REQUEST_QUEUE_MESSAGE_VERSION) {
    if (typeof value.outboxId !== "string" || !OUTBOX_ID_PATTERN.test(value.outboxId)) {
      return null;
    }

    return { version: UPDATE_REQUEST_QUEUE_MESSAGE_VERSION, outboxId: value.outboxId };
  }

  if (value.version === DONOR_RECORD_QUEUE_MESSAGE_VERSION) {
    const keys = Object.keys(value);
    if (
      keys.length !== 3 ||
      keys.some((key) => key !== "version" && key !== "type" && key !== "outboxId")
    ) {
      return null;
    }
    if (value.type !== "donor_record_request") return null;
    if (typeof value.outboxId !== "string" || !DONOR_OUTBOX_ID_PATTERN.test(value.outboxId)) {
      return null;
    }

    return {
      version: DONOR_RECORD_QUEUE_MESSAGE_VERSION,
      type: "donor_record_request",
      outboxId: value.outboxId,
    };
  }

  return null;
}

function isBoundedText(value: string, maximumLength: number): boolean {
  return value.length > 0 && value.length <= maximumLength;
}

function isNonBlankBoundedText(value: string, maximumLength: number): boolean {
  return value.trim().length > 0 && Array.from(value).length <= maximumLength;
}

function isSingleLineBoundedText(value: string, maximumLength: number): boolean {
  return (
    isNonBlankBoundedText(value, maximumLength) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isValidEmail(value: string): boolean {
  return (
    isBoundedText(value, 254) &&
    EMAIL_PATTERN.test(value) &&
    !/[\u0000-\u001f\u007f]/.test(value)
  );
}

function isValidIsoDate(value: string): boolean {
  if (!CONTRIBUTION_DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export function isValidUpdateRequest(record: UpdateRequestRecord): boolean {
  if (!UUID_PATTERN.test(record.id)) return false;
  if (!isBoundedText(record.firstName, 80)) return false;
  if (!isBoundedText(record.lastName, 80)) return false;
  if (!isBoundedText(record.email, 254) || !EMAIL_PATTERN.test(record.email)) return false;
  if (/[\u0000-\u001f\u007f]/.test(record.email)) return false;
  if (record.phone !== null && record.phone.length > 40) return false;
  if (!isBoundedText(record.consentText, 500)) return false;
  if (record.source !== "website_footer") return false;
  if (!Number.isFinite(Date.parse(record.consentedAt))) return false;
  if (!Number.isFinite(Date.parse(record.createdAt))) return false;
  return true;
}

export function isValidDonorRecordRequest(record: DonorRecordRequestRecord): boolean {
  if (!UUID_PATTERN.test(record.id)) return false;
  if (!isSingleLineBoundedText(record.recordName, 160)) return false;
  if (!isValidEmail(record.email)) return false;
  if (!isValidIsoDate(record.contributionDate)) return false;
  if (!isSingleLineBoundedText(record.amountText, 40)) return false;
  if (!["acknowledgment", "correction"].includes(record.requestType)) return false;
  if (!["zelle", "paypal", "check", "other"].includes(record.paymentMethod)) return false;
  if (record.reference !== null && !isSingleLineBoundedText(record.reference, 120)) return false;
  if (!["no", "yes_or_unsure"].includes(record.goodsServices)) return false;
  if (
    record.reviewDetails !== null &&
    (!isNonBlankBoundedText(record.reviewDetails, 2_000) ||
      /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(record.reviewDetails))
  ) {
    return false;
  }
  if (
    (record.requestType === "correction" || record.goodsServices === "yes_or_unsure") &&
    record.reviewDetails === null
  ) {
    return false;
  }
  if (!isSingleLineBoundedText(record.confirmationText, 1_000)) return false;
  if (!Number.isFinite(Date.parse(record.confirmedAt))) return false;
  if (record.source !== "website_donate") return false;
  if (!Number.isFinite(Date.parse(record.createdAt))) return false;
  if (!["pending", "matched", "needs_review", "completed"].includes(record.status)) {
    return false;
  }
  if (record.matchNotes !== null && !isNonBlankBoundedText(record.matchNotes, 2_000)) {
    return false;
  }
  if (
    record.acknowledgmentIssuedAt !== null &&
    !Number.isFinite(Date.parse(record.acknowledgmentIssuedAt))
  ) {
    return false;
  }
  return true;
}

function isUpdateRequestRecord(
  record: NotificationRequestRecord,
): record is UpdateRequestRecord {
  return "firstName" in record;
}

function isDonorRecordRequestRecord(
  record: NotificationRequestRecord,
): record is DonorRecordRequestRecord {
  return "requestType" in record;
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeBodyText(value: string): string {
  return value.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
}

function displayPhone(value: string | null): string {
  const normalized = value === null ? "" : normalizeBodyText(value);
  return normalized.length > 0 ? normalized : "Not provided";
}

function displayOptionalText(value: string | null): string {
  const normalized = value === null ? "" : normalizeBodyText(value);
  return normalized.length > 0 ? normalized : "Not provided";
}

function buildTextRows(rows: ReadonlyArray<readonly [string, string]>): string {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function buildHtmlRows(rows: ReadonlyArray<readonly [string, string]>): string {
  return rows
    .map(
      ([label, value]) =>
        `<tr><th scope="row" style="padding:8px 12px 8px 0;text-align:left;vertical-align:top;color:#334155;font-weight:600">${escapeHtml(label)}</th><td style="padding:8px 0;vertical-align:top;color:#0f172a;overflow-wrap:anywhere">${escapeHtml(value)}</td></tr>`,
    )
    .join("");
}

export function buildNotificationEmail(
  request: UpdateRequestRecord,
  outboxId: string,
): NotificationEmail {
  const firstName = normalizeBodyText(request.firstName);
  const lastName = normalizeBodyText(request.lastName);
  const fullName = `${firstName} ${lastName}`.trim();
  const phone = displayPhone(request.phone);
  const email = request.email.trim();
  const consentText = normalizeBodyText(request.consentText);
  const consentedAt = normalizeBodyText(request.consentedAt);
  const createdAt = normalizeBodyText(request.createdAt);
  const source = normalizeBodyText(request.source);

  const rows: ReadonlyArray<readonly [string, string]> = [
    ["Name", fullName],
    ["Email", email],
    ["Phone", phone],
    ["Consent", consentText],
    ["Consent recorded", consentedAt],
    ["Submitted", createdAt],
    ["Source", source],
    ["Request reference", request.id],
    ["Outbox reference", outboxId],
  ];

  const textRows = buildTextRows(rows);
  const htmlRows = buildHtmlRows(rows);

  return {
    to: UPDATE_REQUEST_DESTINATION,
    from: { email: FIXED_SENDER, name: SENDER_NAME },
    replyTo: email,
    subject: "[STAGING] New Kehilat Ohr HaTorah website update request",
    text: [
      "A website visitor asked to receive occasional Kehilat Ohr HaTorah updates.",
      "",
      textRows,
      "",
      "Replying to this email addresses the visitor directly.",
      "This administrator notification does not itself send a newsletter or bulk email.",
    ].join("\n"),
    html: [
      '<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif">',
      '<main style="max-width:680px;margin:0 auto;padding:28px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">',
      '<h1 style="margin:0 0 14px;color:#0b2946;font-size:24px;line-height:1.25">New website update request</h1>',
      '<p style="margin:0 0 18px;color:#334155;line-height:1.6">A website visitor asked to receive occasional <strong>Kehilat Ohr HaTorah</strong> updates.</p>',
      `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5"><tbody>${htmlRows}</tbody></table>`,
      '<p style="margin:20px 0 0;color:#334155;line-height:1.6">Replying to this email addresses the visitor directly.</p>',
      '<p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.5">This administrator notification does not itself send a newsletter or bulk email.</p>',
      "</main></body></html>",
    ].join(""),
  };
}

export function buildDonorRecordNotificationEmail(
  request: DonorRecordRequestRecord,
  outboxId: string,
): NotificationEmail {
  const email = request.email.trim();
  const requestType =
    request.requestType === "correction" ? "Correction request" : "Acknowledgment request";
  const paymentMethod =
    request.paymentMethod === "zelle"
      ? "Zelle"
      : request.paymentMethod === "paypal"
        ? "PayPal"
        : request.paymentMethod === "check"
          ? "Check"
          : "Other";
  const goodsServices =
    request.goodsServices === "no" ? "No" : "Yes or requester is unsure";

  const rows: ReadonlyArray<readonly [string, string]> = [
    ["Request type", requestType],
    ["Record name", normalizeBodyText(request.recordName)],
    ["Email", email],
    ["Contribution date", request.contributionDate],
    ["Amount supplied", normalizeBodyText(request.amountText)],
    ["Payment method", paymentMethod],
    ["Payment reference", displayOptionalText(request.reference)],
    ["Goods or services received", goodsServices],
    ["Review details", displayOptionalText(request.reviewDetails)],
    ["Requester confirmation", normalizeBodyText(request.confirmationText)],
    ["Confirmed", normalizeBodyText(request.confirmedAt)],
    ["Submitted", normalizeBodyText(request.createdAt)],
    ["Request reference", request.id],
    ["Outbox reference", outboxId],
  ];
  const textRows = buildTextRows(rows);
  const htmlRows = buildHtmlRows(rows);

  return {
    to: DONOR_RECORD_DESTINATION,
    from: { email: FIXED_SENDER, name: SENDER_NAME },
    replyTo: email,
    subject: "[STAGING] New donor record request",
    text: [
      "A donor submitted a request to review Kehilat Ohr HaTorah giving records.",
      "",
      textRows,
      "",
      "Verify the supplied information against congregation records before issuing or correcting an acknowledgment.",
      "This submission is not itself proof of a contribution or a charitable acknowledgment.",
      "Replying to this email addresses the requester directly.",
    ].join("\n"),
    html: [
      '<!doctype html><html lang="en"><body style="margin:0;padding:24px;background:#f8fafc;font-family:Arial,sans-serif">',
      '<main style="max-width:680px;margin:0 auto;padding:28px;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px">',
      '<h1 style="margin:0 0 14px;color:#0b2946;font-size:24px;line-height:1.25">New donor record request</h1>',
      '<p style="margin:0 0 18px;color:#334155;line-height:1.6">A donor submitted a request to review <strong>Kehilat Ohr HaTorah</strong> giving records.</p>',
      `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:15px;line-height:1.5"><tbody>${htmlRows}</tbody></table>`,
      '<p style="margin:20px 0 0;color:#334155;line-height:1.6"><strong>Verify the supplied information against congregation records</strong> before issuing or correcting an acknowledgment.</p>',
      '<p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.5">This submission is not itself proof of a contribution or a charitable acknowledgment. Replying to this email addresses the requester directly.</p>',
      "</main></body></html>",
    ].join(""),
  };
}

function buildValidatedNotificationEmail(
  message: NotificationQueueMessage,
  request: NotificationRequestRecord,
  outboxId: string,
): NotificationEmail | null {
  if (message.version === UPDATE_REQUEST_QUEUE_MESSAGE_VERSION) {
    if (!isUpdateRequestRecord(request) || !isValidUpdateRequest(request)) return null;
    return buildNotificationEmail(request, outboxId);
  }

  if (!isDonorRecordRequestRecord(request) || !isValidDonorRecordRequest(request)) return null;
  return buildDonorRecordNotificationEmail(request, outboxId);
}

function getEmailErrorCode(error: unknown): string {
  if (!isRecord(error) || typeof error.code !== "string") return "E_UNKNOWN";

  const normalized = error.code.trim().toUpperCase();
  return /^E_[A-Z0-9_]{1,61}$/.test(normalized) ? normalized : "E_UNKNOWN";
}

export function classifyEmailError(error: unknown): {
  code: string;
  retryable: boolean;
} {
  const code = getEmailErrorCode(error);

  if (TRANSIENT_EMAIL_ERROR_CODES.has(code)) return { code, retryable: true };
  if (PERMANENT_EMAIL_ERROR_CODES.has(code)) return { code, retryable: false };
  return { code, retryable: true };
}

function retryDelaySeconds(deliveryAttempt: number, errorCode: string): number {
  if (errorCode === "E_DAILY_LIMIT_EXCEEDED") return 3_600;
  const normalizedAttempt = Math.max(1, Math.min(deliveryAttempt, 5));
  return Math.min(60 * 3 ** (normalizedAttempt - 1), 3_600);
}

function busyRetryDelaySeconds(leaseExpiresAt: string | null, now: Date): number {
  const leaseTime = leaseExpiresAt === null ? Number.NaN : Date.parse(leaseExpiresAt);
  if (!Number.isFinite(leaseTime)) return 60;

  const remainingSeconds = Math.ceil((leaseTime - now.getTime()) / 1000) + 1;
  return Math.max(5, Math.min(remainingSeconds, 300));
}

async function markFailureOrRetry(
  dependencies: NotifierDependencies,
  claimed: ClaimedOutbox,
  leaseToken: string,
  errorCode: string,
  nowIso: string,
  dead: boolean,
  deliveryAttempt: number,
): Promise<ProcessingDecision> {
  try {
    await dependencies.outbox.markFailed(
      claimed.outboxId,
      leaseToken,
      errorCode,
      nowIso,
      dead,
    );
  } catch {
    return {
      action: "retry",
      outcome: "transient-failure",
      delaySeconds: retryDelaySeconds(deliveryAttempt, "E_STORE_UNAVAILABLE"),
      errorCode: "E_STORE_UNAVAILABLE",
      outboxId: claimed.outboxId,
    };
  }

  if (dead) {
    return {
      action: "ack",
      outcome: errorCode === "E_INVALID_RECORD" ? "invalid-record" : "permanent-failure",
      errorCode,
      outboxId: claimed.outboxId,
    };
  }

  return {
    action: "retry",
    outcome: "transient-failure",
    delaySeconds: retryDelaySeconds(deliveryAttempt, errorCode),
    errorCode,
    outboxId: claimed.outboxId,
  };
}

export async function processOutboxMessage(
  rawMessage: unknown,
  deliveryAttempt: number,
  dependencies: NotifierDependencies,
): Promise<ProcessingDecision> {
  const message = parseQueueMessage(rawMessage);
  if (message === null) return { action: "ack", outcome: "invalid-message" };

  const now = dependencies.now();
  const nowIso = now.toISOString();
  const leaseExpiresIso = new Date(now.getTime() + LEASE_DURATION_MS).toISOString();
  const leaseToken = dependencies.createLeaseToken();

  let claim: ClaimResult;
  try {
    claim = await dependencies.outbox.claim(
      message.outboxId,
      leaseToken,
      nowIso,
      leaseExpiresIso,
    );
  } catch {
    return {
      action: "retry",
      outcome: "transient-failure",
      delaySeconds: retryDelaySeconds(deliveryAttempt, "E_STORE_UNAVAILABLE"),
      errorCode: "E_STORE_UNAVAILABLE",
      outboxId: message.outboxId,
    };
  }

  if (claim.kind === "missing") {
    return { action: "ack", outcome: "missing-outbox", outboxId: message.outboxId };
  }
  if (claim.kind === "terminal") {
    return { action: "ack", outcome: "already-terminal", outboxId: message.outboxId };
  }
  if (claim.kind === "invalid-state") {
    return {
      action: "retry",
      outcome: "transient-failure",
      delaySeconds: retryDelaySeconds(deliveryAttempt, "E_INVALID_OUTBOX_STATE"),
      errorCode: "E_INVALID_OUTBOX_STATE",
      outboxId: message.outboxId,
    };
  }
  if (claim.kind === "busy") {
    return {
      action: "retry",
      outcome: "busy",
      delaySeconds: busyRetryDelaySeconds(claim.leaseExpiresAt, now),
      errorCode: "E_LEASE_BUSY",
      outboxId: message.outboxId,
    };
  }

  const claimed = claim.row;
  let request: NotificationRequestRecord | null;
  try {
    request = await dependencies.outbox.getRequest(claimed.requestId);
  } catch {
    return markFailureOrRetry(
      dependencies,
      claimed,
      leaseToken,
      "E_STORE_UNAVAILABLE",
      nowIso,
      false,
      deliveryAttempt,
    );
  }

  if (request === null) {
    const decision = await markFailureOrRetry(
      dependencies,
      claimed,
      leaseToken,
      "E_MISSING_REQUEST",
      nowIso,
      true,
      deliveryAttempt,
    );
    return decision.action === "ack"
      ? { ...decision, outcome: "missing-request" }
      : decision;
  }

  const notificationEmail = buildValidatedNotificationEmail(
    message,
    request,
    claimed.outboxId,
  );

  if (notificationEmail === null) {
    return markFailureOrRetry(
      dependencies,
      claimed,
      leaseToken,
      "E_INVALID_RECORD",
      nowIso,
      true,
      deliveryAttempt,
    );
  }

  let emailResult: { messageId: string };
  try {
    emailResult = await dependencies.email.send(notificationEmail);
  } catch (error) {
    const classification = classifyEmailError(error);
    return markFailureOrRetry(
      dependencies,
      claimed,
      leaseToken,
      classification.code,
      nowIso,
      !classification.retryable,
      deliveryAttempt,
    );
  }

  if (!isBoundedText(emailResult.messageId, 255)) {
    return markFailureOrRetry(
      dependencies,
      claimed,
      leaseToken,
      "E_INVALID_PROVIDER_RESPONSE",
      nowIso,
      false,
      deliveryAttempt,
    );
  }

  try {
    await dependencies.outbox.markDelivered(
      claimed.outboxId,
      leaseToken,
      emailResult.messageId,
      nowIso,
    );
  } catch {
    return {
      action: "retry",
      outcome: "transient-failure",
      delaySeconds: retryDelaySeconds(deliveryAttempt, "E_STORE_UNAVAILABLE"),
      errorCode: "E_STORE_UNAVAILABLE",
      outboxId: claimed.outboxId,
    };
  }

  return { action: "ack", outcome: "delivered", outboxId: claimed.outboxId };
}

function assertOneRowChanged(result: D1Result, operation: string): void {
  if (result.meta.changes !== 1) throw new Error(`${operation} did not change one row`);
}

function createD1OutboxRepository(
  database: D1Database,
  message: NotificationQueueMessage | null,
): OutboxRepository {
  const isDonorRecordRequest = message?.version === DONOR_RECORD_QUEUE_MESSAGE_VERSION;
  const outboxTable = isDonorRecordRequest
    ? "donor_record_request_outbox"
    : "update_request_outbox";

  return {
    async claim(outboxId, leaseToken, nowIso, leaseExpiresIso) {
      const session = database.withSession("first-primary");
      const claimed = await session
        .prepare(
          `UPDATE ${outboxTable}
             SET status = 'processing',
                 attempts = attempts + 1,
                 lease_token = ?,
                 lease_expires_at = ?,
                 updated_at = ?
           WHERE id = ?
             AND (
               status IN ('pending', 'failed')
               OR (
                 status = 'processing'
                 AND (
                   lease_expires_at IS NULL
                   OR julianday(lease_expires_at) <= julianday(?)
                 )
               )
             )
           RETURNING id, request_id, attempts`,
        )
        .bind(leaseToken, leaseExpiresIso, nowIso, outboxId, nowIso)
        .first<RawClaimedOutboxRow>();

      if (claimed !== null) {
        return {
          kind: "claimed",
          row: {
            outboxId: claimed.id,
            requestId: claimed.request_id,
            attempt: claimed.attempts,
          },
        };
      }

      const current = await session
        .prepare(`SELECT status, lease_expires_at FROM ${outboxTable} WHERE id = ?`)
        .bind(outboxId)
        .first<RawOutboxState>();

      if (current === null) return { kind: "missing" };
      if (current.status === "dead" || current.status === "delivered") {
        return { kind: "terminal", status: current.status };
      }
      if (current.status === "processing") {
        return { kind: "busy", leaseExpiresAt: current.lease_expires_at };
      }
      return { kind: "invalid-state" };
    },

    async getRequest(requestId) {
      if (isDonorRecordRequest) {
        const row = await database
          .withSession("first-primary")
          .prepare(
            `SELECT id, request_type, record_name, email, contribution_date,
                    amount_text, payment_method, reference, goods_services,
                    review_details, confirmation_text, confirmed_at, source,
                    created_at, status, match_notes, acknowledgment_issued_at
               FROM donor_record_requests
              WHERE id = ?`,
          )
          .bind(requestId)
          .first<RawDonorRecordRequestRow>();

        if (row === null) return null;
        return {
          id: row.id,
          requestType: row.request_type,
          recordName: row.record_name,
          email: row.email,
          contributionDate: row.contribution_date,
          amountText: row.amount_text,
          paymentMethod: row.payment_method,
          reference: row.reference,
          goodsServices: row.goods_services,
          reviewDetails: row.review_details,
          confirmationText: row.confirmation_text,
          confirmedAt: row.confirmed_at,
          source: row.source,
          createdAt: row.created_at,
          status: row.status,
          matchNotes: row.match_notes,
          acknowledgmentIssuedAt: row.acknowledgment_issued_at,
        };
      }

      const row = await database
        .withSession("first-primary")
        .prepare(
          `SELECT id, first_name, last_name, email, phone, consent_text,
                  consented_at, source, created_at
             FROM update_requests
            WHERE id = ?`,
        )
        .bind(requestId)
        .first<RawRequestRow>();

      if (row === null) return null;
      return {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        consentText: row.consent_text,
        consentedAt: row.consented_at,
        source: row.source,
        createdAt: row.created_at,
      };
    },

    async markDelivered(outboxId, leaseToken, providerMessageId, nowIso) {
      const result = await database
        .prepare(
          `UPDATE ${outboxTable}
              SET status = 'delivered',
                  provider_message_id = ?,
                  last_error_code = NULL,
                  lease_token = NULL,
                  lease_expires_at = NULL,
                  delivered_at = ?,
                  updated_at = ?
            WHERE id = ?
              AND status = 'processing'
              AND lease_token = ?`,
        )
        .bind(providerMessageId, nowIso, nowIso, outboxId, leaseToken)
        .run();
      assertOneRowChanged(result, "markDelivered");
    },

    async markFailed(outboxId, leaseToken, errorCode, nowIso, dead) {
      const result = await database
        .prepare(
          `UPDATE ${outboxTable}
              SET status = ?,
                  last_error_code = ?,
                  lease_token = NULL,
                  lease_expires_at = NULL,
                  updated_at = ?
            WHERE id = ?
              AND status = 'processing'
              AND lease_token = ?`,
        )
        .bind(dead ? "dead" : "failed", errorCode, nowIso, outboxId, leaseToken)
        .run();
      assertOneRowChanged(result, "markFailed");
    },
  };
}

function createEmailClient(binding: SendEmail): TransactionalEmailClient {
  return {
    async send(message) {
      return binding.send(message);
    },
  };
}

function structuredLog(
  level: "error" | "info" | "warn",
  event: string,
  queueMessageId: string,
  deliveryAttempt: number,
  decision: ProcessingDecision,
): void {
  const payload = JSON.stringify({
    event,
    queueMessageId,
    deliveryAttempt,
    action: decision.action,
    outcome: decision.outcome,
    errorCode: decision.errorCode,
    outboxId: decision.outboxId,
  });

  if (level === "error") console.error(payload);
  else if (level === "warn") console.warn(payload);
  else console.log(payload);
}

export default {
  async queue(batch, env): Promise<void> {
    for (const message of batch.messages) {
      const parsedMessage = parseQueueMessage(message.body);
      const emailBinding = parsedMessage?.version === DONOR_RECORD_QUEUE_MESSAGE_VERSION
        ? env.DONOR_EMAIL
        : env.EMAIL;
      const dependencies: NotifierDependencies = {
        outbox: createD1OutboxRepository(env.FORM_DB, parsedMessage),
        email: createEmailClient(emailBinding),
        now: () => new Date(),
        createLeaseToken: () => crypto.randomUUID(),
      };
      const notificationType =
        parsedMessage?.version === DONOR_RECORD_QUEUE_MESSAGE_VERSION
          ? "donor_record_request"
          : "update_request";
      let decision: ProcessingDecision;
      try {
        decision = await processOutboxMessage(message.body, message.attempts, dependencies);
      } catch {
        decision = {
          action: "retry",
          outcome: "transient-failure",
          delaySeconds: retryDelaySeconds(message.attempts, "E_UNEXPECTED"),
          errorCode: "E_UNEXPECTED",
        };
      }

      if (decision.action === "retry") {
        message.retry({ delaySeconds: decision.delaySeconds });
        structuredLog(
          "warn",
          `${notificationType}_notification_retry`,
          message.id,
          message.attempts,
          decision,
        );
        continue;
      }

      message.ack();
      const level =
        decision.outcome === "delivered" || decision.outcome === "already-terminal"
          ? "info"
          : "warn";
      structuredLog(
        level,
        `${notificationType}_notification_ack`,
        message.id,
        message.attempts,
        decision,
      );
    }
  },
} satisfies ExportedHandler<Env, NotificationQueueMessage>;
