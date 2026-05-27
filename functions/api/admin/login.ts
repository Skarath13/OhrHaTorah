import {
  clearFailedAttempts,
  createSession,
  csrfCookie,
  getClientIp,
  isLockedOut,
  json,
  readJson,
  recordFailedAttempt,
  sessionCookie,
  verifyPin,
  type Env,
} from '../../_shared/admin';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await readJson(request);
  const pin = typeof body?.pin === 'string' ? body.pin : '';
  const ipAddress = getClientIp(request);

  const lockout = await isLockedOut(env.DB, ipAddress);
  if (lockout.locked) {
    return json(
      { success: false, error: `Too many attempts. Try again in ${lockout.remainingSeconds} seconds.` },
      { status: 429 }
    );
  }

  const users = await env.DB.prepare(
    'SELECT id, name, pin_hash, role FROM admin_users ORDER BY id ASC'
  ).all<{ id: number; name: string; pin_hash: string; role: 'admin' | 'editor' }>();

  for (const user of users.results ?? []) {
    if (await verifyPin(pin, user.pin_hash)) {
      await clearFailedAttempts(env.DB, ipAddress);
      const { sessionId, csrfToken } = await createSession(env.DB, user.id);
      const headers = new Headers({ 'Content-Type': 'application/json' });
      headers.append('Set-Cookie', sessionCookie(sessionId));
      headers.append('Set-Cookie', csrfCookie(csrfToken));

      return new Response(JSON.stringify({
        success: true,
        csrfToken,
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
        },
      }), { status: 200, headers });
    }
  }

  await recordFailedAttempt(env.DB, ipAddress);
  return json({ success: false, error: 'Invalid PIN' }, { status: 401 });
};
