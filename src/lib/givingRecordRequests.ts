export const DONOR_RECORD_REQUEST_SOURCE = 'website_donate' as const;
export const DONOR_RECORD_REQUEST_TURNSTILE_ACTION = 'giving_record_request' as const;

export const DONOR_RECORD_REQUEST_CONFIRMATION =
  'I confirm that these details are accurate to the best of my knowledge. I understand this is a request to review congregation records, not an acknowledgment, tax receipt, or determination of deductibility.';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/u;
const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/u;
const MULTILINE_CONTROL_CHARACTER_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/u;

export type DonorRecordRequestType = 'acknowledgment' | 'correction';
export type DonorPaymentMethod = 'zelle' | 'paypal' | 'check' | 'other';
export type DonorGoodsServicesAnswer = 'no' | 'yes_or_unsure';

export interface DonorRecordRequestInput {
  submissionId?: string;
  requestType: DonorRecordRequestType;
  recordName: string;
  email: string;
  contributionDate: string;
  amountText: string;
  paymentMethod: DonorPaymentMethod;
  reference: string | null;
  goodsServices: DonorGoodsServicesAnswer;
  reviewDetails: string | null;
  turnstileToken: string;
}

export interface DonorRecordRequestQueueMessage {
  version: 2;
  type: 'donor_record_request';
  outboxId: string;
}

export type DonorRecordRequestValidationResult =
  | { ok: true; bot: true }
  | { ok: true; bot: false; value: DonorRecordRequestInput }
  | { ok: false; fields: string[] };

type RequestRecord = Record<string, unknown>;

function asRecord(value: unknown): RequestRecord | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as RequestRecord;
}

function firstDefined(record: RequestRecord, keys: string[]): unknown {
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

function normalizeOptionalMultiline(value: unknown, maximumLength: number): string | null | undefined {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || MULTILINE_CONTROL_CHARACTER_PATTERN.test(value)) return undefined;

  const normalized = value
    .normalize('NFKC')
    .replace(/\r\n?/gu, '\n')
    .split('\n')
    .map((line) => line.trim().replace(/[ \t]+/gu, ' '))
    .join('\n')
    .trim();
  if (!normalized || Array.from(normalized).length > maximumLength) return undefined;
  return normalized;
}

function hasExplicitConfirmation(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function isHoneypotFilled(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  return typeof value === 'string' && value.trim().length > 0;
}

function isRealIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const candidate = new Date(Date.UTC(year, month - 1, day));
  return candidate.getUTCFullYear() === year
    && candidate.getUTCMonth() === month - 1
    && candidate.getUTCDate() === day;
}

export function validateDonorRecordRequestPayload(
  payload: unknown,
): DonorRecordRequestValidationResult {
  const record = asRecord(payload);
  if (!record) return { ok: false, fields: ['form'] };

  const honeypot = firstDefined(record, ['website', 'botcheck']);
  if (isHoneypotFilled(honeypot)) return { ok: true, bot: true };

  const fields: string[] = [];
  const requestType = normalizeSingleLine(firstDefined(record, ['requestType', 'request_type']), 32);
  const recordName = normalizeSingleLine(firstDefined(record, ['recordName', 'record_name']), 160);
  const rawEmail = normalizeSingleLine(record.email, 254);
  const contributionDate = normalizeSingleLine(
    firstDefined(record, ['contributionDate', 'contribution_date']),
    10,
  );
  const amountText = normalizeSingleLine(firstDefined(record, ['amountText', 'amount_text']), 40);
  const paymentMethod = normalizeSingleLine(
    firstDefined(record, ['paymentMethod', 'payment_method']),
    16,
  );
  const reference = normalizeOptionalSingleLine(record.reference, 120);
  const goodsServices = normalizeSingleLine(
    firstDefined(record, ['goodsServices', 'goods_services']),
    20,
  );
  const reviewDetails = normalizeOptionalMultiline(
    firstDefined(record, ['reviewDetails', 'review_details']),
    2_000,
  );
  const rawSubmissionId = firstDefined(record, ['submissionId', 'submission_id']);
  const turnstileToken = normalizeSingleLine(
    firstDefined(record, ['turnstileToken', 'cf-turnstile-response']),
    2_048,
  );

  if (requestType !== 'acknowledgment' && requestType !== 'correction') fields.push('requestType');
  if (!recordName) fields.push('recordName');
  if (!rawEmail || !EMAIL_PATTERN.test(rawEmail)) fields.push('email');
  if (!contributionDate || !isRealIsoDate(contributionDate)) fields.push('contributionDate');
  if (!amountText) fields.push('amountText');
  if (!['zelle', 'paypal', 'check', 'other'].includes(paymentMethod || '')) fields.push('paymentMethod');
  if (reference === undefined) fields.push('reference');
  if (goodsServices !== 'no' && goodsServices !== 'yes_or_unsure') fields.push('goodsServices');
  if (reviewDetails === undefined) fields.push('reviewDetails');
  if (
    (requestType === 'correction' || goodsServices === 'yes_or_unsure')
    && reviewDetails === null
  ) {
    fields.push('reviewDetails');
  }
  if (!hasExplicitConfirmation(record.confirmation)) fields.push('confirmation');
  if (!turnstileToken) fields.push('turnstileToken');

  let submissionId: string | undefined;
  if (rawSubmissionId !== undefined && rawSubmissionId !== null && rawSubmissionId !== '') {
    if (typeof rawSubmissionId !== 'string' || !UUID_PATTERN.test(rawSubmissionId.trim())) {
      fields.push('submissionId');
    } else {
      submissionId = rawSubmissionId.trim().toLowerCase();
    }
  }

  if (
    fields.length > 0
    || (requestType !== 'acknowledgment' && requestType !== 'correction')
    || !recordName
    || !rawEmail
    || !contributionDate
    || !amountText
    || !paymentMethod
    || !goodsServices
    || !turnstileToken
  ) {
    return { ok: false, fields: [...new Set(fields)] };
  }

  return {
    ok: true,
    bot: false,
    value: {
      submissionId,
      requestType,
      recordName,
      email: rawEmail.toLowerCase(),
      contributionDate,
      amountText,
      paymentMethod: paymentMethod as DonorPaymentMethod,
      reference: reference ?? null,
      goodsServices,
      reviewDetails: reviewDetails ?? null,
      turnstileToken,
    },
  };
}
