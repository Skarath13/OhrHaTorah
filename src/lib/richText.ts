// Rich text saved by the admin editor (Tiptap) is stored as ProseMirror JSON in
// `site_content` with content_type 'json'. Public pages render it here, on the
// server, from an allowlist: unknown nodes and marks are dropped, every string is
// escaped, and links must be http(s), mailto, tel, or same-site paths. Stored
// JSON can therefore never inject markup or script into a public page.

export type RichMark = { type: string; attrs?: Record<string, unknown> };
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, unknown>;
  marks?: RichMark[];
  content?: RichNode[];
};

const MAX_DEPTH = 12;
const MAX_JSON_BYTES = 100_000;

const escapeHtml = (value: string): string => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

export const safeHref = (href: unknown): string | null => {
  if (typeof href !== 'string') return null;
  const trimmed = href.trim();
  if (!trimmed || /[\u0000-\u001f]/.test(trimmed)) return null;
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.includes('\\')) return trimmed;
  if (trimmed.startsWith('#')) return trimmed;
  try {
    const url = new URL(trimmed);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
};

const isExternal = (href: string): boolean => /^https?:/i.test(href);

const markTags: Record<string, (mark: RichMark) => [string, string] | null> = {
  bold: () => ['<strong>', '</strong>'],
  italic: () => ['<em>', '</em>'],
  underline: () => ['<u>', '</u>'],
  link: (mark) => {
    const href = safeHref(mark.attrs?.href);
    if (!href) return null;
    if (!isExternal(href)) return [`<a href="${escapeHtml(href)}">`, '</a>'];
    return [
      `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">`,
      '<span class="visually-hidden"> (opens in a new tab)</span></a>',
    ];
  },
};

// CONTENT_VOICE.md: "Hashem"/"Adonai" standing in for YHVH render as a
// full-height initial plus small caps. Readable text stays "Hashem"/"Adonai".
const divineNames = (html: string): string => html.replace(
  /\b(H)(ashem)\b|\b(A)(donai)\b/g,
  (_match, h, ashem, a, donai) =>
    `<span class="divine-name"><span class="divine-name__initial">${h ?? a}</span><span class="divine-name__small-caps">${ashem ?? donai}</span></span>`,
);

const renderText = (node: RichNode): string => {
  let html = divineNames(escapeHtml(node.text ?? ''));
  for (const mark of node.marks ?? []) {
    const tags = markTags[mark.type]?.(mark);
    if (tags) html = `${tags[0]}${html}${tags[1]}`;
  }
  return html;
};

const renderChildren = (node: RichNode, depth: number): string =>
  (node.content ?? []).map((child) => renderNode(child, depth + 1)).join('');

const renderNode = (node: RichNode, depth: number): string => {
  if (!node || typeof node !== 'object' || depth > MAX_DEPTH) return '';
  switch (node.type) {
    case 'doc': return renderChildren(node, depth);
    case 'text': return renderText(node);
    case 'paragraph': return `<p>${renderChildren(node, depth)}</p>`;
    case 'heading': {
      // Page h1 belongs to the layout; editors get section levels only.
      const level = Number(node.attrs?.level) === 3 ? 3 : 2;
      return `<h${level}>${renderChildren(node, depth)}</h${level}>`;
    }
    case 'bulletList': return `<ul>${renderChildren(node, depth)}</ul>`;
    case 'orderedList': return `<ol>${renderChildren(node, depth)}</ol>`;
    case 'listItem': return `<li>${renderChildren(node, depth)}</li>`;
    case 'blockquote': return `<blockquote>${renderChildren(node, depth)}</blockquote>`;
    case 'hardBreak': return '<br>';
    case 'horizontalRule': return '<hr>';
    default: return '';
  }
};

/** Parses stored JSON; returns null when it is not a usable document. */
export const parseRichDocument = (value: string): RichNode | null => {
  if (typeof value !== 'string' || value.length > MAX_JSON_BYTES) return null;
  try {
    const parsed = JSON.parse(value) as RichNode;
    return parsed && parsed.type === 'doc' && Array.isArray(parsed.content) ? parsed : null;
  } catch {
    return null;
  }
};

export const renderRichDocument = (doc: RichNode): string => renderNode(doc, 0);

/** Inline variant for headings and single lines: paragraphs flatten to text with breaks. */
export const renderRichInline = (doc: RichNode): string =>
  (doc.content ?? [])
    .map((block) => (block.content ?? []).map((child) => renderNode(child, 2)).join(''))
    .join('<br>');
