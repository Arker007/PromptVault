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
