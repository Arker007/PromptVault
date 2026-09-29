import { apiClient } from '@/shared/api/apiClient.ts';
import {
  PromptSummaryDTO,
  PromptDetailDTO,
  PromptQueryParams,
  PaginatedResult,
  PromptVersionItem,
} from '@/shared/types/index.ts';

export interface CreatePromptPayload {
  title: string;
  description?: string;
  content: string;
  categoryId?: string | null;
  collectionId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdatePromptPayload {
  title?: string;
  description?: string;
  content?: string;
  categoryId?: string | null;
  collectionId?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  isArchived?: boolean;
}

export const promptApi = {
  getPrompts: (params: PromptQueryParams) =>
    apiClient.get<PaginatedResult<PromptSummaryDTO>>('/api/prompts', params),

  getPrompt: (id: string) => apiClient.get<PromptDetailDTO>(`/api/prompts/${id}`),

  createPrompt: (payload: CreatePromptPayload) =>
    apiClient.post<{ id: string; success: boolean }>('/api/prompts', payload),

  updatePrompt: (id: string, payload: UpdatePromptPayload) =>
    apiClient.patch<{ id: string; success: boolean }>(`/api/prompts/${id}`, payload),

  deletePrompt: (id: string) =>
    apiClient.delete<{ success: boolean; message: string }>(`/api/prompts/${id}`),

  toggleFavorite: (id: string, isFavorite?: boolean) =>
    apiClient.post<{ success: boolean; isFavorite: boolean }>(`/api/prompts/${id}/favorite`, {
      isFavorite,
    }),

  archivePrompt: (id: string) =>
    apiClient.post<{ success: boolean; isArchived: boolean }>(`/api/prompts/${id}/archive`),

  restorePrompt: (id: string) =>
    apiClient.post<{ success: boolean; isArchived: boolean }>(`/api/prompts/${id}/restore`),

  recordCopyEvent: (id: string) =>
    apiClient.post<{ success: boolean; copyCount: number; lastCopiedAt: string }>(
      `/api/prompts/${id}/copy-event`
    ),

  duplicatePrompt: (id: string) =>
    apiClient.post<{ id: string; title: string; success: boolean }>(
      `/api/prompts/${id}/duplicate`
    ),

  getVersions: (id: string) =>
    apiClient.get<{ versions: PromptVersionItem[] }>(`/api/prompts/${id}/versions`),

  restoreVersion: (promptId: string, versionId: string) =>
    apiClient.post<{ success: boolean; versionNumber: number }>(
      `/api/prompts/${promptId}/versions/${versionId}/restore`
    ),

  bulkAction: (action: 'delete' | 'archive' | 'restore' | 'addTag', ids: string[], data?: any) =>
    apiClient.post<{ success: boolean; count: number; action: string }>('/api/prompts/bulk', {
      action,
      ids,
      data,
    }),
};
