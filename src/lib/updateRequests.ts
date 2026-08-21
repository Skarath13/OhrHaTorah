import { congregationName } from '../data/congregationIdentity.ts';

export const MAX_UPDATE_REQUEST_BODY_BYTES = 8 * 1024;
export const UPDATE_REQUEST_SOURCE = 'website_footer' as const;

const updateRequestConsentParts = {
  permission: `Yes, please send me weekly emails and occasional important or community updates from ${congregationName}.`,
  frequency: 'Email frequency may vary, and I can unsubscribe at any time.',
  termsLead: 'I agree to the',
  termsLabel: 'Terms and Conditions',
  termsEffective: '(effective August 20, 2026)',
  privacyLead: 'and acknowledge the',
  privacyLabel: 'Privacy Notice',
  ending: '.',
} as const;

/**
 * The displayed consent copy and the exact text persisted with each request.
 * Footer.astro renders these same parts so the record cannot drift from the
 * material consent presented next to the required checkbox.
 */
export const UPDATE_REQUEST_CONSENT = Object.freeze({
  ...updateRequestConsentParts,
  text: [
    updateRequestConsentParts.permission,
    updateRequestConsentParts.frequency,
    updateRequestConsentParts.termsLead,
    updateRequestConsentParts.termsLabel,
    updateRequestConsentParts.termsEffective,
    updateRequestConsentParts.privacyLead,
    updateRequestConsentParts.privacyLabel + updateRequestConsentParts.ending,
  ].join(' '),
});
export const TURNSTILE_EXPECTED_ACTION = 'updates_request';
export const TURNSTILE_EXPECTED_HOSTNAME = 'kehilat-ohr-hatorah-chuck-staging.pages.dev';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;

export class UpdateRequestPayloadTooLargeError extends Error {
  constructor() {
    super('Update request payload exceeds the configured limit');
    this.name = 'UpdateRequestPayloadTooLargeError';
  }
}

export class UpdateRequestUnsupportedMediaTypeError extends Error {
  constructor() {
    super('Update request content type is not supported');
    this.name = 'UpdateRequestUnsupportedMediaTypeError';
  }
}

export class UpdateRequestMalformedBodyError extends Error {
  constructor() {
    super('Update request body could not be parsed');
    this.name = 'UpdateRequestMalformedBodyError';
  }
}

export interface UpdateRequestInput {
  submissionId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  turnstileToken: string;
}

export interface UpdateRequestQueueMessage {
  version: 1;
  outboxId: string;
}

export type UpdateRequestValidationResult =
  | { ok: true; bot: true }
  | { ok: true; bot: false; value: UpdateRequestInput }
  | { ok: false; fields: string[] };

type UpdateRequestRecord = Record<string, unknown>;

function asRecord(value: unknown): UpdateRequestRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as UpdateRequestRecord;
}

function firstDefined(record: UpdateRequestRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined) return record[key];
  }
  return undefined;
}

function normalizeSingleLine(value: unknown, maximumLength: number): string | null {
  if (typeof value !== 'string' || CONTROL_CHARACTER_PATTERN.test(value)) return null;

  const normalized = value.normalize('NFKC').trim().replace(/\s+/gu, ' ');
  if (!normalized || Array.from(normalized).length > maximumLength) return null;
  return normalized;
}

function normalizeOptionalSingleLine(value: unknown, maximumLength: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  const normalized = normalizeSingleLine(value, maximumLength);
  return normalized === null ? undefined : normalized;
}

function hasExplicitConsent(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function isHoneypotFilled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;
  return value.trim().length > 0;
}

export function validateUpdateRequestPayload(payload: unknown): UpdateRequestValidationResult {
  const record = asRecord(payload);
  if (!record) return { ok: false, fields: ['form'] };

  const honeypot = firstDefined(record, ['website', 'botcheck']);
  if (isHoneypotFilled(honeypot)) return { ok: true, bot: true };

  const fields: string[] = [];
  const firstName = normalizeSingleLine(firstDefined(record, ['firstName', 'first_name']), 80);
  const lastName = normalizeSingleLine(firstDefined(record, ['lastName', 'last_name']), 80);
  const rawEmail = normalizeSingleLine(record.email, 254);
  const optionalPhone = normalizeOptionalSingleLine(record.phone, 40);
  const rawSubmissionId = firstDefined(record, ['submissionId', 'submission_id']);
  const turnstileToken = normalizeSingleLine(
    firstDefined(record, ['turnstileToken', 'cf-turnstile-response']),
    2048,
  );

  if (!firstName) fields.push('firstName');
  if (!lastName) fields.push('lastName');
  if (!rawEmail || !EMAIL_PATTERN.test(rawEmail)) fields.push('email');
  if (optionalPhone === undefined) fields.push('phone');
  if (!hasExplicitConsent(firstDefined(record, ['consent', 'email_consent']))) fields.push('consent');
  if (!turnstileToken) fields.push('turnstileToken');

  let submissionId: string | undefined;
  if (rawSubmissionId !== undefined && rawSubmissionId !== null && rawSubmissionId !== '') {
    if (typeof rawSubmissionId !== 'string' || !UUID_PATTERN.test(rawSubmissionId.trim())) {
      fields.push('submissionId');
    } else {
      submissionId = rawSubmissionId.trim().toLowerCase();
    }
  }

  if (fields.length > 0 || !firstName || !lastName || !rawEmail || !turnstileToken) {
    return { ok: false, fields: [...new Set(fields)] };
  }

  return {
    ok: true,
    bot: false,
    value: {
      submissionId,
      firstName,
      lastName,
      email: rawEmail.toLowerCase(),
      phone: optionalPhone ?? null,
      turnstileToken,
    },
  };
}

export function isSameOriginRequest(request: Request): boolean {
  const requestOrigin = new URL(request.url).origin;
  const fetchSite = request.headers.get('Sec-Fetch-Site')?.toLowerCase();
  if (fetchSite && fetchSite !== 'same-origin') return false;

  const origin = request.headers.get('Origin');
  if (origin) {
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  const referer = request.headers.get('Referer');
  if (!referer || fetchSite !== 'same-origin') return false;
  try {
    return new URL(referer).origin === requestOrigin;
  } catch {
    return false;
  }
}

async function readBoundedRequestBody(
  request: Request,
  maximumBytes = MAX_UPDATE_REQUEST_BODY_BYTES,
): Promise<Uint8Array> {
  const declaredLength = request.headers.get('Content-Length');
  if (declaredLength) {
    const parsedLength = Number(declaredLength);
    if (Number.isFinite(parsedLength) && parsedLength > maximumBytes) {
      throw new UpdateRequestPayloadTooLargeError();
    }
  }

  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maximumBytes) {
      await reader.cancel();
      throw new UpdateRequestPayloadTooLargeError();
    }
    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

function formDataToRecord(formData: FormData): UpdateRequestRecord {
  const record: UpdateRequestRecord = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === 'string') record[key] = value;
  }
  return record;
}

export async function parseUpdateRequestBody(request: Request): Promise<UpdateRequestRecord> {
  const contentType = request.headers.get('Content-Type') || '';
  const mediaType = contentType.split(';', 1)[0].trim().toLowerCase();
  if (!['application/json', 'application/x-www-form-urlencoded', 'multipart/form-data'].includes(mediaType)) {
    throw new UpdateRequestUnsupportedMediaTypeError();
  }

  const bytes = await readBoundedRequestBody(request);
  try {
    if (mediaType === 'application/json') {
      const parsed = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      const record = asRecord(parsed);
      if (!record) throw new UpdateRequestMalformedBodyError();
      return record;
    }

    if (mediaType === 'application/x-www-form-urlencoded') {
      const params = new URLSearchParams(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      return Object.fromEntries(params.entries());
    }

    const formData = await new Response(bytes, {
      headers: { 'Content-Type': contentType },
    }).formData();
    return formDataToRecord(formData);
  } catch (error) {
    if (error instanceof UpdateRequestMalformedBodyError) throw error;
    throw new UpdateRequestMalformedBodyError();
  }
}

interface VerifyTurnstileOptions {
  secret: string;
  token: string;
  idempotencyKey: string;
  expectedHostname: string;
  expectedAction?: string;
  fetchImpl?: typeof fetch;
}

interface TurnstileVerificationResponse {
  success?: boolean;
  hostname?: string;
  action?: string;
}

export async function verifyTurnstile({
  secret,
  token,
  idempotencyKey,
  expectedHostname,
  expectedAction = TURNSTILE_EXPECTED_ACTION,
  fetchImpl = fetch,
}: VerifyTurnstileOptions): Promise<boolean> {
  if (!secret || !token || !UUID_PATTERN.test(idempotencyKey)) return false;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5_000);
  try {
    const response = await fetchImpl('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
      },
      body: new URLSearchParams({
        secret,
        response: token,
        idempotency_key: idempotencyKey,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return false;

    const result = (await response.json()) as TurnstileVerificationResponse;
    return result.success === true
      && result.hostname === expectedHostname
      && result.action === expectedAction;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
