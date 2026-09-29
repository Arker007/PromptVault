import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../api/supabaseApi.ts';
import { message } from '@/shared/lib/message.ts';
import type { SupabaseDbStats } from '../types/index.ts';

export const useSupabaseStats = () => {
  const queryClient = useQueryClient();

  const statsQuery = useQuery<SupabaseDbStats>({
    queryKey: ['supabase-db-stats'],
    queryFn: supabaseApi.getDbStats,
    retry: 1,
  });

  const schemaSqlQuery = useQuery<{ sql: string }>({
    queryKey: ['supabase-schema-sql'],
    queryFn: supabaseApi.getSchemaSql,
  });

  const testDbConnectionMutation = useMutation({
    mutationFn: supabaseApi.testDbTables,
    onSuccess: (res) => {
      if (res.success) {
        message.success('PostgreSQL tables verified successfully!');
        queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
      } else {
        message.warning(res.message || 'Database tables missing or not initialized');
      }
    },
    onError: (err: any) => {
      message.error(err.message || 'Database connection test failed');
    },
  });

  return {
    dbStats: statsQuery.data,
    isDbStatsLoading: statsQuery.isLoading,
    refetchDbStats: statsQuery.refetch,
    schemaSql: schemaSqlQuery.data?.sql || '',
    testDbConnection: testDbConnectionMutation.mutate,
    isTestingDb: testDbConnectionMutation.isPending,
  };
};
