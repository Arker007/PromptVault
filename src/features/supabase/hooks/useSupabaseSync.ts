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
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to push data to Supabase');
    },
  });

  return {
    pushLocalToRemote: syncPushMutation.mutate,
    isSyncing: syncPushMutation.isPending,
  };
};
