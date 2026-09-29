import { useQuery } from '@tanstack/react-query';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function usePrompt(id?: string | null) {
  return useQuery({
    queryKey: promptKeys.detail(id || ''),
    queryFn: () => promptApi.getPrompt(id!),
    enabled: Boolean(id),
  });
}
