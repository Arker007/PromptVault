import { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseClient, getEffectiveSupabaseConfig } from './supabase.js';

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
  db: any
) {
  try {
    const userRow = queryOne(db, 'SELECT preferences FROM users WHERE id = ?', [userId]);
    const config = getEffectiveSupabaseConfig(userRow?.preferences);
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
