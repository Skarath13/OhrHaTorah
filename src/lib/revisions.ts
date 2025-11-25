// Content revision history management

export interface ContentRevision {
  id: number;
  content_key: string;
  old_value: string | null;
  new_value: string;
  content_type: string;
  changed_at: string;
  changed_by: number | null;
  change_type: 'create' | 'update' | 'delete';
  // Joined from users table
  changed_by_name?: string;
}

/**
 * Record a content revision
 */
export async function recordContentRevision(
  db: D1Database,
  contentKey: string,
  oldValue: string | null,
  newValue: string,
  contentType: string = 'text',
  userId?: number,
  changeType: 'create' | 'update' | 'delete' = 'update'
): Promise<number> {
  const result = await db.prepare(`
    INSERT INTO content_revisions (content_key, old_value, new_value, content_type, changed_by, change_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(contentKey, oldValue, newValue, contentType, userId || null, changeType).run();

  return result.meta.last_row_id as number;
}

/**
 * Get revision history for a specific content key
 */
export async function getRevisionHistory(
  db: D1Database,
  contentKey: string,
  limit: number = 20
): Promise<ContentRevision[]> {
  const result = await db.prepare(`
    SELECT
      r.id, r.content_key, r.old_value, r.new_value, r.content_type,
      r.changed_at, r.changed_by, r.change_type,
      u.name as changed_by_name
    FROM content_revisions r
    LEFT JOIN users u ON r.changed_by = u.id
    WHERE r.content_key = ?
    ORDER BY r.changed_at DESC
    LIMIT ?
  `).bind(contentKey, limit).all<ContentRevision>();

  return result.results || [];
}

/**
 * Get all recent revisions (for admin dashboard)
 */
export async function getRecentRevisions(
  db: D1Database,
  limit: number = 50
): Promise<ContentRevision[]> {
  const result = await db.prepare(`
    SELECT
      r.id, r.content_key, r.old_value, r.new_value, r.content_type,
      r.changed_at, r.changed_by, r.change_type,
      u.name as changed_by_name
    FROM content_revisions r
    LEFT JOIN users u ON r.changed_by = u.id
    ORDER BY r.changed_at DESC
    LIMIT ?
  `).bind(limit).all<ContentRevision>();

  return result.results || [];
}

/**
 * Get a specific revision by ID
 */
export async function getRevision(
  db: D1Database,
  revisionId: number
): Promise<ContentRevision | null> {
  const result = await db.prepare(`
    SELECT
      r.id, r.content_key, r.old_value, r.new_value, r.content_type,
      r.changed_at, r.changed_by, r.change_type,
      u.name as changed_by_name
    FROM content_revisions r
    LEFT JOIN users u ON r.changed_by = u.id
    WHERE r.id = ?
  `).bind(revisionId).first<ContentRevision>();

  return result || null;
}

/**
 * Get revisions count for a content key
 */
export async function getRevisionCount(db: D1Database, contentKey: string): Promise<number> {
  const result = await db.prepare(
    'SELECT COUNT(*) as count FROM content_revisions WHERE content_key = ?'
  ).bind(contentKey).first<{ count: number }>();

  return result?.count || 0;
}

/**
 * Clean up old revisions (keep last N revisions per key)
 * Call periodically to prevent database bloat
 */
export async function cleanupOldRevisions(
  db: D1Database,
  keepCount: number = 50
): Promise<number> {
  // Get all unique content keys
  const keys = await db.prepare(
    'SELECT DISTINCT content_key FROM content_revisions'
  ).all<{ content_key: string }>();

  let deletedCount = 0;

  for (const { content_key } of keys.results || []) {
    // Get the ID of the Nth most recent revision for this key
    const cutoff = await db.prepare(`
      SELECT id FROM content_revisions
      WHERE content_key = ?
      ORDER BY changed_at DESC
      LIMIT 1 OFFSET ?
    `).bind(content_key, keepCount - 1).first<{ id: number }>();

    if (cutoff) {
      // Delete all revisions older than the cutoff
      const result = await db.prepare(`
        DELETE FROM content_revisions
        WHERE content_key = ? AND id < ?
      `).bind(content_key, cutoff.id).run();

      deletedCount += result.meta.changes || 0;
    }
  }

  return deletedCount;
}
