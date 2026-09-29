import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => promptApi.deletePrompt(id),
    onSuccess: () => {
      message.success('Prompt deleted');
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to delete prompt');
    },
  });
}
