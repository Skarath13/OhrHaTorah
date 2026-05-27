export interface Env {
  DB: D1Database;
}

export interface AdminUser {
  id: number;
  name: string;
  role: 'admin' | 'editor';
}

export interface OverrideDefinition {
  key: string;
  label: string;
  fieldType: 'text' | 'url';
  category: string;
}

export interface AuthContext {
  user: AdminUser;
  sessionId: string;
}

const SESSION_COOKIE = 'oht_admin_session';
const CSRF_COOKIE = 'oht_admin_csrf';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;
const CSRF_DURATION_SECONDS = 24 * 60 * 60;
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 15 * 60;
const ATTEMPT_WINDOW_SECONDS = 60 * 60;

export const overrideDefinitions: OverrideDefinition[] = [
  { key: 'home.hero.heading', label: 'Hero heading', fieldType: 'text', category: 'Hero' },
  { key: 'home.hero.subheading', label: 'Hero subheading', fieldType: 'text', category: 'Hero' },
  { key: 'home.hero.primaryCta.label', label: 'Primary CTA label', fieldType: 'text', category: 'Hero' },
  { key: 'home.hero.primaryCta.href', label: 'Primary CTA URL', fieldType: 'url', category: 'Hero' },
  { key: 'home.hero.secondaryCta.label', label: 'Secondary CTA label', fieldType: 'text', category: 'Hero' },
  { key: 'home.hero.secondaryCta.href', label: 'Secondary CTA URL', fieldType: 'url', category: 'Hero' },
  { key: 'home.service.fridayTime', label: 'Friday time', fieldType: 'text', category: 'Service Times' },
  { key: 'home.service.shabbatTime', label: 'Shabbat time', fieldType: 'text', category: 'Service Times' },
  { key: 'home.service.torahStudy', label: 'Torah study note', fieldType: 'text', category: 'Service Times' },
  { key: 'home.service.location', label: 'Service location', fieldType: 'text', category: 'Service Times' },
  { key: 'home.gatherings.0.title', label: 'Gathering 1 title', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.gatherings.0.time', label: 'Gathering 1 time', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.gatherings.1.title', label: 'Gathering 2 title', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.gatherings.1.time', label: 'Gathering 2 time', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.gatherings.2.title', label: 'Gathering 3 title', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.gatherings.2.time', label: 'Gathering 3 time', fieldType: 'text', category: 'Gatherings' },
  { key: 'home.welcome.title', label: 'Welcome title', fieldType: 'text', category: 'Welcome' },
  { key: 'home.welcome.body', label: 'Welcome body', fieldType: 'text', category: 'Welcome' },
  { key: 'home.welcome.cta.label', label: 'Welcome CTA label', fieldType: 'text', category: 'Welcome' },
  { key: 'home.welcome.cta.href', label: 'Welcome CTA URL', fieldType: 'url', category: 'Welcome' },
  { key: 'home.quote.text', label: 'Quote text', fieldType: 'text', category: 'Quote' },
  { key: 'home.quote.reference', label: 'Quote reference', fieldType: 'text', category: 'Quote' },
  { key: 'home.visit.title', label: 'Visit title', fieldType: 'text', category: 'Visit' },
  { key: 'home.visit.body', label: 'Visit body', fieldType: 'text', category: 'Visit' },
  { key: 'home.visit.cta.label', label: 'Directions CTA label', fieldType: 'text', category: 'Visit' },
  { key: 'home.visit.cta.href', label: 'Directions URL', fieldType: 'url', category: 'Visit' },
  { key: 'home.visit.address', label: 'Address', fieldType: 'text', category: 'Visit' },
  { key: 'home.newsletter.title', label: 'Newsletter title', fieldType: 'text', category: 'Stay Connected' },
  { key: 'home.newsletter.body', label: 'Newsletter body', fieldType: 'text', category: 'Stay Connected' },
  { key: 'home.newsletter.button', label: 'Newsletter button', fieldType: 'text', category: 'Stay Connected' },
  { key: 'home.footer.tagline', label: 'Footer tagline', fieldType: 'text', category: 'Footer' },
  { key: 'home.footer.unity', label: 'Footer unity line', fieldType: 'text', category: 'Footer' },
];

export const overrideDefinitionMap = new Map(overrideDefinitions.map(item => [item.key, item]));

export function json(data: unknown, init: ResponseInit = {}): Response {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });
}

export function parseCookies(cookieHeader: string | null): Map<string, string> {
  const cookies = new Map<string, string>();
  if (!cookieHeader) return cookies;

  for (const part of cookieHeader.split(';')) {
    const [rawName, ...rawValue] = part.trim().split('=');
    if (!rawName || rawValue.length === 0) continue;
    cookies.set(rawName, decodeURIComponent(rawValue.join('=')));
  }

  return cookies;
}

export function getSessionCookie(request: Request): string | null {
  return parseCookies(request.headers.get('Cookie')).get(SESSION_COOKIE) ?? null;
}

export function getCsrfCookie(request: Request): string | null {
  return parseCookies(request.headers.get('Cookie')).get(CSRF_COOKIE) ?? null;
}

export function createCookie(name: string, value: string, maxAge: number, httpOnly: boolean): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Strict',
    `Max-Age=${maxAge}`,
  ];
  if (httpOnly) parts.push('HttpOnly');
  return parts.join('; ');
}

export function clearCookie(name: string, httpOnly: boolean): string {
  return createCookie(name, '', 0, httpOnly);
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function randomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

export function randomToken(): string {
  return bytesToBase64(randomBytes(32)).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
}

export async function verifyPin(pin: string, storedHash: string): Promise<boolean> {
  if (!/^\d{6}$/.test(pin)) return false;

  const [algorithm, iterationText, saltText, hashText] = storedHash.split('$');
  if (algorithm !== 'pbkdf2-sha256' || !iterationText || !saltText || !hashText) return false;

  const iterations = Number.parseInt(iterationText, 10);
  if (!Number.isInteger(iterations) || iterations < 100000) return false;

  const salt = base64ToBytes(saltText);
  const expected = base64ToBytes(hashText);
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: toArrayBuffer(salt),
      iterations,
    },
    key,
    expected.byteLength * 8
  );
  const actual = new Uint8Array(bits);
  if (actual.byteLength !== expected.byteLength) return false;

  let diff = 0;
  for (let index = 0; index < actual.byteLength; index += 1) {
    diff |= actual[index] ^ expected[index];
  }
  return diff === 0;
}

export function getClientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    || request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    || 'unknown';
}

export async function isLockedOut(db: D1Database, ipAddress: string): Promise<{ locked: boolean; remainingSeconds: number }> {
  const row = await db.prepare(
    'SELECT locked_until FROM login_attempts WHERE ip_address = ?'
  ).bind(ipAddress).first<{ locked_until: string | null }>();

  if (!row?.locked_until) return { locked: false, remainingSeconds: 0 };

  const remainingMs = new Date(row.locked_until).getTime() - Date.now();
  if (remainingMs <= 0) return { locked: false, remainingSeconds: 0 };

  return { locked: true, remainingSeconds: Math.ceil(remainingMs / 1000) };
}

export async function recordFailedAttempt(db: D1Database, ipAddress: string): Promise<void> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_SECONDS * 1000);
  const existing = await db.prepare(
    'SELECT attempts, first_attempt_at FROM login_attempts WHERE ip_address = ?'
  ).bind(ipAddress).first<{ attempts: number; first_attempt_at: string }>();

  if (!existing || new Date(existing.first_attempt_at) < windowStart) {
    await db.prepare(
      'INSERT INTO login_attempts (ip_address, attempts, first_attempt_at, locked_until) VALUES (?, 1, ?, NULL) ON CONFLICT(ip_address) DO UPDATE SET attempts = 1, first_attempt_at = excluded.first_attempt_at, locked_until = NULL'
    ).bind(ipAddress, now.toISOString()).run();
    return;
  }

  const attempts = existing.attempts + 1;
  const lockedUntil = attempts >= MAX_LOGIN_ATTEMPTS
    ? new Date(now.getTime() + LOCKOUT_SECONDS * 1000).toISOString()
    : null;

  await db.prepare(
    'UPDATE login_attempts SET attempts = ?, locked_until = ? WHERE ip_address = ?'
  ).bind(attempts, lockedUntil, ipAddress).run();
}

export async function clearFailedAttempts(db: D1Database, ipAddress: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE ip_address = ?').bind(ipAddress).run();
}

export async function createSession(db: D1Database, userId: number): Promise<{ sessionId: string; csrfToken: string }> {
  const sessionId = randomToken();
  const csrfToken = randomToken();
  const sessionExpiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000).toISOString();
  const csrfExpiresAt = new Date(Date.now() + CSRF_DURATION_SECONDS * 1000).toISOString();

  await db.prepare(
    'INSERT INTO admin_sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, userId, sessionExpiresAt).run();

  await db.prepare(
    'INSERT INTO csrf_tokens (token, session_id, expires_at) VALUES (?, ?, ?)'
  ).bind(csrfToken, sessionId, csrfExpiresAt).run();

  await db.prepare(
    'UPDATE admin_users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(userId).run();

  return { sessionId, csrfToken };
}

export async function requireAdmin(request: Request, env: Env): Promise<AuthContext | Response> {
  const sessionId = getSessionCookie(request);
  if (!sessionId) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const user = await env.DB.prepare(`
    SELECT u.id, u.name, u.role
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first<AdminUser>();

  if (!user) {
    return json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  return { user, sessionId };
}

export async function requireCsrf(request: Request, env: Env, sessionId: string): Promise<Response | null> {
  const headerToken = request.headers.get('X-CSRF-Token');
  const cookieToken = getCsrfCookie(request);
  if (!headerToken || !cookieToken) {
    return json({ success: false, error: 'Missing CSRF token' }, { status: 403 });
  }

  if (headerToken !== cookieToken) {
    return json({ success: false, error: 'Invalid CSRF token' }, { status: 403 });
  }

  const row = await env.DB.prepare(
    "SELECT token FROM csrf_tokens WHERE token = ? AND session_id = ? AND expires_at > datetime('now')"
  ).bind(headerToken, sessionId).first<{ token: string }>();

  if (!row) {
    return json({ success: false, error: 'Invalid CSRF token' }, { status: 403 });
  }

  return null;
}

export function sessionCookie(sessionId: string): string {
  return createCookie(SESSION_COOKIE, sessionId, SESSION_DURATION_SECONDS, true);
}

export function csrfCookie(csrfToken: string): string {
  return createCookie(CSRF_COOKIE, csrfToken, CSRF_DURATION_SECONDS, false);
}

export function clearSessionCookie(): string {
  return clearCookie(SESSION_COOKIE, true);
}

export function clearCsrfCookie(): string {
  return clearCookie(CSRF_COOKIE, false);
}

export function sanitizeUrl(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    if (url.protocol === 'https:') return url.toString();
  } catch {
    return null;
  }

  return null;
}

export async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const value = await request.json();
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
    return value as Record<string, unknown>;
  } catch {
    return null;
  }
}
