import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../api/supabaseApi.ts';
import { message } from '@/shared/lib/message.ts';
import type { SupabaseConfigData } from '../types/index.ts';

export const useSupabaseConfig = () => {
  const queryClient = useQueryClient();

  const configQuery = useQuery<SupabaseConfigData>({
    queryKey: ['supabase-config'],
    queryFn: supabaseApi.getConfig,
  });

  const saveConfigMutation = useMutation({
    mutationFn: (values: Partial<SupabaseConfigData>) => supabaseApi.updateConfig(values),
    onSuccess: () => {
      message.success('Supabase connection credentials stored successfully');
      queryClient.invalidateQueries({ queryKey: ['supabase-config'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-backups'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to save configuration');
    },
  });

  const testConnectionMutation = useMutation({
    mutationFn: supabaseApi.testConnection,
    onSuccess: (res) => {
      if (res.success) {
        message.success(res.message || 'Supabase connection successful!');
      } else {
        message.warning(res.message || 'Could not connect to Supabase');
      }
    },
    onError: (err: any) => {
      message.error(err.message || 'Connection test failed');
    },
  });

  return {
    config: configQuery.data,
    isLoading: configQuery.isLoading,
    isError: configQuery.isError,
    saveConfig: saveConfigMutation.mutate,
    isSaving: saveConfigMutation.isPending,
    testConnection: testConnectionMutation.mutate,
    isTesting: testConnectionMutation.isPending,
    refetchConfig: configQuery.refetch,
  };
};
