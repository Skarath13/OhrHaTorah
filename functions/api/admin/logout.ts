import {
  clearCsrfCookie,
  clearSessionCookie,
  getSessionCookie,
  json,
  type Env,
} from '../../_shared/admin';

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const sessionId = getSessionCookie(request);
  if (sessionId) {
    await env.DB.prepare('DELETE FROM csrf_tokens WHERE session_id = ?').bind(sessionId).run();
    await env.DB.prepare('DELETE FROM admin_sessions WHERE id = ?').bind(sessionId).run();
  }

  const headers = new Headers({ 'Content-Type': 'application/json' });
  headers.append('Set-Cookie', clearSessionCookie());
  headers.append('Set-Cookie', clearCsrfCookie());

  return new Response(JSON.stringify({ success: true }), { status: 200, headers });
};
