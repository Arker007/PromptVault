import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseApi } from '../api/supabaseApi.ts';
import { message } from '@/shared/lib/message.ts';
import type { BackupItem } from '../types/index.ts';

export const useSupabaseBackups = () => {
  const queryClient = useQueryClient();

  const backupsQuery = useQuery<{ backups: BackupItem[] }>({
    queryKey: ['supabase-backups'],
    queryFn: supabaseApi.getBackups,
  });

  const createSnapshotMutation = useMutation({
    mutationFn: (data: { name?: string }) => supabaseApi.createSnapshot(data),
    onSuccess: () => {
      message.success('Snapshot backup created successfully!');
      queryClient.invalidateQueries({ queryKey: ['supabase-backups'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to create snapshot');
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (filename: string) => supabaseApi.restoreBackup(filename),
    onSuccess: (res) => {
      message.success(res.message || 'Backup restored successfully!');
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-db-stats'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to restore backup');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (filename: string) => supabaseApi.deleteBackup(filename),
    onSuccess: () => {
      message.success('Snapshot deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['supabase-backups'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to delete snapshot');
    },
  });

  return {
    backups: backupsQuery.data?.backups || [],
    isLoading: backupsQuery.isLoading,
    refetchBackups: backupsQuery.refetch,
    createSnapshot: createSnapshotMutation.mutate,
    isCreatingSnapshot: createSnapshotMutation.isPending,
    restoreBackup: restoreMutation.mutate,
    isRestoring: restoreMutation.isPending,
    deleteBackup: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
};
