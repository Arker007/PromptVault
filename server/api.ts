import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getDb, saveDb } from './db.js';
import { Database } from 'sql.js';

const JWT_SECRET = process.env.JWT_SECRET || 'promptvault-secret-key-prod-mode-2026';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    displayName: string;
  };
}

// Helpers for sql.js
export function queryAll<T = Record<string, any>>(db: Database, sql: string, params: any[] = []): T[] {
  const stmt = db.prepare(sql);
  if (params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = Record<string, any>>(db: Database, sql: string, params: any[] = []): T | null {
  const rows = queryAll<T>(db, sql, params);
  return rows.length > 0 ? rows[0] : null;
}

export function runQuery(db: Database, sql: string, params: any[] = []): void {
  db.run(sql, params);
  saveDb();
}

// Auth Middleware
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.pv_token) {
      token = req.cookies.pv_token;
    }

    if (!token) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    const db = await getDb();
    const user = queryOne<{ id: string; email: string; display_name: string; preferences: string }>(
      db,
      'SELECT id, email, display_name, preferences FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      return res.status(401).json({ code: 'UNAUTHORIZED', message: 'User not found or session invalid' });
    }

    req.userId = user.id;
    req.user = {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    };
    next();
  } catch (err) {
    return res.status(401).json({ code: 'UNAUTHORIZED', message: 'Invalid or expired session' });
  }
}

export const apiRouter = Router();

// ================= AUTH ROUTES =================
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const db = await getDb();
    const user = queryOne<{ id: string; email: string; password_hash: string; display_name: string; preferences: string }>(
      db,
      'SELECT * FROM users WHERE LOWER(email) = LOWER(?)',
      [email.trim()]
    );

    if (!user) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const passwordMatch = bcrypt.compareSync(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('pv_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    let prefs = {};
    try {
      prefs = JSON.parse(user.preferences || '{}');
    } catch {
      prefs = {};
    }

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        preferences: prefs,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message || 'Login failed' });
  }
});

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, displayName } = req.body;
    if (!email || !password || !displayName) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'All fields are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Password must be at least 6 characters' });
    }

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM users WHERE LOWER(email) = LOWER(?)', [email.trim()]);
    if (existing) {
      return res.status(409).json({ code: 'CONFLICT', message: 'Email is already registered' });
    }

    const now = new Date().toISOString();
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const passwordHash = bcrypt.hashSync(password, 10);
    const prefs = JSON.stringify({ theme: 'light', defaultPageSize: 25, copyNotificationDuration: 2 });

    runQuery(
      db,
      'INSERT INTO users (id, email, password_hash, display_name, preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, email.trim().toLowerCase(), passwordHash, displayName.trim(), prefs, now, now]
    );

    // Seed a couple default starter tags and category for the new user
    const catDevId = `cat_${Date.now()}_1`;
    const catGeneralId = `cat_${Date.now()}_2`;
    runQuery(db, 'INSERT INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      catDevId,
      userId,
      'General Prompts',
      'Daily productivity and reference prompts',
      now,
      now,
    ]);
    runQuery(db, 'INSERT INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
      catGeneralId,
      userId,
      'Engineering',
      'Code reviews, architecture, and debugging',
      now,
      now,
    ]);

    const tagGeneralId = `tag_${Date.now()}_1`;
    runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      tagGeneralId,
      userId,
      'general',
      now,
      now,
    ]);

    const token = jwt.sign({ userId, email: email.trim().toLowerCase() }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('pv_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      token,
      user: {
        id: userId,
        email: email.trim().toLowerCase(),
        displayName: displayName.trim(),
        preferences: { theme: 'light', defaultPageSize: 25, copyNotificationDuration: 2 },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('pv_token');
  return res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const user = queryOne<{ id: string; email: string; display_name: string; preferences: string; created_at: string }>(
      db,
      'SELECT id, email, display_name, preferences, created_at FROM users WHERE id = ?',
      [req.userId!]
    );
    if (!user) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'User not found' });
    }

    let prefs = {};
    try {
      prefs = JSON.parse(user.preferences || '{}');
    } catch {
      prefs = {};
    }

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        preferences: prefs,
        createdAt: user.created_at,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { displayName, preferences } = req.body;
    const db = await getDb();
    const now = new Date().toISOString();

    const user = queryOne<{ preferences: string }>(db, 'SELECT preferences FROM users WHERE id = ?', [req.userId!]);
    let currentPrefs = {};
    try {
      currentPrefs = JSON.parse(user?.preferences || '{}');
    } catch {}

    const newPrefs = preferences ? { ...currentPrefs, ...preferences } : currentPrefs;

    if (displayName) {
      runQuery(db, 'UPDATE users SET display_name = ?, preferences = ?, updated_at = ? WHERE id = ?', [
        displayName.trim(),
        JSON.stringify(newPrefs),
        now,
        req.userId!,
      ]);
    } else {
      runQuery(db, 'UPDATE users SET preferences = ?, updated_at = ? WHERE id = ?', [
        JSON.stringify(newPrefs),
        now,
        req.userId!,
      ]);
    }

    return res.json({
      success: true,
      user: {
        id: req.userId,
        email: req.user!.email,
        displayName: displayName ? displayName.trim() : req.user!.displayName,
        preferences: newPrefs,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/auth/password', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Current and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'New password must be at least 6 characters' });
    }

    const db = await getDb();
    const user = queryOne<{ password_hash: string }>(db, 'SELECT password_hash FROM users WHERE id = ?', [req.userId!]);
    if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
      return res.status(400).json({ code: 'INVALID_CREDENTIALS', message: 'Current password is incorrect' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    const now = new Date().toISOString();
    runQuery(db, 'UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?', [newHash, now, req.userId!]);

    return res.json({ success: true, message: 'Password updated successfully' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= PROMPT ROUTES =================
// Helper to extract variables {{variable_name}}
function extractVariables(content: string): string[] {
  const matches = content.match(/\{\{([a-zA-Z0-9_-]+)\}\}/g);
  if (!matches) return [];
  const vars = matches.map((m) => m.slice(2, -2).trim());
  return Array.from(new Set(vars));
}

apiRouter.get('/prompts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    const q = (req.query.q as string)?.trim() || '';
    const category = (req.query.category as string)?.trim() || '';
    const collection = (req.query.collection as string)?.trim() || '';
    const tagsParam = (req.query.tags as string)?.trim() || '';
    const favorite = req.query.favorite as string;
    const pinned = req.query.pinned as string;
    const archived = req.query.archived as string;
    const sort = (req.query.sort as string)?.trim() || 'recently_updated';
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const pageSize = Math.min(100, Math.max(5, parseInt(req.query.pageSize as string, 10) || 25));
    const hasVariables = req.query.has_variables as string;
    const createdFrom = req.query.created_from as string;
    const createdTo = req.query.created_to as string;

    const whereClauses: string[] = ['p.user_id = ?'];
    const params: any[] = [userId];

    // Archive filter
    if (archived === 'true' || archived === '1') {
      whereClauses.push('p.is_archived = 1');
    } else {
      whereClauses.push('p.is_archived = 0');
    }

    // Favorite filter
    if (favorite === 'true' || favorite === '1') {
      whereClauses.push('p.is_favorite = 1');
    }

    // Pinned filter
    if (pinned === 'true' || pinned === '1') {
      whereClauses.push('p.is_pinned = 1');
    }

    // Category filter (can be ID or name)
    if (category) {
      whereClauses.push('(p.category_id = ? OR c.name = ?)');
      params.push(category, category);
    }

    // Collection filter (can be ID or name)
    if (collection) {
      whereClauses.push('(p.collection_id = ? OR col.name = ?)');
      params.push(collection, collection);
    }

    // Date filters
    if (createdFrom) {
      whereClauses.push('p.created_at >= ?');
      params.push(createdFrom);
    }
    if (createdTo) {
      whereClauses.push('p.created_at <= ?');
      params.push(createdTo);
    }

    // Tags filter
    const tagList = tagsParam ? tagsParam.split(',').map((t) => t.trim()).filter(Boolean) : [];
    if (tagList.length > 0) {
      const tagPlaceholders = tagList.map(() => '?').join(',');
      whereClauses.push(`
        p.id IN (
          SELECT pt.prompt_id FROM prompt_tags pt
          JOIN tags t ON pt.tag_id = t.id
          WHERE t.user_id = ? AND (t.id IN (${tagPlaceholders}) OR t.name IN (${tagPlaceholders}))
          GROUP BY pt.prompt_id
          HAVING COUNT(DISTINCT pt.tag_id) >= ${tagList.length}
        )
      `);
      params.push(userId, ...tagList, ...tagList);
    }

    // Search query
    if (q) {
      const searchPattern = `%${q}%`;
      whereClauses.push(`(
        p.title LIKE ? OR
        p.description LIKE ? OR
        p.content LIKE ? OR
        c.name LIKE ? OR
        col.name LIKE ? OR
        p.id IN (
          SELECT pt.prompt_id FROM prompt_tags pt
          JOIN tags t ON pt.tag_id = t.id
          WHERE t.user_id = ? AND t.name LIKE ?
        )
      )`);
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, userId, searchPattern);
    }

    // Sorting
    let orderBy = 'p.updated_at DESC';
    if (sort === 'recently_used' || sort === 'last_copied') {
      orderBy = 'p.last_copied_at DESC NULLS LAST, p.updated_at DESC';
    } else if (sort === 'recently_created') {
      orderBy = 'p.created_at DESC';
    } else if (sort === 'most_copied') {
      orderBy = 'p.copy_count DESC, p.updated_at DESC';
    } else if (sort === 'title_asc') {
      orderBy = 'p.title ASC';
    } else if (sort === 'title_desc') {
      orderBy = 'p.title DESC';
    } else {
      orderBy = 'p.updated_at DESC';
    }

    const whereSql = whereClauses.join(' AND ');

    // Total count query
    const countSql = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE ${whereSql}
    `;
    const countRow = queryOne<{ total: number }>(db, countSql, params);
    const total = countRow ? countRow.total : 0;

    // Fetch page rows
    const offset = (page - 1) * pageSize;
    const listSql = `
      SELECT 
        p.id,
        p.title,
        p.description,
        SUBSTR(p.content, 1, 280) as preview,
        p.content,
        p.is_favorite as isFavorite,
        p.is_pinned as isPinned,
        p.is_archived as isArchived,
        p.copy_count as copyCount,
        p.last_copied_at as lastCopiedAt,
        p.last_viewed_at as lastViewedAt,
        p.created_at as createdAt,
        p.updated_at as updatedAt,
        c.id as categoryId,
        c.name as categoryName,
        col.id as collectionId,
        col.name as collectionName
      FROM prompts p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN collections col ON p.collection_id = col.id
      WHERE ${whereSql}
      ORDER BY p.is_pinned DESC, ${orderBy}
      LIMIT ? OFFSET ?
    `;

    const rawRows = queryAll<any>(db, listSql, [...params, pageSize, offset]);

    // Attach tags for each prompt in the page
    const promptIds = rawRows.map((r) => r.id);
    let promptTagsMap: Record<string, { id: string; name: string }[]> = {};

    if (promptIds.length > 0) {
      const inClause = promptIds.map(() => '?').join(',');
      const tagRows = queryAll<{ prompt_id: string; id: string; name: string }>(
        db,
        `SELECT pt.prompt_id, t.id, t.name 
         FROM prompt_tags pt 
         JOIN tags t ON pt.tag_id = t.id 
         WHERE pt.prompt_id IN (${inClause})
         ORDER BY t.name ASC`,
        promptIds
      );

      for (const tr of tagRows) {
        if (!promptTagsMap[tr.prompt_id]) {
          promptTagsMap[tr.prompt_id] = [];
        }
        promptTagsMap[tr.prompt_id].push({ id: tr.id, name: tr.name });
      }
    }

    let items = rawRows.map((r) => {
      const vars = extractVariables(r.content || '');
      return {
        id: r.id,
        title: r.title,
        description: r.description || '',
        preview: r.preview || '',
        content: r.content, // available if needed
        isFavorite: Boolean(r.isFavorite),
        isPinned: Boolean(r.isPinned),
        isArchived: Boolean(r.isArchived),
        copyCount: r.copyCount || 0,
        lastCopiedAt: r.lastCopiedAt || null,
        lastViewedAt: r.lastViewedAt || null,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
        category: r.categoryId ? { id: r.categoryId, name: r.categoryName } : null,
        collection: r.collectionId ? { id: r.collectionId, name: r.collectionName } : null,
        tags: promptTagsMap[r.id] || [],
        variables: vars,
        hasVariables: vars.length > 0,
      };
    });

    if (hasVariables === 'true') {
      items = items.filter((i) => i.hasVariables);
    }

    return res.json({
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.get('/prompts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const promptId = req.params.id;
    const userId = req.userId!;

    const p = queryOne<any>(
      db,
      `SELECT 
        p.*,
        c.id as categoryId,
        c.name as categoryName,
        col.id as collectionId,
        col.name as collectionName
       FROM prompts p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN collections col ON p.collection_id = col.id
       WHERE p.id = ? AND p.user_id = ?`,
      [promptId, userId]
    );

    if (!p) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    // Update last_viewed_at asynchronously
    const now = new Date().toISOString();
    runQuery(db, 'UPDATE prompts SET last_viewed_at = ? WHERE id = ?', [now, promptId]);

    // Tags
    const tags = queryAll<{ id: string; name: string }>(
      db,
      `SELECT t.id, t.name FROM prompt_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.prompt_id = ? ORDER BY t.name ASC`,
      [promptId]
    );

    // Version count
    const versionCountRow = queryOne<{ count: number }>(
      db,
      'SELECT COUNT(*) as count FROM prompt_versions WHERE prompt_id = ?',
      [promptId]
    );
    const versionCount = versionCountRow ? versionCountRow.count : 1;

    const vars = extractVariables(p.content || '');

    return res.json({
      id: p.id,
      title: p.title,
      description: p.description || '',
      content: p.content,
      isFavorite: Boolean(p.is_favorite),
      isPinned: Boolean(p.is_pinned),
      isArchived: Boolean(p.is_archived),
      copyCount: p.copy_count || 0,
      lastCopiedAt: p.last_copied_at || null,
      lastViewedAt: now,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      category: p.categoryId ? { id: p.categoryId, name: p.categoryName } : null,
      collection: p.collectionId ? { id: p.collectionId, name: p.collectionName } : null,
      tags,
      versionCount,
      variables: vars,
      hasVariables: vars.length > 0,
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, content, categoryId, collectionId, tags, isFavorite, isPinned } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Title is required' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Content is required' });
    }

    const db = await getDb();
    const userId = req.userId!;
    const now = new Date().toISOString();
    const promptId = `prm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    runQuery(
      db,
      `INSERT INTO prompts (id, user_id, category_id, collection_id, title, description, content, is_favorite, is_pinned, is_archived, copy_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?)`,
      [
        promptId,
        userId,
        categoryId || null,
        collectionId || null,
        title.trim(),
        description ? description.trim() : null,
        content.trim(),
        isFavorite ? 1 : 0,
        isPinned ? 1 : 0,
        now,
        now,
      ]
    );

    // Initial version
    const verId = `ver_${promptId}_1`;
    runQuery(
      db,
      `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [verId, promptId, title.trim(), description ? description.trim() : null, content.trim(), now]
    );

    // Tags handling (accepts array of tag IDs or tag names)
    if (Array.isArray(tags) && tags.length > 0) {
      for (const t of tags) {
        let tagId = '';
        const existingTag = queryOne<{ id: string }>(
          db,
          'SELECT id FROM tags WHERE user_id = ? AND (id = ? OR LOWER(name) = LOWER(?))',
          [userId, t, t]
        );
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
            tagId,
            userId,
            t.toLowerCase().trim(),
            now,
            now,
          ]);
        }
        runQuery(db, 'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [promptId, tagId]);
      }
    }

    return res.status(201).json({ id: promptId, success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/prompts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const { title, description, content, categoryId, collectionId, tags, isFavorite, isPinned, isArchived } = req.body;

    const db = await getDb();
    const existing = queryOne<any>(db, 'SELECT * FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const now = new Date().toISOString();
    const updatedTitle = title !== undefined ? title.trim() : existing.title;
    const updatedDesc = description !== undefined ? (description ? description.trim() : null) : existing.description;
    const updatedContent = content !== undefined ? content.trim() : existing.content;
    const updatedCatId = categoryId !== undefined ? categoryId || null : existing.category_id;
    const updatedColId = collectionId !== undefined ? collectionId || null : existing.collection_id;
    const updatedFav = isFavorite !== undefined ? (isFavorite ? 1 : 0) : existing.is_favorite;
    const updatedPin = isPinned !== undefined ? (isPinned ? 1 : 0) : existing.is_pinned;
    const updatedArch = isArchived !== undefined ? (isArchived ? 1 : 0) : existing.is_archived;

    // Check if content or title changed -> create new version!
    const contentChanged = updatedContent !== existing.content || updatedTitle !== existing.title;

    runQuery(
      db,
      `UPDATE prompts 
       SET title = ?, description = ?, content = ?, category_id = ?, collection_id = ?, is_favorite = ?, is_pinned = ?, is_archived = ?, updated_at = ?
       WHERE id = ? AND user_id = ?`,
      [updatedTitle, updatedDesc, updatedContent, updatedCatId, updatedColId, updatedFav, updatedPin, updatedArch, now, promptId, userId]
    );

    if (contentChanged) {
      const lastVer = queryOne<{ maxVer: number }>(
        db,
        'SELECT MAX(version_number) as maxVer FROM prompt_versions WHERE prompt_id = ?',
        [promptId]
      );
      const nextVerNum = (lastVer?.maxVer || 1) + 1;
      const verId = `ver_${promptId}_${nextVerNum}_${Date.now()}`;
      runQuery(
        db,
        `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [verId, promptId, nextVerNum, updatedTitle, updatedDesc, updatedContent, now]
      );
    }

    // Sync tags if passed
    if (Array.isArray(tags)) {
      runQuery(db, 'DELETE FROM prompt_tags WHERE prompt_id = ?', [promptId]);
      for (const t of tags) {
        let tagId = '';
        const existingTag = queryOne<{ id: string }>(
          db,
          'SELECT id FROM tags WHERE user_id = ? AND (id = ? OR LOWER(name) = LOWER(?))',
          [userId, t, t]
        );
        if (existingTag) {
          tagId = existingTag.id;
        } else {
          tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
            tagId,
            userId,
            t.toLowerCase().trim(),
            now,
            now,
          ]);
        }
        runQuery(db, 'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [promptId, tagId]);
      }
    }

    return res.json({ id: promptId, success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.delete('/prompts/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    const existing = queryOne(db, 'SELECT id FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    runQuery(db, 'DELETE FROM prompt_tags WHERE prompt_id = ?', [promptId]);
    runQuery(db, 'DELETE FROM prompt_versions WHERE prompt_id = ?', [promptId]);
    runQuery(db, 'DELETE FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);

    return res.json({ success: true, message: 'Prompt deleted permanently' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// Prompt Actions
apiRouter.post('/prompts/:id/favorite', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    const p = queryOne<{ is_favorite: number }>(db, 'SELECT is_favorite FROM prompts WHERE id = ? AND user_id = ?', [
      promptId,
      userId,
    ]);
    if (!p) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const nextFav = req.body.isFavorite !== undefined ? (req.body.isFavorite ? 1 : 0) : p.is_favorite === 1 ? 0 : 1;
    const now = new Date().toISOString();
    runQuery(db, 'UPDATE prompts SET is_favorite = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
      nextFav,
      now,
      promptId,
      userId,
    ]);

    return res.json({ success: true, isFavorite: Boolean(nextFav) });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/pin', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    const p = queryOne<{ is_pinned: number }>(db, 'SELECT is_pinned FROM prompts WHERE id = ? AND user_id = ?', [
      promptId,
      userId,
    ]);
    if (!p) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const nextPin = req.body.isPinned !== undefined ? (req.body.isPinned ? 1 : 0) : p.is_pinned === 1 ? 0 : 1;
    const now = new Date().toISOString();
    runQuery(db, 'UPDATE prompts SET is_pinned = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
      nextPin,
      now,
      promptId,
      userId,
    ]);

    return res.json({ success: true, isPinned: Boolean(nextPin) });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/archive', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();
    const now = new Date().toISOString();

    runQuery(db, 'UPDATE prompts SET is_archived = 1, updated_at = ? WHERE id = ? AND user_id = ?', [
      now,
      promptId,
      userId,
    ]);
    return res.json({ success: true, isArchived: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/restore', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();
    const now = new Date().toISOString();

    runQuery(db, 'UPDATE prompts SET is_archived = 0, updated_at = ? WHERE id = ? AND user_id = ?', [
      now,
      promptId,
      userId,
    ]);
    return res.json({ success: true, isArchived: false });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/copy-event', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();
    const now = new Date().toISOString();

    runQuery(
      db,
      'UPDATE prompts SET copy_count = copy_count + 1, last_copied_at = ? WHERE id = ? AND user_id = ?',
      [now, promptId, userId]
    );

    const updated = queryOne<{ copy_count: number; last_copied_at: string }>(
      db,
      'SELECT copy_count, last_copied_at FROM prompts WHERE id = ? AND user_id = ?',
      [promptId, userId]
    );

    return res.json({
      success: true,
      copyCount: updated?.copy_count || 1,
      lastCopiedAt: updated?.last_copied_at || now,
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/duplicate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    const orig = queryOne<any>(db, 'SELECT * FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);
    if (!orig) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const now = new Date().toISOString();
    const newId = `prm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newTitle = `${orig.title} (Copy)`;

    runQuery(
      db,
      `INSERT INTO prompts (id, user_id, category_id, collection_id, title, description, content, is_favorite, is_archived, copy_count, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)`,
      [newId, userId, orig.category_id, orig.collection_id, newTitle, orig.description, orig.content, now, now]
    );

    // Initial version for duplicate
    runQuery(
      db,
      `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
       VALUES (?, ?, 1, ?, ?, ?, ?)`,
      [`ver_${newId}_1`, newId, newTitle, orig.description, orig.content, now]
    );

    // Copy tags
    const origTags = queryAll<{ tag_id: string }>(db, 'SELECT tag_id FROM prompt_tags WHERE prompt_id = ?', [promptId]);
    for (const t of origTags) {
      runQuery(db, 'INSERT INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [newId, t.tag_id]);
    }

    return res.status(201).json({ id: newId, title: newTitle, success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// Versions API
apiRouter.get('/prompts/:id/versions', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const promptId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    const p = queryOne(db, 'SELECT id FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);
    if (!p) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const versions = queryAll<{
      id: string;
      version_number: number;
      title: string;
      description: string;
      content: string;
      created_at: string;
    }>(
      db,
      'SELECT id, version_number, title, description, content, created_at FROM prompt_versions WHERE prompt_id = ? ORDER BY version_number DESC',
      [promptId]
    );

    return res.json({
      versions: versions.map((v) => ({
        id: v.id,
        versionNumber: v.version_number,
        title: v.title,
        description: v.description || '',
        content: v.content,
        createdAt: v.created_at,
      })),
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/prompts/:id/versions/:versionId/restore', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { id: promptId, versionId } = req.params;
    const userId = req.userId!;
    const db = await getDb();

    const p = queryOne<any>(db, 'SELECT * FROM prompts WHERE id = ? AND user_id = ?', [promptId, userId]);
    if (!p) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Prompt not found' });
    }

    const ver = queryOne<any>(
      db,
      'SELECT * FROM prompt_versions WHERE id = ? AND prompt_id = ?',
      [versionId, promptId]
    );
    if (!ver) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Version not found' });
    }

    const now = new Date().toISOString();
    const lastVer = queryOne<{ maxVer: number }>(
      db,
      'SELECT MAX(version_number) as maxVer FROM prompt_versions WHERE prompt_id = ?',
      [promptId]
    );
    const nextVerNum = (lastVer?.maxVer || 1) + 1;

    // Update prompt
    runQuery(
      db,
      'UPDATE prompts SET title = ?, description = ?, content = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [ver.title, ver.description, ver.content, now, promptId, userId]
    );

    // Save as new version
    const newVerId = `ver_${promptId}_${nextVerNum}_${Date.now()}`;
    runQuery(
      db,
      `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [newVerId, promptId, nextVerNum, ver.title, ver.description, ver.content, now]
    );

    return res.json({ success: true, versionNumber: nextVerNum });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// Bulk Actions
apiRouter.post('/prompts/bulk', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { action, ids, data } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'No prompts selected' });
    }

    const userId = req.userId!;
    const db = await getDb();
    const now = new Date().toISOString();
    const inClause = ids.map(() => '?').join(',');

    if (action === 'delete') {
      runQuery(db, `DELETE FROM prompt_tags WHERE prompt_id IN (${inClause})`, ids);
      runQuery(db, `DELETE FROM prompt_versions WHERE prompt_id IN (${inClause})`, ids);
      runQuery(db, `DELETE FROM prompts WHERE id IN (${inClause}) AND user_id = ?`, [...ids, userId]);
      return res.json({ success: true, count: ids.length, action: 'delete' });
    }

    if (action === 'archive') {
      runQuery(
        db,
        `UPDATE prompts SET is_archived = 1, updated_at = ? WHERE id IN (${inClause}) AND user_id = ?`,
        [now, ...ids, userId]
      );
      return res.json({ success: true, count: ids.length, action: 'archive' });
    }

    if (action === 'restore') {
      runQuery(
        db,
        `UPDATE prompts SET is_archived = 0, updated_at = ? WHERE id IN (${inClause}) AND user_id = ?`,
        [now, ...ids, userId]
      );
      return res.json({ success: true, count: ids.length, action: 'restore' });
    }

    if (action === 'pin') {
      runQuery(
        db,
        `UPDATE prompts SET is_pinned = 1, updated_at = ? WHERE id IN (${inClause}) AND user_id = ?`,
        [now, ...ids, userId]
      );
      return res.json({ success: true, count: ids.length, action: 'pin' });
    }

    if (action === 'unpin') {
      runQuery(
        db,
        `UPDATE prompts SET is_pinned = 0, updated_at = ? WHERE id IN (${inClause}) AND user_id = ?`,
        [now, ...ids, userId]
      );
      return res.json({ success: true, count: ids.length, action: 'unpin' });
    }

    if (action === 'addTag' && data?.tag) {
      const tagName = data.tag.toLowerCase().trim();
      let tagId = '';
      const existingTag = queryOne<{ id: string }>(
        db,
        'SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = ?',
        [userId, tagName]
      );
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        tagId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
          tagId,
          userId,
          tagName,
          now,
          now,
        ]);
      }
      for (const pId of ids) {
        runQuery(db, 'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)', [pId, tagId]);
      }
      return res.json({ success: true, count: ids.length, action: 'addTag' });
    }

    return res.status(400).json({ code: 'INVALID_ACTION', message: 'Unknown bulk action' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= CATEGORIES =================
apiRouter.get('/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    const categories = queryAll<any>(
      db,
      `SELECT 
        c.id,
        c.name,
        c.description,
        c.created_at as createdAt,
        c.updated_at as updatedAt,
        (SELECT COUNT(*) FROM prompts p WHERE p.category_id = c.id AND p.is_archived = 0) as promptCount
       FROM categories c
       WHERE c.user_id = ?
       ORDER BY c.name ASC`,
      [userId]
    );

    return res.json(
      categories.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description || '',
        promptCount: c.promptCount || 0,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/categories', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Category name is required' });
    }

    const db = await getDb();
    const userId = req.userId!;
    const now = new Date().toISOString();
    const id = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    runQuery(
      db,
      'INSERT INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, userId, name.trim(), description ? description.trim() : null, now, now]
    );

    return res.status(201).json({ id, name: name.trim(), description: description || '', promptCount: 0 });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const catId = req.params.id;
    const userId = req.userId!;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Category not found' });
    }

    const now = new Date().toISOString();
    runQuery(
      db,
      'UPDATE categories SET name = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [name.trim(), description ? description.trim() : null, now, catId, userId]
    );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.delete('/categories/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const catId = req.params.id;
    const userId = req.userId!;
    const { reassignToCategoryId } = req.body || {};

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Category not found' });
    }

    // Explicit strategy: never silent relation loss
    if (reassignToCategoryId) {
      runQuery(db, 'UPDATE prompts SET category_id = ? WHERE category_id = ? AND user_id = ?', [
        reassignToCategoryId,
        catId,
        userId,
      ]);
      runQuery(db, 'UPDATE collections SET category_id = ? WHERE category_id = ? AND user_id = ?', [
        reassignToCategoryId,
        catId,
        userId,
      ]);
    } else {
      // Uncategorize
      runQuery(db, 'UPDATE prompts SET category_id = NULL WHERE category_id = ? AND user_id = ?', [catId, userId]);
      runQuery(db, 'UPDATE collections SET category_id = NULL WHERE category_id = ? AND user_id = ?', [catId, userId]);
    }

    runQuery(db, 'DELETE FROM categories WHERE id = ? AND user_id = ?', [catId, userId]);
    return res.json({ success: true, message: 'Category deleted' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= COLLECTIONS =================
apiRouter.get('/collections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    const collections = queryAll<any>(
      db,
      `SELECT 
        col.id,
        col.name,
        col.description,
        col.category_id as categoryId,
        c.name as categoryName,
        col.created_at as createdAt,
        col.updated_at as updatedAt,
        (SELECT COUNT(*) FROM prompts p WHERE p.collection_id = col.id AND p.is_archived = 0) as promptCount
       FROM collections col
       LEFT JOIN categories c ON col.category_id = c.id
       WHERE col.user_id = ?
       ORDER BY col.name ASC`,
      [userId]
    );

    return res.json(
      collections.map((col) => ({
        id: col.id,
        name: col.name,
        description: col.description || '',
        category: col.categoryId ? { id: col.categoryId, name: col.categoryName } : null,
        promptCount: col.promptCount || 0,
        createdAt: col.createdAt,
        updatedAt: col.updatedAt,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/collections', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, categoryId } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Collection name is required' });
    }

    const db = await getDb();
    const userId = req.userId!;
    const now = new Date().toISOString();
    const id = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    runQuery(
      db,
      'INSERT INTO collections (id, user_id, category_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, userId, categoryId || null, name.trim(), description ? description.trim() : null, now, now]
    );

    return res.status(201).json({ id, name: name.trim(), description: description || '', promptCount: 0 });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/collections/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, categoryId } = req.body;
    const colId = req.params.id;
    const userId = req.userId!;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM collections WHERE id = ? AND user_id = ?', [colId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Collection not found' });
    }

    const now = new Date().toISOString();
    runQuery(
      db,
      'UPDATE collections SET name = ?, description = ?, category_id = ?, updated_at = ? WHERE id = ? AND user_id = ?',
      [name.trim(), description ? description.trim() : null, categoryId || null, now, colId, userId]
    );

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.delete('/collections/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const colId = req.params.id;
    const userId = req.userId!;

    const db = await getDb();
    const existing = queryOne(db, 'SELECT id FROM collections WHERE id = ? AND user_id = ?', [colId, userId]);
    if (!existing) {
      return res.status(404).json({ code: 'NOT_FOUND', message: 'Collection not found' });
    }

    // Unassign prompts from collection (never silent prompt loss)
    runQuery(db, 'UPDATE prompts SET collection_id = NULL WHERE collection_id = ? AND user_id = ?', [colId, userId]);
    runQuery(db, 'DELETE FROM collections WHERE id = ? AND user_id = ?', [colId, userId]);

    return res.json({ success: true, message: 'Collection deleted' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= TAGS =================
apiRouter.get('/tags', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    const tags = queryAll<any>(
      db,
      `SELECT 
        t.id,
        t.name,
        t.created_at as createdAt,
        t.updated_at as updatedAt,
        (SELECT COUNT(*) FROM prompt_tags pt JOIN prompts p ON pt.prompt_id = p.id WHERE pt.tag_id = t.id AND p.is_archived = 0) as promptCount,
        (SELECT MAX(p.last_copied_at) FROM prompt_tags pt JOIN prompts p ON pt.prompt_id = p.id WHERE pt.tag_id = t.id) as lastUsed
       FROM tags t
       WHERE t.user_id = ?
       ORDER BY promptCount DESC, t.name ASC`,
      [userId]
    );

    return res.json(
      tags.map((t) => ({
        id: t.id,
        name: t.name,
        promptCount: t.promptCount || 0,
        lastUsed: t.lastUsed || t.updatedAt,
        createdAt: t.createdAt,
      }))
    );
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/tags', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Tag name is required' });
    }

    const cleanName = name.trim().toLowerCase();
    const db = await getDb();
    const userId = req.userId!;

    const existing = queryOne<{ id: string; name: string }>(
      db,
      'SELECT id, name FROM tags WHERE user_id = ? AND LOWER(name) = ?',
      [userId, cleanName]
    );
    if (existing) {
      return res.json({ id: existing.id, name: existing.name, promptCount: 0 });
    }

    const now = new Date().toISOString();
    const id = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
      id,
      userId,
      cleanName,
      now,
      now,
    ]);

    return res.status(201).json({ id, name: cleanName, promptCount: 0, lastUsed: now });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.patch('/tags/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { name } = req.body;
    const tagId = req.params.id;
    const userId = req.userId!;

    if (!name || !name.trim()) {
      return res.status(400).json({ code: 'VALIDATION_ERROR', message: 'Tag name is required' });
    }

    const db = await getDb();
    const now = new Date().toISOString();
    runQuery(db, 'UPDATE tags SET name = ?, updated_at = ? WHERE id = ? AND user_id = ?', [
      name.trim().toLowerCase(),
      now,
      tagId,
      userId,
    ]);

    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.delete('/tags/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const tagId = req.params.id;
    const userId = req.userId!;
    const db = await getDb();

    runQuery(db, 'DELETE FROM prompt_tags WHERE tag_id = ?', [tagId]);
    runQuery(db, 'DELETE FROM tags WHERE id = ? AND user_id = ?', [tagId, userId]);

    return res.json({ success: true, message: 'Tag deleted' });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= GLOBAL SEARCH =================
apiRouter.get('/search', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const q = (req.query.q as string)?.trim() || '';
    if (!q) {
      return res.json({ prompts: [], categories: [], collections: [], tags: [] });
    }

    const db = await getDb();
    const userId = req.userId!;
    const searchPattern = `%${q}%`;

    // Search prompts
    const prompts = queryAll<any>(
      db,
      `SELECT p.id, p.title, SUBSTR(p.content, 1, 140) as preview, p.is_favorite as isFavorite, c.name as categoryName
       FROM prompts p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE p.user_id = ? AND p.is_archived = 0 AND (p.title LIKE ? OR p.description LIKE ? OR p.content LIKE ?)
       LIMIT 8`,
      [userId, searchPattern, searchPattern, searchPattern]
    );

    // Search categories
    const categories = queryAll<any>(
      db,
      'SELECT id, name FROM categories WHERE user_id = ? AND name LIKE ? LIMIT 5',
      [userId, searchPattern]
    );

    // Search collections
    const collections = queryAll<any>(
      db,
      'SELECT id, name FROM collections WHERE user_id = ? AND name LIKE ? LIMIT 5',
      [userId, searchPattern]
    );

    // Search tags
    const tags = queryAll<any>(
      db,
      'SELECT id, name FROM tags WHERE user_id = ? AND name LIKE ? LIMIT 5',
      [userId, searchPattern]
    );

    return res.json({
      prompts: prompts.map((p) => ({
        id: p.id,
        title: p.title,
        preview: p.preview,
        isFavorite: Boolean(p.isFavorite),
        categoryName: p.categoryName || '',
      })),
      categories,
      collections,
      tags,
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

// ================= IMPORT / EXPORT =================
apiRouter.get('/export', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const db = await getDb();
    const userId = req.userId!;

    const prompts = queryAll<any>(db, 'SELECT * FROM prompts WHERE user_id = ?', [userId]);
    const categories = queryAll<any>(db, 'SELECT * FROM categories WHERE user_id = ?', [userId]);
    const collections = queryAll<any>(db, 'SELECT * FROM collections WHERE user_id = ?', [userId]);
    const tags = queryAll<any>(db, 'SELECT * FROM tags WHERE user_id = ?', [userId]);

    const promptIds = prompts.map((p) => p.id);
    let promptTags: any[] = [];
    let promptVersions: any[] = [];

    if (promptIds.length > 0) {
      const inClause = promptIds.map(() => '?').join(',');
      promptTags = queryAll(db, `SELECT * FROM prompt_tags WHERE prompt_id IN (${inClause})`, promptIds);
      promptVersions = queryAll(db, `SELECT * FROM prompt_versions WHERE prompt_id IN (${inClause})`, promptIds);
    }

    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      user: { email: req.user!.email, displayName: req.user!.displayName },
      data: {
        categories,
        collections,
        tags,
        prompts,
        promptTags,
        promptVersions,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="promptvault-export-${new Date().toISOString().slice(0, 10)}.json"`);
    return res.json(payload);
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});

apiRouter.post('/import', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { data, strategy } = req.body; // strategy: 'merge' | 'overwrite'
    if (!data || !Array.isArray(data.prompts)) {
      return res.status(400).json({ code: 'INVALID_IMPORT', message: 'Invalid PromptVault export format' });
    }

    const db = await getDb();
    const userId = req.userId!;
    const now = new Date().toISOString();

    let importedPrompts = 0;
    let importedCategories = 0;
    let importedCollections = 0;
    let importedTags = 0;

    // Categories
    const categoryMap: Record<string, string> = {};
    if (Array.isArray(data.categories)) {
      for (const cat of data.categories) {
        let existing = queryOne<{ id: string }>(
          db,
          'SELECT id FROM categories WHERE user_id = ? AND LOWER(name) = LOWER(?)',
          [userId, cat.name]
        );
        if (existing) {
          categoryMap[cat.id] = existing.id;
        } else {
          const newId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          runQuery(db, 'INSERT INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)', [
            newId,
            userId,
            cat.name,
            cat.description || null,
            now,
            now,
          ]);
          categoryMap[cat.id] = newId;
          importedCategories++;
        }
      }
    }

    // Collections
    const collectionMap: Record<string, string> = {};
    if (Array.isArray(data.collections)) {
      for (const col of data.collections) {
        let existing = queryOne<{ id: string }>(
          db,
          'SELECT id FROM collections WHERE user_id = ? AND LOWER(name) = LOWER(?)',
          [userId, col.name]
        );
        if (existing) {
          collectionMap[col.id] = existing.id;
        } else {
          const newId = `col_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          const catId = col.category_id ? categoryMap[col.category_id] || null : null;
          runQuery(
            db,
            'INSERT INTO collections (id, user_id, category_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [newId, userId, catId, col.name, col.description || null, now, now]
          );
          collectionMap[col.id] = newId;
          importedCollections++;
        }
      }
    }

    // Tags
    const tagMap: Record<string, string> = {};
    if (Array.isArray(data.tags)) {
      for (const tag of data.tags) {
        let existing = queryOne<{ id: string }>(
          db,
          'SELECT id FROM tags WHERE user_id = ? AND LOWER(name) = LOWER(?)',
          [userId, tag.name]
        );
        if (existing) {
          tagMap[tag.id] = existing.id;
        } else {
          const newId = `tag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          runQuery(db, 'INSERT INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)', [
            newId,
            userId,
            tag.name.toLowerCase().trim(),
            now,
            now,
          ]);
          tagMap[tag.id] = newId;
          importedTags++;
        }
      }
    }

    // Prompts
    for (const p of data.prompts) {
      const newPromptId = `prm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const targetCatId = p.category_id ? categoryMap[p.category_id] || null : null;
      const targetColId = p.collection_id ? collectionMap[p.collection_id] || null : null;

      runQuery(
        db,
        `INSERT INTO prompts (id, user_id, category_id, collection_id, title, description, content, is_favorite, is_archived, copy_count, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newPromptId,
          userId,
          targetCatId,
          targetColId,
          p.title,
          p.description || null,
          p.content,
          p.is_favorite ? 1 : 0,
          p.is_archived ? 1 : 0,
          p.copy_count || 0,
          p.created_at || now,
          p.updated_at || now,
        ]
      );

      // Version
      runQuery(
        db,
        `INSERT INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at)
         VALUES (?, ?, 1, ?, ?, ?, ?)`,
        [`ver_${newPromptId}_1`, newPromptId, p.title, p.description || null, p.content, now]
      );

      importedPrompts++;
    }

    return res.json({
      success: true,
      imported: {
        prompts: importedPrompts,
        categories: importedCategories,
        collections: importedCollections,
        tags: importedTags,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ code: 'SERVER_ERROR', message: err.message });
  }
});
