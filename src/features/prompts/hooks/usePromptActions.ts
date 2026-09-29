import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function usePromptActions() {
  const queryClient = useQueryClient();

  const favoriteMutation = useMutation({
    mutationFn: ({ id, isFavorite }: { id: string; isFavorite?: boolean }) =>
      promptApi.toggleFavorite(id, isFavorite),
    onSuccess: (res, vars) => {
      message.success(res.isFavorite ? 'Added to favorites' : 'Removed from favorites');
      queryClient.setQueryData(promptKeys.detail(vars.id), (old: any) =>
        old ? { ...old, isFavorite: res.isFavorite } : old
      );
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: () => message.error('Failed to update favorite status'),
  });

  const pinMutation = useMutation({
    mutationFn: ({ id, isPinned }: { id: string; isPinned?: boolean }) =>
      promptApi.togglePin(id, isPinned),
    onSuccess: (res, vars) => {
      message.success(res.isPinned ? 'Prompt pinned to top' : 'Prompt unpinned');
      queryClient.setQueryData(promptKeys.detail(vars.id), (old: any) =>
        old ? { ...old, isPinned: res.isPinned } : old
      );
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: () => message.error('Failed to update pin status'),
  });

  const archiveMutation = useMutation({
    mutationFn: (id: string) => promptApi.archivePrompt(id),
    onSuccess: (_, id) => {
      message.success('Prompt archived');
      queryClient.setQueryData(promptKeys.detail(id), (old: any) =>
        old ? { ...old, isArchived: true } : old
      );
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: () => message.error('Failed to archive prompt'),
  });

  const restoreMutation = useMutation({
    mutationFn: (id: string) => promptApi.restorePrompt(id),
    onSuccess: (_, id) => {
      message.success('Prompt restored from archive');
      queryClient.setQueryData(promptKeys.detail(id), (old: any) =>
        old ? { ...old, isArchived: false } : old
      );
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: () => message.error('Failed to restore prompt'),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => promptApi.duplicatePrompt(id),
    onSuccess: (res) => {
      message.success(`Prompt duplicated as "${res.title}"`);
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
    onError: () => message.error('Failed to duplicate prompt'),
  });

  return {
    toggleFavorite: (id: string, isFavorite?: boolean) => favoriteMutation.mutate({ id, isFavorite }),
    isTogglingFavorite: favoriteMutation.isPending,
    togglePin: (id: string, isPinned?: boolean) => pinMutation.mutate({ id, isPinned }),
    isTogglingPin: pinMutation.isPending,
    archivePrompt: (id: string) => archiveMutation.mutate(id),
    isArchiving: archiveMutation.isPending,
    restorePrompt: (id: string) => restoreMutation.mutate(id),
    isRestoring: restoreMutation.isPending,
    duplicatePrompt: (id: string) => duplicateMutation.mutate(id),
    isDuplicating: duplicateMutation.isPending,
  };
}
