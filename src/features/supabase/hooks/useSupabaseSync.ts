import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../api/supabaseApi.ts';
import { message } from '@/shared/lib/message.ts';

export const useSupabaseSync = () => {
  const queryClient = useQueryClient();

  const syncPushMutation = useMutation({
    mutationFn: supabaseApi.pushLocalToRemote,
    onSuccess: (res) => {
      message.success(res.message || 'Pushed local data to Supabase successfully!');
      queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-config'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to push data to Supabase');
    },
  });

  const syncPullMutation = useMutation({
    mutationFn: supabaseApi.pullRemoteToLocal,
    onSuccess: (res) => {
      message.success(res.message || 'Successfully fetched data from Supabase API!');
      queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-config'] });
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to fetch data from Supabase API');
    },
  });

  const deduplicateMutation = useMutation({
    mutationFn: supabaseApi.deduplicate,
    onSuccess: (res) => {
      if (
        res.duplicatesRemoved > 0 ||
        (res.categoriesCleaned && res.categoriesCleaned > 0) ||
        (res.collectionsCleaned && res.collectionsCleaned > 0) ||
        (res.tagsCleaned && res.tagsCleaned > 0) ||
        (res.versionsCleaned && res.versionsCleaned > 0)
      ) {
        message.success(res.message);
      } else {
        message.info(res.message || 'Your library has no duplicate items.');
      }
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to remove duplicate items');
    },
  });

  return {
    pushLocalToRemote: syncPushMutation.mutate,
    isSyncing: syncPushMutation.isPending,
    pullRemoteToLocal: syncPullMutation.mutate,
    isFetchingRemote: syncPullMutation.isPending,
    deduplicatePrompts: deduplicateMutation.mutate,
    isDeduplicating: deduplicateMutation.isPending,
  };
};
