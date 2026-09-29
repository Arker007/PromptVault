import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  supabaseUrl?: string;
  supabaseKey?: string;
  backupBucket?: string;
  assetBucket?: string;
  autoBackupEnabled?: boolean;
  autoBackupFrequency?: 'daily' | 'weekly';
}

export function getEffectiveSupabaseConfig(userPreferences?: string | null): SupabaseConfig {
  let prefs: any = {};
  if (userPreferences) {
    try {
      prefs = JSON.parse(userPreferences);
    } catch {}
  }

  const supabasePrefs = prefs.supabase || {};

  return {
    supabaseUrl: supabasePrefs.supabaseUrl || process.env.SUPABASE_URL || '',
    supabaseKey: supabasePrefs.supabaseKey || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    backupBucket: supabasePrefs.backupBucket || 'promptvault-backups',
    assetBucket: supabasePrefs.assetBucket || 'promptvault-assets',
    autoBackupEnabled: Boolean(supabasePrefs.autoBackupEnabled),
    autoBackupFrequency: supabasePrefs.autoBackupFrequency || 'daily',
  };
}

export function createSupabaseClient(url?: string, key?: string): SupabaseClient | null {
  const targetUrl = (url || '').trim();
  const targetKey = (key || '').trim();

  if (!targetUrl || !targetKey) {
    return null;
  }

  try {
    return createClient(targetUrl, targetKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string; buckets?: string[] }> {
  const client = createSupabaseClient(url, key);
  if (!client) {
    return { success: false, message: 'Invalid Supabase URL or Key format. Please provide a valid project URL (https://xyz.supabase.co) and API key.' };
  }

  try {
    const { data: buckets, error } = await client.storage.listBuckets();
    if (error) {
      return { success: false, message: `Supabase Storage error: ${error.message}` };
    }

    const bucketNames = (buckets || []).map((b) => b.name);
    return {
      success: true,
      message: 'Successfully connected to Supabase Storage!',
      buckets: bucketNames,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed to Supabase.' };
  }
}

export async function testSupabaseDatabase(url: string, key: string): Promise<{ success: boolean; message: string; tableCount?: number; promptCount?: number }> {
  const client = createSupabaseClient(url, key);
  if (!client) {
    return { success: false, message: 'Invalid Supabase URL or Key format.' };
  }

  try {
    const { count, error } = await client.from('prompts').select('*', { count: 'exact', head: true });
    if (error) {
      if (error.message.includes('relation "public.prompts" does not exist') || error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but required tables (e.g. prompts) are not initialized yet. Please run the Phase 1 SQL Schema script in your Supabase SQL Editor.',
        };
      }
      return { success: false, message: `Database error: ${error.message}` };
    }

    return {
      success: true,
      message: 'Successfully verified connection to direct Supabase Database!',
      promptCount: count || 0,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to query Supabase Database.' };
  }
}

export function getSupabaseSchemaSql(): string {
  return `-- Supabase PostgreSQL Schema Definition for PromptVault
-- Run this script in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tags (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  collection_id TEXT REFERENCES public.collections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  copy_count INT NOT NULL DEFAULT 0,
  last_copied_at TIMESTAMPTZ,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_tags (
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  tag_id TEXT NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

CREATE TABLE IF NOT EXISTS public.prompt_versions (
  id TEXT PRIMARY KEY,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prompts_user_id ON public.prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_is_pinned ON public.prompts(is_pinned);
CREATE INDEX IF NOT EXISTS idx_prompts_updated_at ON public.prompts(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_category_id ON public.prompts(category_id);
CREATE INDEX IF NOT EXISTS idx_prompts_collection_id ON public.prompts(collection_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_collections_user_id ON public.collections(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON public.tags(user_id);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompt_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow full access for users" ON public.users FOR ALL USING (true);
CREATE POLICY "Allow full access for categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Allow full access for collections" ON public.collections FOR ALL USING (true);
CREATE POLICY "Allow full access for tags" ON public.tags FOR ALL USING (true);
CREATE POLICY "Allow full access for prompts" ON public.prompts FOR ALL USING (true);
CREATE POLICY "Allow full access for prompt_tags" ON public.prompt_tags FOR ALL USING (true);
CREATE POLICY "Allow full access for prompt_versions" ON public.prompt_versions FOR ALL USING (true);`;
}

export async function ensureBucketExists(client: SupabaseClient, bucketName: string, isPublic = false): Promise<{ created: boolean; error?: string }> {
  try {
    const { data: buckets, error: listError } = await client.storage.listBuckets();
    if (!listError && buckets) {
      const exists = buckets.some((b) => b.name === bucketName);
      if (exists) {
        return { created: true };
      }
    }

    const { error: createError } = await client.storage.createBucket(bucketName, {
      public: isPublic,
    });

    if (createError) {
      if (createError.message.includes('already exists')) {
        return { created: true };
      }
      return { created: false, error: createError.message };
    }

    return { created: true };
  } catch (err: any) {
    return { created: false, error: err.message };
  }
}
