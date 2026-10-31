// Admin edits saved in `site_content` override the default copy written in the
// page source. Pages render defaults when no override exists or D1 is
// unavailable, so a missing database never blanks the public site.
import { parseRichDocument, renderRichDocument, renderRichInline, safeHref } from './richText.ts';

export type SiteContentEntry = { value: string; contentType: 'text' | 'html' | 'json' };
export type SiteContentMap = ReadonlyMap<string, SiteContentEntry>;

export const SITE_CONTENT_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{0,159}$/;

export const loadSiteContent = async (db: D1Database): Promise<SiteContentMap> => {
  const result = await db.prepare(
    "SELECT key, value, content_type FROM site_content WHERE key NOT LIKE 'brit-chadashah:%'",
  ).all<{ key: string; value: string; content_type: SiteContentEntry['contentType'] }>();
  return new Map((result.results || []).map((row) => [row.key, { value: row.value, contentType: row.content_type }]));
};

const escapeText = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');

/**
 * HTML for an editable text override, or null to keep the page default.
 * Legacy 'html' rows are ignored: raw HTML is never trusted on public pages.
 */
export const renderTextOverride = (entry: SiteContentEntry | undefined, mode: 'inline' | 'block'): string | null => {
  if (!entry) return null;
  if (entry.contentType === 'text') {
    const text = escapeText(entry.value);
    return mode === 'block' ? `<p>${text.replace(/\n/g, '<br>')}</p>` : text.replace(/\n/g, '<br>');
  }
  if (entry.contentType === 'json') {
    const doc = parseRichDocument(entry.value);
    if (!doc) return null;
    return mode === 'block' ? renderRichDocument(doc) : renderRichInline(doc);
  }
  return null;
};

/** Image overrides must point at this site (uploaded R2 images or /images assets). */
export const imageOverrideSrc = (entry: SiteContentEntry | undefined): string | null => {
  if (!entry || entry.contentType !== 'text') return null;
  const href = safeHref(entry.value);
  return href && href.startsWith('/') ? href : null;
};

export type ContentWriteCheck = { ok: true } | { ok: false; error: string };

/** Server-side check for every admin content write. */
export const validateSiteContentWrite = (key: unknown, value: unknown, contentType: unknown): ContentWriteCheck => {
  if (typeof key !== 'string' || !SITE_CONTENT_KEY_PATTERN.test(key)) return { ok: false, error: 'Invalid key' };
  if (typeof value !== 'string' || value.length > 100_000) return { ok: false, error: 'Invalid value' };
  if (contentType === 'text') return { ok: true };
  if (contentType === 'json') {
    return parseRichDocument(value) ? { ok: true } : { ok: false, error: 'Invalid rich text document' };
  }
  return { ok: false, error: 'Unsupported content type' };
};
