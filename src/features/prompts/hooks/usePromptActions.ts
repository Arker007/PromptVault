import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';
import { useAuth } from '@/features/auth/index.ts';
import { guestStorage } from '../lib/guestStorage.ts';

export function usePromptActions() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  const favoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }: { id: string; isFavorite?: boolean }) => {
      if (!isAuthenticated) {
        const nextFav = isFavorite !== undefined ? isFavorite : !guestStorage.isFavorite(id);
        guestStorage.setFavorite(id, nextFav);
        return { success: true, isFavorite: nextFav };
      }
      return promptApi.toggleFavorite(id, isFavorite);
    },
    onSuccess: (res, vars) => {
      message.success(res.isFavorite ? 'Added to favorites' : 'Removed from favorites');
      queryClient.invalidateQueries();
    },
    onError: () => message.error('Failed to update favorite status'),
  });

  const pinMutation = useMutation({
    mutationFn: async ({ id, isPinned }: { id: string; isPinned?: boolean }) => {
      if (!isAuthenticated) {
        const nextPin = isPinned !== undefined ? isPinned : !guestStorage.isPinned(id);
        guestStorage.setPinned(id, nextPin);
        return { success: true, isPinned: nextPin };
      }
      return promptApi.togglePin(id, isPinned);
    },
    onSuccess: (res, vars) => {
      message.success(res.isPinned ? 'Prompt pinned to top' : 'Prompt unpinned');
      queryClient.invalidateQueries();
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
