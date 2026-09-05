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
