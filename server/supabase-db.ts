import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient, getEffectiveSupabaseConfig } from './supabase.ts';

export interface SupabasePrompt {
  id: string;
  user_id: string;
  category_id?: string | null;
  collection_id?: string | null;
  title: string;
  description?: string | null;
  content: string;
  is_favorite: boolean;
  is_pinned: boolean;
  is_archived: boolean;
  copy_count: number;
  last_copied_at?: string | null;
  last_viewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCategory {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCollection {
  id: string;
  user_id: string;
  category_id?: string | null;
  name: string;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseTag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface SupabasePromptVersion {
  id: string;
  prompt_id: string;
  version_number: number;
  title: string;
  description?: string | null;
  content: string;
  created_at: string;
}

export interface PullUserDataResult {
  success: boolean;
  message: string;
  fetchedCounts?: {
    prompts: number;
    categories: number;
    collections: number;
    tags: number;
    versions: number;
  };
  duplicatesRemoved?: number;
}

/**
 * Returns a SupabaseClient if direct database storage is enabled and configured, or null otherwise.
 */
export function getActiveSupabaseDbClient(userPreferences?: string | null): SupabaseClient | null {
  const config = getEffectiveSupabaseConfig(userPreferences);
  if (!config.supabaseUrl || !config.supabaseKey) {
    return null;
  }
  return createSupabaseClient(config.supabaseUrl, config.supabaseKey);
}

// ================= CATEGORIES =================
export async function getCategoriesFromSupabase(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertCategoryToSupabase(client: SupabaseClient, category: SupabaseCategory) {
  const { data, error } = await client
    .from('categories')
    .upsert([category])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategoryFromSupabase(client: SupabaseClient, userId: string, categoryId: string) {
  const { error } = await client
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ================= COLLECTIONS =================
export async function getCollectionsFromSupabase(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('collections')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertCollectionToSupabase(client: SupabaseClient, collection: SupabaseCollection) {
  const { data, error } = await client
    .from('collections')
    .upsert([collection])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCollectionFromSupabase(client: SupabaseClient, userId: string, collectionId: string) {
  const { error } = await client
    .from('collections')
    .delete()
    .eq('id', collectionId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ================= TAGS =================
export async function getTagsFromSupabase(client: SupabaseClient, userId: string) {
  const { data, error } = await client
    .from('tags')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function upsertTagToSupabase(client: SupabaseClient, tag: SupabaseTag) {
  const { data, error } = await client
    .from('tags')
    .upsert([tag])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTagFromSupabase(client: SupabaseClient, userId: string, tagId: string) {
  const { error } = await client
    .from('tags')
    .delete()
    .eq('id', tagId)
    .eq('user_id', userId);

  if (error) throw error;
}

// ================= PROMPTS =================
export async function getPromptsFromSupabase(
  client: SupabaseClient,
  userId: string,
  params: {
    search?: string;
    categoryId?: string;
    collectionId?: string;
    tagId?: string;
    isFavorite?: boolean;
    isPinned?: boolean;
    isArchived?: boolean;
  } = {}
) {
  let query = client
    .from('prompts')
    .select('*')
    .eq('user_id', userId);

  if (params.categoryId) {
    query = query.eq('category_id', params.categoryId);
  }
  if (params.collectionId) {
    query = query.eq('collection_id', params.collectionId);
  }
  if (params.isFavorite !== undefined) {
    query = query.eq('is_favorite', params.isFavorite);
  }
  if (params.isPinned !== undefined) {
    query = query.eq('is_pinned', params.isPinned);
  }
  if (params.isArchived !== undefined) {
    query = query.eq('is_archived', params.isArchived);
  } else {
    // Default: exclude archived unless specified
    query = query.eq('is_archived', false);
  }

  if (params.search) {
    const s = `%${params.search}%`;
    query = query.or(`title.ilike.${s},description.ilike.${s},content.ilike.${s}`);
  }

  query = query.order('is_pinned', { ascending: false }).order('updated_at', { ascending: false });

  const { data: prompts, error } = await query;
  if (error) throw error;

  // Get tags for prompts
  const promptIds = (prompts || []).map((p) => p.id);
  let tagsMap: Record<string, SupabaseTag[]> = {};

  if (promptIds.length > 0) {
    const { data: ptData } = await client
      .from('prompt_tags')
      .select('prompt_id, tags(*)')
      .in('prompt_id', promptIds);

    if (ptData) {
      for (const item of ptData as any[]) {
        if (!tagsMap[item.prompt_id]) {
          tagsMap[item.prompt_id] = [];
        }
        if (item.tags) {
          tagsMap[item.prompt_id].push(item.tags);
        }
      }
    }
  }

  // Filter by tagId if specified
  let result = prompts || [];
  if (params.tagId) {
    result = result.filter((p) => {
      const pTags = tagsMap[p.id] || [];
      return pTags.some((t) => t.id === params.tagId);
    });
  }

  return result.map((p) => ({
    ...p,
    tags: tagsMap[p.id] || [],
  }));
}

export async function getPromptByIdFromSupabase(client: SupabaseClient, userId: string, promptId: string) {
  const { data: prompt, error } = await client
    .from('prompts')
    .select('*')
    .eq('id', promptId)
    .eq('user_id', userId)
    .single();

  if (error || !prompt) return null;

  // Get tags
  const { data: ptData } = await client
    .from('prompt_tags')
    .select('tags(*)')
    .eq('prompt_id', promptId);

  const tags = (ptData || []).map((pt: any) => pt.tags).filter(Boolean);

  // Get versions
  const { data: versions } = await client
    .from('prompt_versions')
    .select('*')
    .eq('prompt_id', promptId)
    .order('version_number', { ascending: false });

  return {
    ...prompt,
    tags,
    versions: versions || [],
  };
}

export async function upsertPromptToSupabase(
  client: SupabaseClient,
  prompt: SupabasePrompt,
  tagIds: string[] = []
) {
  const { data, error } = await client
    .from('prompts')
    .upsert([prompt])
    .select()
    .single();

  if (error) throw error;

  // Sync tags in prompt_tags junction table
  await client.from('prompt_tags').delete().eq('prompt_id', prompt.id);

  if (tagIds.length > 0) {
    const ptRecords = tagIds.map((tagId) => ({
      prompt_id: prompt.id,
      tag_id: tagId,
    }));
    await client.from('prompt_tags').insert(ptRecords);
  }

  return data;
}

export async function deletePromptFromSupabase(client: SupabaseClient, userId: string, promptId: string) {
  const { error } = await client
    .from('prompts')
    .delete()
    .eq('id', promptId)
    .eq('user_id', userId);

  if (error) throw error;
}

export async function addPromptVersionToSupabase(client: SupabaseClient, version: SupabasePromptVersion) {
  const { data, error } = await client
    .from('prompt_versions')
    .insert([version])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function syncUserDataToSupabase(
  userId: string,
  queryOne: (db: any, sql: string, params?: any[]) => any,
  queryAll: (db: any, sql: string, params?: any[]) => any[],
  db: any,
  userPreferences?: string | null
) {
  try {
    let prefs = userPreferences;
    if (prefs === undefined) {
      const userRow = queryOne(db, 'SELECT preferences FROM users WHERE id = ?', [userId]);
      prefs = userRow?.preferences;
    }
    const config = getEffectiveSupabaseConfig(prefs);
    if (!config.supabaseUrl || !config.supabaseKey) return;

    const client = createSupabaseClient(config.supabaseUrl, config.supabaseKey);
    if (!client) return;

    const categories = queryAll(db, 'SELECT * FROM categories WHERE user_id = ?', [userId]);
    const collections = queryAll(db, 'SELECT * FROM collections WHERE user_id = ?', [userId]);
    const tags = queryAll(db, 'SELECT * FROM tags WHERE user_id = ?', [userId]);
    const prompts = queryAll(db, 'SELECT * FROM prompts WHERE user_id = ?', [userId]);
    const promptTags = queryAll(
      db,
      'SELECT pt.* FROM prompt_tags pt JOIN prompts p ON pt.prompt_id = p.id WHERE p.user_id = ?',
      [userId]
    );
    const promptVersions = queryAll(
      db,
      'SELECT pv.* FROM prompt_versions pv JOIN prompts p ON pv.prompt_id = p.id WHERE p.user_id = ?',
      [userId]
    );

    if (categories.length > 0) await client.from('categories').upsert(categories);
    if (collections.length > 0) await client.from('collections').upsert(collections);
    if (tags.length > 0) await client.from('tags').upsert(tags);
    if (prompts.length > 0) {
      const formatted = prompts.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        category_id: p.category_id || null,
        collection_id: p.collection_id || null,
        title: p.title,
        description: p.description || null,
        content: p.content,
        is_favorite: Boolean(p.is_favorite),
        is_pinned: Boolean(p.is_pinned),
        is_archived: Boolean(p.is_archived),
        copy_count: p.copy_count || 0,
        last_copied_at: p.last_copied_at || null,
        last_viewed_at: p.last_viewed_at || null,
        created_at: p.created_at,
        updated_at: p.updated_at,
      }));
      await client.from('prompts').upsert(formatted);
    }
    if (promptTags.length > 0) await client.from('prompt_tags').upsert(promptTags);
    if (promptVersions.length > 0) await client.from('prompt_versions').upsert(promptVersions);
  } catch (err: any) {
    console.warn('Auto-sync to Supabase database notice:', err.message);
  }
}

export interface DeduplicationResult {
  duplicatesRemoved: number;
  groupsCleaned: number;
  categoriesCleaned: number;
  collectionsCleaned: number;
  tagsCleaned: number;
  versionsCleaned: number;
}

/**
 * Identifies and consolidates duplicate categories, collections, tags, prompts, and versions,
 * keeping primary canonical entities, re-linking relations, and removing all redundancies.
 */
export async function deduplicatePromptsForUser(
  userId: string,
  queryOne: (db: any, sql: string, params?: any[]) => any,
  queryAll: (db: any, sql: string, params?: any[]) => any[],
  runQuery: (db: any, sql: string, params?: any[]) => void,
  db: any,
  userPreferences?: string | null
): Promise<DeduplicationResult> {
  try {
    let categoriesCleaned = 0;
    let collectionsCleaned = 0;
    let tagsCleaned = 0;
    let versionsCleaned = 0;
    let duplicatesRemoved = 0;
    let groupsCleaned = 0;

    const categoryIdsToDelete: string[] = [];
    const collectionIdsToDelete: string[] = [];
    const tagIdsToDelete: string[] = [];
    const promptIdsToDelete: string[] = [];

    // 1. Deduplicate Categories (by case-insensitive trimmed name)
    const allCategories = queryAll(
      db,
      'SELECT id, name, description, created_at FROM categories WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    const catMap = new Map<string, any[]>();
    for (const c of allCategories) {
      const key = (c.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!catMap.has(key)) catMap.set(key, []);
      catMap.get(key)!.push(c);
    }

    for (const [_key, catGroup] of catMap.entries()) {
      if (catGroup.length > 1) {
        // Keep the canonical one (first created or with most description)
        const canonical = catGroup[0];
        const duplicates = catGroup.slice(1);

        for (const dup of duplicates) {
          categoryIdsToDelete.push(dup.id);
          categoriesCleaned++;

          // Re-link prompts pointing to this duplicate category
          runQuery(
            db,
            'UPDATE prompts SET category_id = ? WHERE category_id = ? AND user_id = ?',
            [canonical.id, dup.id, userId]
          );

          // Re-link collections pointing to this duplicate category
          runQuery(
            db,
            'UPDATE collections SET category_id = ? WHERE category_id = ? AND user_id = ?',
            [canonical.id, dup.id, userId]
          );

          // Delete duplicate category
          runQuery(db, 'DELETE FROM categories WHERE id = ?', [dup.id]);
        }
      }
    }

    // 2. Deduplicate Collections (by case-insensitive trimmed name)
    const allCollections = queryAll(
      db,
      'SELECT id, name, description, category_id, created_at FROM collections WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    const colMap = new Map<string, any[]>();
    for (const col of allCollections) {
      const key = (col.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!colMap.has(key)) colMap.set(key, []);
      colMap.get(key)!.push(col);
    }

    for (const [_key, colGroup] of colMap.entries()) {
      if (colGroup.length > 1) {
        const canonical = colGroup[0];
        const duplicates = colGroup.slice(1);

        for (const dup of duplicates) {
          collectionIdsToDelete.push(dup.id);
          collectionsCleaned++;

          // Re-link prompts pointing to this duplicate collection
          runQuery(
            db,
            'UPDATE prompts SET collection_id = ? WHERE collection_id = ? AND user_id = ?',
            [canonical.id, dup.id, userId]
          );

          // Delete duplicate collection
          runQuery(db, 'DELETE FROM collections WHERE id = ?', [dup.id]);
        }
      }
    }

    // 3. Deduplicate Tags (by case-insensitive trimmed name)
    const allTags = queryAll(
      db,
      'SELECT id, name, created_at FROM tags WHERE user_id = ? ORDER BY created_at ASC',
      [userId]
    );
    const tagMap = new Map<string, any[]>();
    for (const t of allTags) {
      const key = (t.name || '').trim().toLowerCase();
      if (!key) continue;
      if (!tagMap.has(key)) tagMap.set(key, []);
      tagMap.get(key)!.push(t);
    }

    for (const [_key, tagGroup] of tagMap.entries()) {
      if (tagGroup.length > 1) {
        const canonical = tagGroup[0];
        const duplicates = tagGroup.slice(1);

        for (const dup of duplicates) {
          tagIdsToDelete.push(dup.id);
          tagsCleaned++;

          // Migrate prompt_tags from duplicate tag to canonical tag
          const affectedPrompts = queryAll(
            db,
            'SELECT prompt_id FROM prompt_tags WHERE tag_id = ?',
            [dup.id]
          );
          for (const ap of affectedPrompts) {
            runQuery(
              db,
              'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
              [ap.prompt_id, canonical.id]
            );
          }

          runQuery(db, 'DELETE FROM prompt_tags WHERE tag_id = ?', [dup.id]);
          runQuery(db, 'DELETE FROM tags WHERE id = ?', [dup.id]);
        }
      }
    }

    // 4. Deduplicate Prompts (by title and content)
    const allPrompts = queryAll(
      db,
      'SELECT id, title, content, copy_count, created_at, updated_at FROM prompts WHERE user_id = ? ORDER BY updated_at DESC',
      [userId]
    );

    const promptMap = new Map<string, any[]>();
    for (const p of allPrompts) {
      const key = `${(p.title || '').trim().toLowerCase()}|||${(p.content || '').trim()}`;
      if (!promptMap.has(key)) {
        promptMap.set(key, []);
      }
      promptMap.get(key)!.push(p);
    }

    for (const [_key, group] of promptMap.entries()) {
      if (group.length > 1) {
        groupsCleaned++;
        // Sort: highest copy count first, then most recently updated
        group.sort((a, b) => {
          if ((b.copy_count || 0) !== (a.copy_count || 0)) {
            return (b.copy_count || 0) - (a.copy_count || 0);
          }
          return new Date(b.updated_at || 0).getTime() - new Date(a.updated_at || 0).getTime();
        });

        const canonical = group[0];
        const duplicates = group.slice(1);

        for (const dup of duplicates) {
          promptIdsToDelete.push(dup.id);
          duplicatesRemoved++;

          // Migrate tags to canonical prompt
          const dupTags = queryAll(db, 'SELECT tag_id FROM prompt_tags WHERE prompt_id = ?', [dup.id]);
          for (const dt of dupTags) {
            runQuery(
              db,
              'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
              [canonical.id, dt.tag_id]
            );
          }

          // Re-link versions to canonical prompt
          runQuery(
            db,
            'UPDATE prompt_versions SET prompt_id = ? WHERE prompt_id = ?',
            [canonical.id, dup.id]
          );
          runQuery(db, 'DELETE FROM prompt_tags WHERE prompt_id = ?', [dup.id]);
          runQuery(db, 'DELETE FROM prompts WHERE id = ?', [dup.id]);
        }
      }
    }

    // 5. Clean duplicate versions pointing to the same prompt
    const allVersions = queryAll(
      db,
      `SELECT pv.id, pv.prompt_id, pv.version_number, pv.content 
       FROM prompt_versions pv 
       JOIN prompts p ON pv.prompt_id = p.id 
       WHERE p.user_id = ? 
       ORDER BY pv.prompt_id, pv.version_number ASC`,
      [userId]
    );

    const versionMap = new Map<string, string[]>();
    for (const v of allVersions) {
      const vKey = `${v.prompt_id}|||${(v.content || '').trim()}`;
      if (!versionMap.has(vKey)) {
        versionMap.set(vKey, []);
      }
      versionMap.get(vKey)!.push(v.id);
    }

    for (const [_vKey, vIds] of versionMap.entries()) {
      if (vIds.length > 1) {
        const toDelete = vIds.slice(1);
        for (const id of toDelete) {
          runQuery(db, 'DELETE FROM prompt_versions WHERE id = ?', [id]);
          versionsCleaned++;
        }
      }
    }

    // 6. Clean orphaned prompt_tags links
    runQuery(
      db,
      'DELETE FROM prompt_tags WHERE prompt_id NOT IN (SELECT id FROM prompts WHERE user_id = ?)',
      [userId]
    );
    runQuery(
      db,
      'DELETE FROM prompt_tags WHERE tag_id NOT IN (SELECT id FROM tags WHERE user_id = ?)',
      [userId]
    );

    // 7. Delete redundant records from Supabase PostgreSQL if configured
    let prefs = userPreferences;
    if (prefs === undefined) {
      const userRow = queryOne(db, 'SELECT preferences FROM users WHERE id = ?', [userId]);
      prefs = userRow?.preferences;
    }
    const config = getEffectiveSupabaseConfig(prefs);
    if (config.supabaseUrl && config.supabaseKey) {
      const client = createSupabaseClient(config.supabaseUrl, config.supabaseKey);
      if (client) {
        try {
          if (categoryIdsToDelete.length > 0) {
            await client.from('categories').delete().in('id', categoryIdsToDelete).eq('user_id', userId);
          }
          if (collectionIdsToDelete.length > 0) {
            await client.from('collections').delete().in('id', collectionIdsToDelete).eq('user_id', userId);
          }
          if (tagIdsToDelete.length > 0) {
            await client.from('tags').delete().in('id', tagIdsToDelete).eq('user_id', userId);
          }
          if (promptIdsToDelete.length > 0) {
            await client.from('prompts').delete().in('id', promptIdsToDelete).eq('user_id', userId);
          }
        } catch (e: any) {
          console.warn('Supabase deduplication delete notice:', e.message);
        }
      }
    }

    return {
      duplicatesRemoved,
      groupsCleaned,
      categoriesCleaned,
      collectionsCleaned,
      tagsCleaned,
      versionsCleaned,
    };
  } catch (err: any) {
    console.warn('Deduplication notice:', err.message);
    return {
      duplicatesRemoved: 0,
      groupsCleaned: 0,
      categoriesCleaned: 0,
      collectionsCleaned: 0,
      tagsCleaned: 0,
      versionsCleaned: 0,
    };
  }
}

export async function pullUserDataFromSupabase(
  userId: string,
  queryOne: (db: any, sql: string, params?: any[]) => any,
  runQuery: (db: any, sql: string, params?: any[]) => void,
  db: any,
  userPreferences?: string | null
): Promise<PullUserDataResult> {
  try {
    let prefs = userPreferences;
    if (prefs === undefined) {
      const userRow = queryOne(db, 'SELECT preferences FROM users WHERE id = ?', [userId]);
      prefs = userRow?.preferences;
    }
    const config = getEffectiveSupabaseConfig(prefs);
    if (!config.supabaseUrl || !config.supabaseKey) {
      return { success: false, message: 'Supabase URL and API Key are not configured.' };
    }

    const client = createSupabaseClient(config.supabaseUrl, config.supabaseKey);
    if (!client) {
      return { success: false, message: 'Could not initialize Supabase client.' };
    }

    // 1. Fetch user from Supabase if available
    const { data: user } = await client
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // 2. Fetch all user records from Supabase tables
    const [categoriesRes, collectionsRes, tagsRes, promptsRes] = await Promise.all([
      client.from('categories').select('*').eq('user_id', userId),
      client.from('collections').select('*').eq('user_id', userId),
      client.from('tags').select('*').eq('user_id', userId),
      client.from('prompts').select('*').eq('user_id', userId),
    ]);

    const promptIds = (promptsRes.data || []).map((p: any) => p.id);
    let promptTags: any[] = [];
    let promptVersions: any[] = [];

    if (promptIds.length > 0) {
      const [ptRes, pvRes] = await Promise.all([
        client.from('prompt_tags').select('*').in('prompt_id', promptIds),
        client.from('prompt_versions').select('*').in('prompt_id', promptIds),
      ]);
      promptTags = ptRes.data || [];
      promptVersions = pvRes.data || [];
    }

    // 3. Populate SQLite Database with fetched Supabase data
    if (user) {
      const userPrefsStr = typeof user.preferences === 'string'
        ? user.preferences
        : JSON.stringify(user.preferences || {});
      runQuery(
        db,
        'INSERT OR REPLACE INTO users (id, email, password_hash, display_name, preferences, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [user.id, user.email, user.password_hash, user.display_name, userPrefsStr, user.created_at, user.updated_at]
      );
    }

    // Categories
    let categoryCount = 0;
    if (categoriesRes.data && categoriesRes.data.length > 0) {
      for (const cat of categoriesRes.data) {
        runQuery(
          db,
          'INSERT OR REPLACE INTO categories (id, user_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [cat.id, cat.user_id, cat.name, cat.description || null, cat.created_at, cat.updated_at]
        );
      }
      categoryCount = categoriesRes.data.length;
    }

    // Collections
    let collectionCount = 0;
    if (collectionsRes.data && collectionsRes.data.length > 0) {
      for (const col of collectionsRes.data) {
        runQuery(
          db,
          'INSERT OR REPLACE INTO collections (id, user_id, category_id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [col.id, col.user_id, col.category_id || null, col.name, col.description || null, col.created_at, col.updated_at]
        );
      }
      collectionCount = collectionsRes.data.length;
    }

    // Tags
    let tagCount = 0;
    if (tagsRes.data && tagsRes.data.length > 0) {
      for (const tag of tagsRes.data) {
        runQuery(
          db,
          'INSERT OR REPLACE INTO tags (id, user_id, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          [tag.id, tag.user_id, tag.name, tag.created_at, tag.updated_at]
        );
      }
      tagCount = tagsRes.data.length;
    }

    // Prompts
    let promptCount = 0;
    if (promptsRes.data && promptsRes.data.length > 0) {
      for (const p of promptsRes.data) {
        runQuery(
          db,
          `INSERT OR REPLACE INTO prompts (id, user_id, category_id, collection_id, title, description, content, is_favorite, is_pinned, is_archived, copy_count, last_copied_at, last_viewed_at, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            p.id,
            p.user_id,
            p.category_id || null,
            p.collection_id || null,
            p.title,
            p.description || null,
            p.content,
            p.is_favorite ? 1 : 0,
            p.is_pinned ? 1 : 0,
            p.is_archived ? 1 : 0,
            p.copy_count || 0,
            p.last_copied_at || null,
            p.last_viewed_at || null,
            p.created_at,
            p.updated_at,
          ]
        );
      }
      promptCount = promptsRes.data.length;
    }

    // Prompt Tags
    for (const pt of promptTags) {
      runQuery(
        db,
        'INSERT OR IGNORE INTO prompt_tags (prompt_id, tag_id) VALUES (?, ?)',
        [pt.prompt_id, pt.tag_id]
      );
    }

    // Prompt Versions
    let versionCount = 0;
    if (promptVersions.length > 0) {
      for (const pv of promptVersions) {
        runQuery(
          db,
          'INSERT OR REPLACE INTO prompt_versions (id, prompt_id, version_number, title, description, content, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [pv.id, pv.prompt_id, pv.version_number, pv.title, pv.description || null, pv.content, pv.created_at]
        );
      }
      versionCount = promptVersions.length;
    }

    // Run auto-deduplication to guarantee no duplicates
    const { duplicatesRemoved } = await deduplicatePromptsForUser(
      userId,
      queryOne,
      (dbAny, sql, params) => {
        const stmt = dbAny.prepare(sql);
        if (params && params.length > 0) stmt.bind(params);
        const results: any[] = [];
        while (stmt.step()) results.push(stmt.getAsObject());
        stmt.free();
        return results;
      },
      runQuery,
      db,
      prefs
    );

    const message = duplicatesRemoved > 0
      ? `Successfully fetched ${promptCount} prompts from Supabase API and cleaned ${duplicatesRemoved} duplicate prompt(s).`
      : `Successfully fetched and synchronized ${promptCount} prompts, ${categoryCount} categories, ${collectionCount} collections, and ${tagCount} tags from Supabase API.`;

    return {
      success: true,
      message,
      fetchedCounts: {
        prompts: promptCount,
        categories: categoryCount,
        collections: collectionCount,
        tags: tagCount,
        versions: versionCount,
      },
      duplicatesRemoved,
    };
  } catch (err: any) {
    console.warn('Auto-pull from Supabase database error:', err.message);
    return {
      success: false,
      message: `Auto-fetch from Supabase API notice: ${err.message}`,
    };
  }
}
