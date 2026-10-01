import { useQuery } from '@tanstack/react-query';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';
import { PromptQueryParams } from '@/shared/types/index.ts';
import { useAuth } from '@/features/auth/index.ts';
import { guestStorage } from '../lib/guestStorage.ts';

export function usePrompts(filters: PromptQueryParams) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: [...promptKeys.list(filters), isAuthenticated ? 'auth' : 'guest'],
    queryFn: async () => {
      const res = await promptApi.getPrompts(filters);

      if (!isAuthenticated) {
        const guestFavs = guestStorage.getFavorites();
        const guestPins = guestStorage.getPinned();

        let items = res.items.map((item) => {
          const isFav = guestFavs.includes(item.id);
          const isPin = guestPins.includes(item.id);
          return {
            ...item,
            isFavorite: isFav,
            isPinned: isPin,
          };
        });

        if (filters.favorite === 'true') {
          items = items.filter((i) => i.isFavorite);
        }
        if (filters.pinned === 'true') {
          items = items.filter((i) => i.isPinned);
        }

        // Keep pinned at top
        items.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });

        return {
          ...res,
          items,
          total: items.length,
        };
      }

      return res;
    },
    placeholderData: (prev) => prev,
  });
}
