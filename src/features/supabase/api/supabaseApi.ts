import { apiClient } from '@/shared/api/apiClient.ts';
import type {
  SupabaseConfigData,
  BackupItem,
  SupabaseDbStats,
  SyncResult,
} from '../types/index.ts';

export const supabaseApi = {
  getConfig: async (): Promise<SupabaseConfigData> => {
    return apiClient.get('/api/supabase/config');
  },

  updateConfig: async (data: Partial<SupabaseConfigData>): Promise<{ message: string; pulled?: any }> => {
    return apiClient.post('/api/supabase/config', data);
  },

  testConnection: async (data?: { supabaseUrl?: string; supabaseKey?: string }): Promise<{ success: boolean; message: string; buckets?: string[] }> => {
    return apiClient.post('/api/supabase/test-connection', data || {});
  },

  testDbTables: async (): Promise<{ success: boolean; message: string; stats?: SupabaseDbStats['stats'] }> => {
    return apiClient.post('/api/supabase/db/test', {});
  },

  getDbStats: async (): Promise<SupabaseDbStats> => {
    return apiClient.get('/api/supabase/db/stats');
  },

  getSchemaSql: async (): Promise<{ sql: string }> => {
    return apiClient.get('/api/supabase/db/schema');
  },

  pushLocalToRemote: async (): Promise<SyncResult> => {
    return apiClient.post('/api/supabase/db/migrate-from-sqlite', {});
  },

  pullRemoteToLocal: async (): Promise<SyncResult> => {
    return apiClient.post('/api/supabase/db/pull-from-remote', {});
  },

  deduplicate: async (): Promise<{ success: boolean; duplicatesRemoved: number; groupsCleaned: number; message: string }> => {
    return apiClient.post('/api/prompts/deduplicate', {});
  },

  getBackups: async (): Promise<{ backups: BackupItem[] }> => {
    return apiClient.get('/api/supabase/backups');
  },

  createSnapshot: async (data: { name?: string }): Promise<{ message: string; file: BackupItem }> => {
    return apiClient.post('/api/supabase/backups/create', data);
  },

  restoreBackup: async (filename: string): Promise<{ message: string }> => {
    return apiClient.post('/api/supabase/backups/restore', { fileName: filename });
  },

  deleteBackup: async (filename: string): Promise<{ message: string }> => {
    return apiClient.delete('/api/supabase/backups', { fileName: filename });
  },
};
