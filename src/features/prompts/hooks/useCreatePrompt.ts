import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi, CreatePromptPayload } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePromptPayload) => promptApi.createPrompt(payload),
    onSuccess: () => {
      message.success('Prompt created successfully');
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to create prompt');
    },
  });
}
