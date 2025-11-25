// Database helper functions for content management

export interface SiteContent {
  key: string;
  value: string;
  content_type: 'text' | 'html' | 'json';
  updated_at: string;
  updated_by: number | null;
}

export interface Page {
  slug: string;
  title: string;
  content: string;
  meta_description: string | null;
  updated_at: string;
  updated_by: number | null;
}

export interface ImageRecord {
  id: number;
  filename: string;
  r2_key: string;
  alt_text: string | null;
  size_bytes: number | null;
  mime_type: string | null;
  uploaded_at: string;
  uploaded_by: number | null;
}

// ============= Site Content Functions =============

/**
 * Get a single content item by key
 */
export async function getContent(db: D1Database, key: string): Promise<SiteContent | null> {
  const result = await db.prepare(
    'SELECT key, value, content_type, updated_at, updated_by FROM site_content WHERE key = ?'
  ).bind(key).first<SiteContent>();

  return result || null;
}

/**
 * Get multiple content items by key prefix (e.g., 'rabbi.' for all rabbi fields)
 */
export async function getContentByPrefix(db: D1Database, prefix: string): Promise<SiteContent[]> {
  const result = await db.prepare(
    "SELECT key, value, content_type, updated_at, updated_by FROM site_content WHERE key LIKE ? || '%' ORDER BY key"
  ).bind(prefix).all<SiteContent>();

  return result.results || [];
}

/**
 * Get all site content
 */
export async function getAllContent(db: D1Database): Promise<SiteContent[]> {
  const result = await db.prepare(
    'SELECT key, value, content_type, updated_at, updated_by FROM site_content ORDER BY key'
  ).all<SiteContent>();

  return result.results || [];
}

/**
 * Set a content item (insert or update)
 */
export async function setContent(
  db: D1Database,
  key: string,
  value: string,
  contentType: 'text' | 'html' | 'json' = 'text',
  userId?: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO site_content (key, value, content_type, updated_at, updated_by)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      content_type = excluded.content_type,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = excluded.updated_by
  `).bind(key, value, contentType, userId || null).run();
}

/**
 * Delete a content item
 */
export async function deleteContent(db: D1Database, key: string): Promise<void> {
  await db.prepare('DELETE FROM site_content WHERE key = ?').bind(key).run();
}

/**
 * Get content as a structured object (for templates)
 */
export async function getContentObject(db: D1Database, prefix: string): Promise<Record<string, string>> {
  const items = await getContentByPrefix(db, prefix);
  const obj: Record<string, string> = {};

  for (const item of items) {
    // Remove prefix from key (e.g., 'rabbi.name' -> 'name')
    const shortKey = item.key.replace(prefix, '');
    obj[shortKey] = item.value;
  }

  return obj;
}

// ============= Page Functions =============

/**
 * Get a page by slug
 */
export async function getPage(db: D1Database, slug: string): Promise<Page | null> {
  const result = await db.prepare(
    'SELECT slug, title, content, meta_description, updated_at, updated_by FROM pages WHERE slug = ?'
  ).bind(slug).first<Page>();

  return result || null;
}

/**
 * Get all pages
 */
export async function getAllPages(db: D1Database): Promise<Page[]> {
  const result = await db.prepare(
    'SELECT slug, title, content, meta_description, updated_at, updated_by FROM pages ORDER BY slug'
  ).all<Page>();

  return result.results || [];
}

/**
 * Create or update a page
 */
export async function savePage(
  db: D1Database,
  slug: string,
  title: string,
  content: string,
  metaDescription?: string,
  userId?: number
): Promise<void> {
  await db.prepare(`
    INSERT INTO pages (slug, title, content, meta_description, updated_at, updated_by)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, ?)
    ON CONFLICT(slug) DO UPDATE SET
      title = excluded.title,
      content = excluded.content,
      meta_description = excluded.meta_description,
      updated_at = CURRENT_TIMESTAMP,
      updated_by = excluded.updated_by
  `).bind(slug, title, content, metaDescription || null, userId || null).run();
}

/**
 * Delete a page
 */
export async function deletePage(db: D1Database, slug: string): Promise<void> {
  await db.prepare('DELETE FROM pages WHERE slug = ?').bind(slug).run();
}

// ============= Image Functions =============

/**
 * Record an uploaded image in the database
 */
export async function recordImage(
  db: D1Database,
  filename: string,
  r2Key: string,
  altText?: string,
  sizeBytes?: number,
  mimeType?: string,
  userId?: number
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO images (filename, r2_key, alt_text, size_bytes, mime_type, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(filename, r2Key, altText || null, sizeBytes || null, mimeType || null, userId || null).run();

  return result.meta.last_row_id as number;
}

/**
 * Get an image record by ID
 */
export async function getImage(db: D1Database, id: number): Promise<ImageRecord | null> {
  const result = await db.prepare(
    'SELECT id, filename, r2_key, alt_text, size_bytes, mime_type, uploaded_at, uploaded_by FROM images WHERE id = ?'
  ).bind(id).first<ImageRecord>();

  return result || null;
}

/**
 * Get all images
 */
export async function getAllImages(db: D1Database): Promise<ImageRecord[]> {
  const result = await db.prepare(
    'SELECT id, filename, r2_key, alt_text, size_bytes, mime_type, uploaded_at, uploaded_by FROM images ORDER BY uploaded_at DESC'
  ).all<ImageRecord>();

  return result.results || [];
}

/**
 * Update image alt text
 */
export async function updateImageAlt(db: D1Database, id: number, altText: string): Promise<void> {
  await db.prepare('UPDATE images SET alt_text = ? WHERE id = ?').bind(altText, id).run();
}

/**
 * Delete an image record
 */
export async function deleteImageRecord(db: D1Database, id: number): Promise<string | null> {
  // Get the R2 key first
  const image = await getImage(db, id);
  if (!image) return null;

  await db.prepare('DELETE FROM images WHERE id = ?').bind(id).run();

  return image.r2_key;
}

// ============= Stats Functions =============

/**
 * Get dashboard stats
 */
export async function getDashboardStats(db: D1Database): Promise<{
  contentCount: number;
  pageCount: number;
  imageCount: number;
  recentActivity: Array<{ type: string; key: string; updated_at: string }>;
}> {
  const [contentCount, pageCount, imageCount, recentContent, recentPages] = await Promise.all([
    db.prepare('SELECT COUNT(*) as count FROM site_content').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM pages').first<{ count: number }>(),
    db.prepare('SELECT COUNT(*) as count FROM images').first<{ count: number }>(),
    db.prepare(
      "SELECT 'content' as type, key, updated_at FROM site_content ORDER BY updated_at DESC LIMIT 5"
    ).all<{ type: string; key: string; updated_at: string }>(),
    db.prepare(
      "SELECT 'page' as type, slug as key, updated_at FROM pages ORDER BY updated_at DESC LIMIT 5"
    ).all<{ type: string; key: string; updated_at: string }>(),
  ]);

  // Combine and sort recent activity
  const allActivity = [
    ...(recentContent.results || []),
    ...(recentPages.results || []),
  ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 10);

  return {
    contentCount: contentCount?.count || 0,
    pageCount: pageCount?.count || 0,
    imageCount: imageCount?.count || 0,
    recentActivity: allActivity,
  };
}
