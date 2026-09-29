import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi, UpdatePromptPayload } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePromptPayload }) =>
      promptApi.updatePrompt(id, payload),
    onSuccess: (_, variables) => {
      message.success('Prompt updated');
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(variables.id) });
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to update prompt');
    },
  });
}
