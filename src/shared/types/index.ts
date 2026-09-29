export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    defaultPageSize?: number;
    copyNotificationDuration?: number;
  };
  createdAt?: string;
}

export interface TagItem {
  id: string;
  name: string;
  promptCount?: number;
  lastUsed?: string;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  promptCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CollectionItem {
  id: string;
  name: string;
  description?: string;
  category?: { id: string; name: string } | null;
  promptCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PromptSummaryDTO {
  id: string;
  title: string;
  description: string;
  preview: string;
  content: string;
  category: { id: string; name: string } | null;
  collection: { id: string; name: string } | null;
  tags: TagItem[];
  isFavorite: boolean;
  isArchived: boolean;
  copyCount: number;
  lastCopiedAt: string | null;
  lastViewedAt: string | null;
  createdAt: string;
  updatedAt: string;
  variables: string[];
  hasVariables: boolean;
}

export interface PromptDetailDTO extends PromptSummaryDTO {
  versionCount: number;
}

export interface PromptVersionItem {
  id: string;
  versionNumber: number;
  title: string;
  description: string;
  content: string;
  createdAt: string;
}

export interface PromptQueryParams {
  q?: string;
  category?: string;
  collection?: string;
  tags?: string;
  favorite?: boolean | string;
  archived?: boolean | string;
  sort?: string;
  page?: number;
  pageSize?: number;
  has_variables?: boolean | string;
  created_from?: string;
  created_to?: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
