# Editable content

Every piece of public copy and every content photo can be changed by a signed-in
admin directly on the page. Built October 31, 2026 on Tiptap 3.31.4.

## For editors

1. Sign in with the PIN (footer "Admin" link), then press **Edit**.
2. Click any highlighted text. The cursor lands where you clicked.
3. Use the bar that appears: **Bold**, **Italic**, **Link**, and in longer
   sections **Heading**, **Subheading**, **Bullets**, **Numbers**, plus **Undo**
   and **Redo**.
4. Click outside the text when finished, then **Save**. Escape cancels the
   current text; **Discard** throws away everything unsaved.
5. Every save is kept in revision history (`content_revisions`).

## How it works

- `src/components/content/Editable.astro` renders the default copy written in
  the page. If `site_content` holds a saved value for its `field`, that value
  is rendered instead, on the server.
- `src/middleware.ts` loads all saved values once per page request
  (`src/lib/siteContent.ts`). If D1 is unavailable the page shows its defaults.
- Saved text is ProseMirror JSON (`content_type = 'json'`). Public pages render
  it with an allowlist (`src/lib/richText.ts`): unknown formatting is dropped,
  text is escaped, links must be http(s), mailto, tel, or on this site. Raw HTML
  is never accepted or rendered. External links get "(opens in a new tab)" for
  screen readers; "Hashem"/"Adonai" get the small-cap divine-name markup.
- The admin client (`InlineEditor.astro`) loads Tiptap on demand
  (`src/lib/richEditorClient.ts`, `richEditorTiptap.ts`), so visitors never
  download it.
- The content API validates every write (`validateSiteContentWrite`): key
  format, size, and content type `text` or `json` only.

## For developers: making new copy editable

```astro
---
import Editable from '../components/content/Editable.astro';
import EditableImage from '../components/content/EditableImage.astro';
---
<Editable field="youth.intro-heading" as="h2" class="section-title">Shabbat School</Editable>
<Editable field="youth.intro-body" as="p">Children learn Hebrew...</Editable>
<Editable field="faq.parking.answer" as="div" block><p>...</p><ul>...</ul></Editable>
<EditableImage field="youth.hero-photo" src="/images/youth.webp" alt="Children reading" width="800" height="600" />
```

- `field`: `<page>.<block>` in lowercase kebab case, unique site-wide, stable
  forever (renaming a key orphans saved edits). In loops, derive from a stable
  data id, never the array index.
- Inline (default) keeps the original tag, so layout CSS is unaffected. Use
  `block` only for a prose region where a wrapping element is safe.
- Do not wrap text that client scripts rewrite, contract-pinned schedules or
  payment details, form controls, or `<a>`/`<button>` elements themselves
  (wrap the label inside them).
- Image overrides must be URLs on this site; alt text can be overridden under
  `<field>.alt`.

## Data safety

Saved values are runtime data in production D1 and win over the defaults in
Git. A deploy never resets them (`docs/production-data-safety.md`). To return a
field to its default, delete its `site_content` row through the admin API so
the deletion is recorded in revision history.
