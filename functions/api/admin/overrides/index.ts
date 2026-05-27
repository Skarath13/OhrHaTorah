import {
  json,
  overrideDefinitions,
  requireAdmin,
  type Env,
} from '../../../_shared/admin';

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const auth = await requireAdmin(request, env);
  if (auth instanceof Response) return auth;

  const overrides = await env.DB.prepare(`
    SELECT key, value, field_type, label, is_active, expires_at, updated_at, updated_by
    FROM content_overrides
    ORDER BY key ASC
  `).all<{
    key: string;
    value: string;
    field_type: 'text' | 'url';
    label: string | null;
    is_active: number;
    expires_at: string | null;
    updated_at: string;
    updated_by: number | null;
  }>();

  return json({
    success: true,
    definitions: overrideDefinitions,
    overrides: overrides.results ?? [],
    user: auth.user,
  });
};
