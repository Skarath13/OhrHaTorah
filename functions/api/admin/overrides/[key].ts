import {
  json,
  overrideDefinitionMap,
  readJson,
  requireAdmin,
  requireCsrf,
  sanitizeUrl,
  type Env,
} from '../../../_shared/admin';

function getKey(params: Record<string, string | string[]>): string {
  const raw = params.key;
  return Array.isArray(raw) ? raw.join('/') : raw;
}

export const onRequestPut: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const csrfError = await requireCsrf(request, env, auth.sessionId);
  if (csrfError) return csrfError;

  const key = decodeURIComponent(getKey(params));
  const definition = overrideDefinitionMap.get(key);
  if (!definition) {
    return json({ success: false, error: 'Unknown override key' }, { status: 400 });
  }

  const body = await readJson(request);
  const rawValue = typeof body?.value === 'string' ? body.value.trim() : '';
  const expiresAt = typeof body?.expiresAt === 'string' && body.expiresAt.trim()
    ? body.expiresAt.trim()
    : null;

  if (!rawValue) {
    return json({ success: false, error: 'Value is required' }, { status: 400 });
  }

  const value = definition.fieldType === 'url' ? sanitizeUrl(rawValue) : rawValue.slice(0, 1000);
  if (!value) {
    return json({ success: false, error: 'Invalid URL. Use a site path, hash, mailto, tel, or HTTPS URL.' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT value FROM content_overrides WHERE key = ?'
  ).bind(key).first<{ value: string }>();
  const changeType = existing ? 'update' : 'create';

  await env.DB.prepare(`
    INSERT INTO content_overrides (key, value, field_type, label, is_active, expires_at, created_at, updated_at, updated_by)
    VALUES (?, ?, ?, ?, 1, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      field_type = excluded.field_type,
      label = excluded.label,
      is_active = 1,
      expires_at = excluded.expires_at,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = excluded.updated_by
  `).bind(key, value, definition.fieldType, definition.label, expiresAt, auth.user.id).run();

  await env.DB.prepare(`
    INSERT INTO content_override_revisions (content_key, old_value, new_value, field_type, change_type, changed_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(key, existing?.value ?? null, value, definition.fieldType, changeType, auth.user.id).run();

  return json({ success: true });
};

export const onRequestDelete: PagesFunction<Env> = async ({ request, env, params }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const csrfError = await requireCsrf(request, env, auth.sessionId);
  if (csrfError) return csrfError;

  const key = decodeURIComponent(getKey(params));
  const definition = overrideDefinitionMap.get(key);
  if (!definition) {
    return json({ success: false, error: 'Unknown override key' }, { status: 400 });
  }

  const existing = await env.DB.prepare(
    'SELECT value, field_type FROM content_overrides WHERE key = ?'
  ).bind(key).first<{ value: string; field_type: 'text' | 'url' }>();

  if (existing) {
    await env.DB.prepare('DELETE FROM content_overrides WHERE key = ?').bind(key).run();
    await env.DB.prepare(`
      INSERT INTO content_override_revisions (content_key, old_value, new_value, field_type, change_type, changed_by)
      VALUES (?, ?, '', ?, 'delete', ?)
    `).bind(key, existing.value, existing.field_type, auth.user.id).run();
  }

  return json({ success: true });
};
