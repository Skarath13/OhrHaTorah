import type { APIRoute } from 'astro';
import { verifyLogin, createSession, createSessionCookie } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { pin } = body;

    // Validate PIN format
    if (!pin || typeof pin !== 'string' || !/^\d{6}$/.test(pin)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const runtime = locals.runtime;
    if (!runtime?.env?.DB) {
      return new Response(
        JSON.stringify({ success: false, error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const db = runtime.env.DB;

    // Verify the PIN
    const user = await verifyLogin(db, pin);

    if (!user) {
      // Add a small delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 500));
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid PIN' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session
    const sessionId = await createSession(db, user.id);
    const cookie = createSessionCookie(sessionId);

    return new Response(
      JSON.stringify({
        success: true,
        user: { id: user.id, name: user.name, role: user.role }
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Set-Cookie': cookie,
        },
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
