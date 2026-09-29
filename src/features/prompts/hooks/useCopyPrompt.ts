import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';

export function useCopyPrompt() {
  const queryClient = useQueryClient();

  const copyMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      // 1. Copy directly to clipboard immediately
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for older or restricted environments
        const textArea = document.createElement('textarea');
        textArea.value = content;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }

      // 2. Asynchronous usage event
      const res = await promptApi.recordCopyEvent(id);
      return { id, copyCount: res.copyCount, lastCopiedAt: res.lastCopiedAt };
    },
    onSuccess: (data) => {
      message.success('Prompt copied to clipboard');

      // Optimistically update prompt in cache if available
      queryClient.setQueryData(promptKeys.detail(data.id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          copyCount: data.copyCount,
          lastCopiedAt: data.lastCopiedAt,
        };
      });

      // Invalidate list queries softly
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
    },
    onError: (_err) => {
      message.error('Failed to copy prompt to clipboard');
    },
  });

  return {
    copyPrompt: (id: string, content: string) => copyMutation.mutate({ id, content }),
    isCopying: copyMutation.isPending,
  };
}
