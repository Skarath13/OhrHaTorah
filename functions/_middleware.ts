import {
  overrideDefinitionMap,
  sanitizeUrl,
  type Env,
} from './_shared/admin';

interface ActiveOverride {
  key: string;
  value: string;
  field_type: 'text' | 'url';
}

function shouldRewrite(request: Request): boolean {
  const url = new URL(request.url);
  if (request.method !== 'GET') return false;
  if (url.pathname.startsWith('/api/')) return false;
  if (url.pathname.includes('.')) return false;

  const accept = request.headers.get('Accept') || '';
  return accept.includes('text/html') || accept.includes('*/*');
}

export const onRequest: PagesFunction<Env> = async (context) => {
  if (!shouldRewrite(context.request) || !context.env.DB) {
    return context.next();
  }

  const response = await context.next();
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('text/html')) {
    return response;
  }

  const rows = await context.env.DB.prepare(`
    SELECT key, value, field_type
    FROM content_overrides
    WHERE is_active = 1
      AND (expires_at IS NULL OR expires_at > datetime('now'))
  `).all<ActiveOverride>();

  const overrides = new Map<string, ActiveOverride>();
  for (const row of rows.results ?? []) {
    const definition = overrideDefinitionMap.get(row.key);
    if (definition && definition.fieldType === row.field_type) {
      overrides.set(row.key, row);
    }
  }

  if (overrides.size === 0) return response;

  return new HTMLRewriter()
    .on('[data-cms-key]', {
      element(element) {
        const key = element.getAttribute('data-cms-key');
        if (!key) return;

        const override = overrides.get(key);
        const definition = overrideDefinitionMap.get(key);
        if (!override || !definition) return;

        if (definition.fieldType === 'url') {
          const attribute = element.getAttribute('data-cms-attr');
          const safeUrl = sanitizeUrl(override.value);
          if (attribute === 'href' && safeUrl) {
            element.setAttribute('href', safeUrl);
          }
          return;
        }

        element.setInnerContent(override.value, { html: false });
      },
    })
    .transform(response);
};
