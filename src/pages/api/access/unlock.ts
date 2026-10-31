import type { APIRoute } from 'astro';
import {
  clearFailedAttempts,
  getClientIP,
  isIPLockedOut,
  recordFailedAttempt,
} from '../../../lib/auth';
import {
  ACCESS_GATE_PATH,
  createAccessCookie,
  getExclusiveAreaByName,
  redeemAccessCode,
  safeNextPath,
} from '../../../lib/exclusiveAccess';

// Plain form POST from /access. Responds with 303 redirects so it works without JavaScript.
export const POST: APIRoute = async ({ request, locals, url }) => {
  const origin = request.headers.get('Origin');
  if (origin && origin !== url.origin) {
    return new Response('Forbidden', { status: 403 });
  }

  const form = await request.formData().catch(() => null);
  const area = getExclusiveAreaByName(String(form?.get('area') ?? ''));
  if (!area) return new Response(null, { status: 303, headers: { Location: '/' } });

  const next = safeNextPath(String(form?.get('next') ?? ''), area);
  const back = (error: string) => {
    const gate = new URL(ACCESS_GATE_PATH, url);
    gate.searchParams.set('area', area.area);
    gate.searchParams.set('next', next);
    gate.searchParams.set('error', error);
    return new Response(null, {
      status: 303,
      headers: { Location: gate.pathname + gate.search, 'Cache-Control': 'no-store' },
    });
  };

  const db = locals.runtime?.env?.DB;
  if (!db) return back('unavailable');

  try {
    // Separate rate-limit bucket so a mistyped member code never locks admin PIN login.
    const attemptKey = `access:${getClientIP(request)}`;
    if ((await isIPLockedOut(db, attemptKey)).locked) return back('locked');

    const session = await redeemAccessCode(db, area, String(form?.get('code') ?? ''));
    if (!session) {
      const attempt = await recordFailedAttempt(db, attemptKey);
      await new Promise((resolve) => setTimeout(resolve, 500));
      return back(attempt.locked ? 'locked' : 'invalid');
    }

    await clearFailedAttempts(db, attemptKey);
    return new Response(null, {
      status: 303,
      headers: {
        Location: next,
        'Set-Cookie': createAccessCookie(area.area, session.token, session.expiresAt),
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    // Most likely cause before migration 0004 is applied: the access tables do not exist yet.
    console.error(JSON.stringify({
      message: 'access unlock failed',
      error: error instanceof Error ? error.message : String(error),
    }));
    return back('unavailable');
  }
};
