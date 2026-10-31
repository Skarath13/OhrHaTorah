// Exclusive access: pages that open only with a shared code handed to select
// people. No accounts or sign-ups. Admins create and revoke codes; a visitor
// enters a code once and the browser keeps an HttpOnly session for that area.

export type ExclusiveArea = {
  readonly area: string;
  readonly pathPrefix: string;
  readonly title: string;
};

// Add an entry here to gate a new section. Every path at or below
// `pathPrefix` then requires a code for that area (admins always pass).
export const exclusiveAreas: readonly ExclusiveArea[] = [
  { area: 'members', pathPrefix: '/members', title: 'Members' },
];

export const ACCESS_GATE_PATH = '/access';

const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
// Unambiguous characters only: no 0/O, 1/I/L, so codes read well aloud and in print.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 10;

export const findExclusiveArea = (
  pathname: string,
  areas: readonly ExclusiveArea[] = exclusiveAreas,
): ExclusiveArea | null => areas.find(({ pathPrefix }) =>
  pathname === pathPrefix || pathname.startsWith(`${pathPrefix}/`),
) ?? null;

export const getExclusiveAreaByName = (
  area: string | null | undefined,
  areas: readonly ExclusiveArea[] = exclusiveAreas,
): ExclusiveArea | null => areas.find((entry) => entry.area === area) ?? null;

/** Uppercase and drop spaces/dashes so "shalom-abc 12" and "SHALOMABC12" match. */
export const normalizeAccessCode = (input: string): string =>
  input.toUpperCase().replace(/[\s-]+/g, '');

/** Display form for admins and printed cards: XXXXX-XXXXX. */
export const formatAccessCode = (code: string): string => {
  const normalized = normalizeAccessCode(code);
  return normalized.length === CODE_LENGTH
    ? `${normalized.slice(0, 5)}-${normalized.slice(5)}`
    : normalized;
};

export const generateAccessCode = (): string => {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 31 symbols over 256 values: reject the biased tail instead of using modulo.
  const limit = 256 - (256 % CODE_ALPHABET.length);
  let code = '';
  while (code.length < CODE_LENGTH) {
    for (const byte of bytes) {
      if (byte < limit && code.length < CODE_LENGTH) code += CODE_ALPHABET[byte % CODE_ALPHABET.length];
    }
    crypto.getRandomValues(bytes);
  }
  return formatAccessCode(code);
};

export const hashAccessCode = async (code: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(normalizeAccessCode(code)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
};

const randomToken = (): string => {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

/** Only same-site paths inside the area may be used as a post-unlock redirect. */
export const safeNextPath = (next: string | null | undefined, area: ExclusiveArea): string => {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.includes('\\')) return area.pathPrefix;
  const pathname = next.split(/[?#]/, 1)[0];
  return findExclusiveArea(pathname, [area]) ? next : area.pathPrefix;
};

export const accessCookieName = (area: string): string => `oht_access_${area}`;

// SameSite=Lax so a link opened from an email still carries the session.
export const createAccessCookie = (area: string, token: string, expiresAt: Date): string => {
  const maxAge = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
  return `${accessCookieName(area)}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
};

export const getAccessTokenFromCookies = (cookieHeader: string | null, area: string): string | null => {
  if (!cookieHeader) return null;
  const prefix = `${accessCookieName(area)}=`;
  const cookie = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(prefix));
  const token = cookie?.slice(prefix.length) ?? '';
  return /^[0-9a-f]{64}$/.test(token) ? token : null;
};

export type AccessSession = { readonly token: string; readonly expiresAt: Date };

/** Returns a new session for a valid, unrevoked, unexpired code in this area. */
export const redeemAccessCode = async (
  db: D1Database,
  area: ExclusiveArea,
  code: string,
  now: Date = new Date(),
): Promise<AccessSession | null> => {
  if (normalizeAccessCode(code).length < 6) return null;
  const nowIso = now.toISOString();
  const row = await db.prepare(
    `SELECT id, expires_at FROM access_codes
     WHERE code_hash = ? AND area = ? AND revoked_at IS NULL
       AND (expires_at IS NULL OR expires_at > ?)`,
  ).bind(await hashAccessCode(code), area.area, nowIso).first<{ id: number; expires_at: string | null }>();
  if (!row) return null;

  const sessionEnd = now.getTime() + SESSION_DURATION_MS;
  const codeEnd = row.expires_at ? Date.parse(row.expires_at) : Infinity;
  const expiresAt = new Date(Math.min(sessionEnd, codeEnd));
  const token = randomToken();

  await db.prepare(
    'INSERT INTO access_sessions (id, code_id, area, expires_at) VALUES (?, ?, ?, ?)',
  ).bind(token, row.id, area.area, expiresAt.toISOString()).run();
  await db.prepare(
    'UPDATE access_codes SET last_used_at = ?, use_count = use_count + 1 WHERE id = ?',
  ).bind(nowIso, row.id).run();

  return { token, expiresAt };
};

/** A session stays valid only while its code is still active. */
export const hasValidAccessSession = async (
  db: D1Database,
  area: ExclusiveArea,
  token: string | null,
  now: Date = new Date(),
): Promise<boolean> => {
  if (!token) return false;
  const nowIso = now.toISOString();
  const row = await db.prepare(
    `SELECT s.id FROM access_sessions s
     JOIN access_codes c ON c.id = s.code_id
     WHERE s.id = ? AND s.area = ? AND s.expires_at > ?
       AND c.revoked_at IS NULL AND (c.expires_at IS NULL OR c.expires_at > ?)`,
  ).bind(token, area.area, nowIso, nowIso).first();
  return Boolean(row);
};

// ============= Admin management =============

export type AccessCodeSummary = {
  id: number;
  area: string;
  label: string;
  expires_at: string | null;
  revoked_at: string | null;
  last_used_at: string | null;
  use_count: number;
  created_at: string;
};

export const listAccessCodes = async (db: D1Database): Promise<AccessCodeSummary[]> => {
  const result = await db.prepare(
    `SELECT id, area, label, expires_at, revoked_at, last_used_at, use_count, created_at
     FROM access_codes ORDER BY created_at DESC`,
  ).all<AccessCodeSummary>();
  return result.results || [];
};

export type AccessCodeDraft = { area: ExclusiveArea; label: string; expiresAt: string | null };

export const validateAccessCodeDraft = (
  payload: unknown,
  now: Date = new Date(),
): { success: true; data: AccessCodeDraft } | { success: false; error: string } => {
  const body = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
  const area = getExclusiveAreaByName(typeof body.area === 'string' ? body.area : null);
  if (!area) return { success: false, error: 'Unknown access area' };
  const label = typeof body.label === 'string' ? body.label.trim() : '';
  if (label.length < 1 || label.length > 120) return { success: false, error: 'Label must be 1 to 120 characters' };
  let expiresAt: string | null = null;
  if (body.expiresAt != null && body.expiresAt !== '') {
    const parsed = typeof body.expiresAt === 'string' ? Date.parse(body.expiresAt) : NaN;
    if (!Number.isFinite(parsed) || parsed <= now.getTime()) {
      return { success: false, error: 'Expiry must be a future date' };
    }
    expiresAt = new Date(parsed).toISOString();
  }
  return { success: true, data: { area, label, expiresAt } };
};

/** Creates a code and returns its plain text once; only the hash is stored. */
export const createAccessCode = async (
  db: D1Database,
  draft: AccessCodeDraft,
  userId: number,
): Promise<{ id: number; code: string }> => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = generateAccessCode();
    const codeHash = await hashAccessCode(code);
    const existing = await db.prepare('SELECT id FROM access_codes WHERE code_hash = ?').bind(codeHash).first();
    if (existing) continue;
    const result = await db.prepare(
      'INSERT INTO access_codes (area, label, code_hash, expires_at, created_by) VALUES (?, ?, ?, ?, ?)',
    ).bind(draft.area.area, draft.label, codeHash, draft.expiresAt, userId).run();
    return { id: Number(result.meta.last_row_id), code };
  }
  throw new Error('Could not allocate a unique access code');
};

/** Revoking keeps the row for audit and signs out every browser using the code. */
export const revokeAccessCode = async (db: D1Database, id: number, now: Date = new Date()): Promise<boolean> => {
  const result = await db.prepare(
    'UPDATE access_codes SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL',
  ).bind(now.toISOString(), id).run();
  await db.prepare('DELETE FROM access_sessions WHERE code_id = ?').bind(id).run();
  return Number(result.meta.changes) > 0;
};
