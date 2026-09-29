import { PromptQueryParams } from '@/shared/types/index.ts';

export const promptKeys = {
  all: ['prompts'] as const,
  lists: () => [...promptKeys.all, 'list'] as const,
  list: (filters: PromptQueryParams) => [...promptKeys.lists(), filters] as const,
  details: () => [...promptKeys.all, 'detail'] as const,
  detail: (id: string) => [...promptKeys.details(), id] as const,
  versions: (id: string) => [...promptKeys.all, 'versions', id] as const,
};
