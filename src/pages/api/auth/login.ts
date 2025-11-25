import type { APIRoute } from 'astro';
import {
  verifyLogin,
  createSession,
  createSessionCookie,
  createAuthIndicatorCookie,
  isIPLockedOut,
  recordFailedAttempt,
  clearFailedAttempts,
  generateCSRFToken,
  createCSRFCookie
} from '../../../lib/auth';

/**
 * Get client IP address from request headers
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the real IP in CF-Connecting-IP header
  const cfIP = request.headers.get('CF-Connecting-IP');
  if (cfIP) return cfIP;

  // Fallback to X-Forwarded-For
  const forwarded = request.headers.get('X-Forwarded-For');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  // Fallback to X-Real-IP
  const realIP = request.headers.get('X-Real-IP');
  if (realIP) return realIP;

  // Default fallback
  return 'unknown';
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = runtime.env.DB;
    const clientIP = getClientIP(request);

    // Check if IP is locked out
    const lockStatus = await isIPLockedOut(db, clientIP);
    if (lockStatus.locked) {
      const minutes = Math.ceil((lockStatus.remainingSeconds || 0) / 60);
      return new Response(
        JSON.stringify({
          success: false,
          error: `Too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`,
          locked: true,
          remainingSeconds: lockStatus.remainingSeconds
        }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { pin } = body;

    // Validate PIN format
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the PIN
    const user = await verifyLogin(db, pin);

    if (!user) {
      // Record failed attempt
      const attemptResult = await recordFailedAttempt(db, clientIP);

      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));

      let errorMessage = 'Invalid PIN';
      if (attemptResult.locked) {
        errorMessage = 'Too many failed attempts. Account locked for 15 minutes.';
      } else if (attemptResult.attemptsRemaining <= 2) {
        errorMessage = `Invalid PIN. ${attemptResult.attemptsRemaining} attempt${attemptResult.attemptsRemaining !== 1 ? 's' : ''} remaining.`;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          locked: attemptResult.locked,
          attemptsRemaining: attemptResult.attemptsRemaining
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Clear failed attempts on successful login
    await clearFailedAttempts(db, clientIP);

    // Create session
    const sessionId = await createSession(db, user.id);
    const sessionCookie = createSessionCookie(sessionId);
    const indicatorCookie = createAuthIndicatorCookie();

    // Generate CSRF token for this session
    const csrfToken = await generateCSRFToken(db, sessionId);
    const csrfCookie = createCSRFCookie(csrfToken);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, name: user.name, role: user.role }
      }),
      {
        status: 200,
        headers: [
          ['Content-Type', 'application/json'],
          ['Set-Cookie', sessionCookie],
          ['Set-Cookie', indicatorCookie],
          ['Set-Cookie', csrfCookie],
        ],
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
