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

// Session duration: 7 days
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

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
  return `oht_session=${sessionId}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}`;
}

/**
 * Create a cookie that clears the session
 */
export function createLogoutCookie(): string {
  return 'oht_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0';
}
