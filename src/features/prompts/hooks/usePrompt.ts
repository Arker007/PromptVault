import { useQuery } from '@tanstack/react-query';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';
import { useAuth } from '@/features/auth/index.ts';
import { guestStorage } from '../lib/guestStorage.ts';

export function usePrompt(id?: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...promptKeys.detail(id || ''), isAuthenticated ? 'auth' : 'guest'],
    queryFn: async () => {
      const p = await promptApi.getPrompt(id!);
      if (!isAuthenticated && p) {
        return {
          ...p,
          isFavorite: guestStorage.isFavorite(p.id),
          isPinned: guestStorage.isPinned(p.id),
        };
      }
      return p;
    },
    enabled: Boolean(id),
  });
}
