import bcrypt from 'bcryptjs';

// Types for Cloudflare bindings
export interface Env {
  DB: D1Database;
  IMAGES: R2Bucket;
}

export interface User {
  id: number;
  name: string;
  pin_hash: string;
  role: 'admin' | 'editor';
  created_at: string;
  last_login: string | null;
}

export interface Session {
  id: string;
  user_id: number;
  expires_at: string;
  created_at: string;
}

export interface LoginAttempt {
  ip_address: string;
  attempts: number;
  first_attempt_at: string;
  locked_until: string | null;
}

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

// Rate limiting config
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const ATTEMPT_WINDOW_MS = 60 * 60 * 1000; // 1 hour window for attempts

// CSRF token duration: 24 hours
const CSRF_TOKEN_DURATION_MS = 24 * 60 * 60 * 1000;

/**
 * Hash a 6-digit PIN using bcrypt
 */
export async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pin, salt);
}

/**
 * Verify a PIN against a stored hash
 */
export async function verifyPin(pin: string, hash: string): Promise<boolean> {
  return bcrypt.compare(pin, hash);
}

/**
 * Generate a secure random session token
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Create a new session in the database
 */
export async function createSession(db: D1Database, userId: number): Promise<string> {
  const sessionId = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString();

  await db.prepare(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)'
  ).bind(sessionId, userId, expiresAt).run();

  // Update last login time
  await db.prepare(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?'
  ).bind(userId).run();

  return sessionId;
}

/**
 * Validate a session and return the user if valid
 */
export async function validateSession(db: D1Database, sessionId: string): Promise<User | null> {
  if (!sessionId) return null;

  const result = await db.prepare(`
    SELECT u.id, u.name, u.pin_hash, u.role, u.created_at, u.last_login
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND s.expires_at > datetime('now')
  `).bind(sessionId).first<User>();

  return result || null;
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE id = ?').bind(sessionId).run();
}

/**
 * Clean up expired sessions (can be called periodically)
 */
export async function cleanupExpiredSessions(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

/**
 * Get user by ID
 */
export async function getUserById(db: D1Database, userId: number): Promise<User | null> {
  const result = await db.prepare(
    'SELECT id, name, pin_hash, role, created_at, last_login FROM users WHERE id = ?'
  ).bind(userId).first<User>();

  return result || null;
}

/**
 * Get all users (admin only)
 */
export async function getAllUsers(db: D1Database): Promise<Omit<User, 'pin_hash'>[]> {
  const result = await db.prepare(
    'SELECT id, name, role, created_at, last_login FROM users ORDER BY name'
  ).all<Omit<User, 'pin_hash'>>();

  return result.results || [];
}

/**
 * Create a new user with a PIN
 */
export async function createUser(
  db: D1Database,
  name: string,
  pin: string,
  role: 'admin' | 'editor' = 'editor'
): Promise<number> {
  const pinHash = await hashPin(pin);

  const result = await db.prepare(
    'INSERT INTO users (name, pin_hash, role) VALUES (?, ?, ?)'
  ).bind(name, pinHash, role).run();

  return result.meta.last_row_id as number;
}

/**
 * Update a user's PIN
 */
export async function updateUserPin(db: D1Database, userId: number, newPin: string): Promise<void> {
  const pinHash = await hashPin(newPin);
  await db.prepare('UPDATE users SET pin_hash = ? WHERE id = ?').bind(pinHash, userId).run();
}

/**
 * Delete a user and their sessions
 */
export async function deleteUser(db: D1Database, userId: number): Promise<void> {
  await db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(userId).run();
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();
}

/**
 * Verify login credentials and return user if valid
 */
export async function verifyLogin(db: D1Database, pin: string): Promise<User | null> {
  // Get all users and check PIN against each (since we only have 1-3 users, this is fine)
  const users = await db.prepare(
    'SELECT id, name, pin_hash, role, created_at, last_login FROM users'
  ).all<User>();

  for (const user of users.results || []) {
    const isValid = await verifyPin(pin, user.pin_hash);
    if (isValid) {
      return user;
    }
  }

  return null;
}

/**
 * Parse session cookie from request
 */
export function getSessionFromCookies(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const sessionCookie = cookies.find(c => c.startsWith('oht_session='));

  if (!sessionCookie) return null;

  return sessionCookie.split('=')[1] || null;
}

/**
 * Create a Set-Cookie header for the session
 */
export function createSessionCookie(sessionId: string, maxAge: number = SESSION_DURATION_MS / 1000): string {
  // Main session cookie (HttpOnly for security)
  return `oht_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create a non-HttpOnly cookie to indicate logged-in status to JavaScript
 * This doesn't contain any sensitive data, just indicates auth status
 */
export function createAuthIndicatorCookie(maxAge: number = SESSION_DURATION_MS / 1000): string {
  return `oht_logged_in=1; Path=/; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create a cookie that clears the session
 */
export function createLogoutCookie(): string {
  return 'oht_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}

/**
 * Create a cookie that clears the auth indicator
 */
export function createLogoutIndicatorCookie(): string {
  return 'oht_logged_in=; Path=/; SameSite=Strict; Max-Age=0';
}

// ============= Rate Limiting Functions =============

/**
 * Check if an IP is currently locked out
 */
export async function isIPLockedOut(db: D1Database, ipAddress: string): Promise<{ locked: boolean; remainingSeconds?: number }> {
  const attempt = await db.prepare(
    'SELECT locked_until FROM login_attempts WHERE ip_address = ?'
  ).bind(ipAddress).first<{ locked_until: string | null }>();

  if (!attempt?.locked_until) {
    return { locked: false };
  }

  const lockedUntil = new Date(attempt.locked_until);
  const now = new Date();

  if (lockedUntil > now) {
    const remainingSeconds = Math.ceil((lockedUntil.getTime() - now.getTime()) / 1000);
    return { locked: true, remainingSeconds };
  }

  return { locked: false };
}

/**
 * Record a failed login attempt and return whether the IP is now locked
 */
export async function recordFailedAttempt(db: D1Database, ipAddress: string): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - ATTEMPT_WINDOW_MS);

  // Get current attempts
  const existing = await db.prepare(
    'SELECT attempts, first_attempt_at FROM login_attempts WHERE ip_address = ?'
  ).bind(ipAddress).first<{ attempts: number; first_attempt_at: string }>();

  let newAttempts = 1;

  if (existing) {
    const firstAttempt = new Date(existing.first_attempt_at);

    // If first attempt is outside the window, reset the counter
    if (firstAttempt < windowStart) {
      await db.prepare(
        'UPDATE login_attempts SET attempts = 1, first_attempt_at = ?, locked_until = NULL WHERE ip_address = ?'
      ).bind(now.toISOString(), ipAddress).run();
    } else {
      // Increment attempts
      newAttempts = existing.attempts + 1;

      if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
        // Lock the IP
        const lockedUntil = new Date(now.getTime() + LOCKOUT_DURATION_MS);
        await db.prepare(
          'UPDATE login_attempts SET attempts = ?, locked_until = ? WHERE ip_address = ?'
        ).bind(newAttempts, lockedUntil.toISOString(), ipAddress).run();

        return { locked: true, attemptsRemaining: 0 };
      } else {
        await db.prepare(
          'UPDATE login_attempts SET attempts = ? WHERE ip_address = ?'
        ).bind(newAttempts, ipAddress).run();
      }
    }
  } else {
    // First attempt from this IP
    await db.prepare(
      'INSERT INTO login_attempts (ip_address, attempts, first_attempt_at) VALUES (?, 1, ?)'
    ).bind(ipAddress, now.toISOString()).run();
  }

  return { locked: false, attemptsRemaining: MAX_LOGIN_ATTEMPTS - newAttempts };
}

/**
 * Clear failed attempts after successful login
 */
export async function clearFailedAttempts(db: D1Database, ipAddress: string): Promise<void> {
  await db.prepare('DELETE FROM login_attempts WHERE ip_address = ?').bind(ipAddress).run();
}

/**
 * Clean up old login attempts (call periodically)
 */
export async function cleanupLoginAttempts(db: D1Database): Promise<void> {
  const cutoff = new Date(Date.now() - ATTEMPT_WINDOW_MS).toISOString();
  await db.prepare(
    "DELETE FROM login_attempts WHERE first_attempt_at < ? AND (locked_until IS NULL OR locked_until < datetime('now'))"
  ).bind(cutoff).run();
}

// ============= CSRF Protection Functions =============

/**
 * Generate a CSRF token for a session
 */
export async function generateCSRFToken(db: D1Database, sessionId: string): Promise<string> {
  const token = generateSessionToken(); // Reuse the secure random generator
  const expiresAt = new Date(Date.now() + CSRF_TOKEN_DURATION_MS).toISOString();

  await db.prepare(
    'INSERT INTO csrf_tokens (token, session_id, expires_at) VALUES (?, ?, ?)'
  ).bind(token, sessionId, expiresAt).run();

  return token;
}

/**
 * Validate a CSRF token
 */
export async function validateCSRFToken(db: D1Database, token: string, sessionId: string): Promise<boolean> {
  if (!token || !sessionId) return false;

  const result = await db.prepare(
    "SELECT token FROM csrf_tokens WHERE token = ? AND session_id = ? AND expires_at > datetime('now')"
  ).bind(token, sessionId).first();

  return !!result;
}

/**
 * Delete expired CSRF tokens (call periodically)
 */
export async function cleanupCSRFTokens(db: D1Database): Promise<void> {
  await db.prepare("DELETE FROM csrf_tokens WHERE expires_at < datetime('now')").run();
}

/**
 * Delete all CSRF tokens for a session (on logout)
 */
export async function deleteSessionCSRFTokens(db: D1Database, sessionId: string): Promise<void> {
  await db.prepare('DELETE FROM csrf_tokens WHERE session_id = ?').bind(sessionId).run();
}

/**
 * Get CSRF token from request headers
 */
export function getCSRFTokenFromRequest(request: Request): string | null {
  return request.headers.get('X-CSRF-Token');
}

/**
 * Create a Set-Cookie header for the CSRF token (non-HttpOnly so JS can read it)
 */
export function createCSRFCookie(token: string, maxAge: number = CSRF_TOKEN_DURATION_MS / 1000): string {
  return `oht_csrf=${token}; Path=/; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create a cookie that clears the CSRF token
 */
export function createCSRFLogoutCookie(): string {
  return 'oht_csrf=; Path=/; SameSite=Strict; Max-Age=0';
}
