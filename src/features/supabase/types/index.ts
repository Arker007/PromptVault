export interface SupabaseConfigData {
  supabaseUrl: string;
  supabaseKey: string;
  isKeySet: boolean;
  backupBucket: string;
  assetBucket: string;
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | 'weekly';
}

export interface BackupItem {
  id?: string;
  name: string;
  path: string;
  bucket: string;
  size: number;
  createdAt: string;
}

export interface StorageFileItem {
  name: string;
  path: string;
  bucket: string;
  size: number;
  mimetype: string;
  url: string;
  createdAt: string;
}

export interface SupabaseDbStats {
  isConfigured: boolean;
  error?: string;
  stats?: {
    prompts: number;
    categories: number;
    collections: number;
    tags: number;
    promptVersions?: number;
    variables?: number;
    promptTags?: number;
  };
}

export interface SyncResult {
  message: string;
  counts?: Record<string, number>;
}
