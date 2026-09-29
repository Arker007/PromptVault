import { useQuery } from '@tanstack/react-query';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';
import { PromptQueryParams } from '@/shared/types/index.ts';

export function usePrompts(filters: PromptQueryParams) {
  return useQuery({
    queryKey: promptKeys.list(filters),
    queryFn: () => promptApi.getPrompts(filters),
    placeholderData: (prev) => prev,
  });
}
