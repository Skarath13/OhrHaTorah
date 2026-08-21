import type { APIRoute } from 'astro';
import {
  TURNSTILE_EXPECTED_HOSTNAME,
  UPDATE_REQUEST_CONSENT,
  UPDATE_REQUEST_SOURCE,
  UpdateRequestMalformedBodyError,
  UpdateRequestPayloadTooLargeError,
  UpdateRequestUnsupportedMediaTypeError,
  isSameOriginRequest,
  parseUpdateRequestBody,
  validateUpdateRequestPayload,
  verifyTurnstile,
  type UpdateRequestQueueMessage,
} from '../../lib/updateRequests.ts';

const RESPONSE_HEADERS = {
  'Cache-Control': 'no-store',
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
};

const JSON_HEADERS = {
  ...RESPONSE_HEADERS,
  'Content-Type': 'application/json; charset=utf-8',
};

function expectsHtml(request: Request): boolean {
  const contentType = request.headers.get('Content-Type')?.toLowerCase() || '';
  return !contentType.startsWith('application/json')
    && (request.headers.get('Accept') || '').toLowerCase().includes('text/html');
}

function acceptedResponse(request: Request): Response {
  if (expectsHtml(request)) {
    return new Response(null, {
      status: 303,
      headers: {
        ...RESPONSE_HEADERS,
        Location: '/?updates=requested#newsletter-form',
      },
    });
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Your update request was received.',
  }), {
    status: 202,
    headers: JSON_HEADERS,
  });
}

function errorResponse(
  request: Request,
  status: number,
  message: string,
  fields?: string[],
): Response {
  if (expectsHtml(request)) {
    return new Response(null, {
      status: 303,
      headers: {
        ...RESPONSE_HEADERS,
        Location: '/?updates=error#newsletter-form',
      },
    });
  }

  return new Response(JSON.stringify({
    success: false,
    error: message,
    ...(fields?.length ? { fields } : {}),
  }), {
    status,
    headers: JSON_HEADERS,
  });
}

function serviceUnavailableResponse(request: Request): Response {
  return errorResponse(
    request,
    503,
    'We could not receive your request right now. Please try again in a moment.',
  );
}

export const POST: APIRoute = async ({ request, locals }) => {
  if (!isSameOriginRequest(request)) {
    return errorResponse(request, 403, 'Unable to verify this request. Please refresh and try again.');
  }

  let rawPayload: Record<string, unknown>;
  try {
    rawPayload = await parseUpdateRequestBody(request);
  } catch (error) {
    if (error instanceof UpdateRequestPayloadTooLargeError) {
      return errorResponse(request, 413, 'The submitted form is too large.');
    }
    if (error instanceof UpdateRequestUnsupportedMediaTypeError) {
      return errorResponse(request, 415, 'This form format is not supported.');
    }
    if (error instanceof UpdateRequestMalformedBodyError) {
      return errorResponse(request, 400, 'Please check the form and try again.');
    }
    return errorResponse(request, 400, 'Please check the form and try again.');
  }

  const validation = validateUpdateRequestPayload(rawPayload);
  if (!validation.ok) {
    return errorResponse(
      request,
      400,
      'Please complete the required fields and try again.',
      validation.fields,
    );
  }

  // A filled honeypot receives the same outward response without consuming
  // Turnstile, database, or queue resources.
  if (validation.bot) return acceptedResponse(request);

  const env = locals.runtime?.env;
  if (
    !env?.FORM_DB
    || !env.UPDATE_REQUEST_QUEUE
    || !env.TURNSTILE_SECRET_KEY
  ) {
    console.error('Update request service bindings are unavailable');
    return serviceUnavailableResponse(request);
  }

  const requestHostname = new URL(request.url).hostname;
  if (requestHostname !== TURNSTILE_EXPECTED_HOSTNAME) {
    return errorResponse(request, 403, 'Unable to verify this request. Please refresh and try again.');
  }

  const requestId = validation.value.submissionId || crypto.randomUUID();
  const turnstileAccepted = await verifyTurnstile({
    secret: env.TURNSTILE_SECRET_KEY,
    token: validation.value.turnstileToken,
    idempotencyKey: requestId,
    expectedHostname: requestHostname,
  });
  if (!turnstileAccepted) {
    return errorResponse(request, 403, 'Unable to verify this request. Please refresh and try again.');
  }

  const outboxId = `outbox:${requestId}`;
  const now = new Date().toISOString();
  try {
    const results = await env.FORM_DB.batch([
      env.FORM_DB.prepare(`
        INSERT INTO update_requests (
          id,
          first_name,
          last_name,
          email,
          phone,
          consent_text,
          consented_at,
          source,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(
        requestId,
        validation.value.firstName,
        validation.value.lastName,
        validation.value.email,
        validation.value.phone,
        UPDATE_REQUEST_CONSENT.text,
        now,
        UPDATE_REQUEST_SOURCE,
        now,
      ),
      env.FORM_DB.prepare(`
        INSERT INTO update_request_outbox (
          id,
          request_id,
          status,
          attempts,
          created_at,
          updated_at
        ) VALUES (?, ?, 'pending', 0, ?, ?)
        ON CONFLICT(id) DO NOTHING
      `).bind(outboxId, requestId, now, now),
    ]);

    if (results.some((result) => !result.success)) {
      throw new Error('D1 batch reported an unsuccessful result');
    }
  } catch {
    console.error('Update request persistence failed', { requestId });
    return serviceUnavailableResponse(request);
  }

  try {
    const message: UpdateRequestQueueMessage = { version: 1, outboxId };
    await env.UPDATE_REQUEST_QUEUE.send(message);
  } catch {
    // The durable pending outbox row remains available. A retry with the same
    // submission ID is idempotent and can enqueue it again without duplicating
    // the request or its eventual email.
    console.error('Update request enqueue failed', { outboxId });
    return serviceUnavailableResponse(request);
  }

  return acceptedResponse(request);
};

export const ALL: APIRoute = async ({ request }) => new Response(JSON.stringify({
  success: false,
  error: 'Method not allowed.',
}), {
  status: 405,
  headers: {
    ...JSON_HEADERS,
    Allow: 'POST',
  },
});
