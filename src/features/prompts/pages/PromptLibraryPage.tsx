import React, { useState, useMemo } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { PromptToolbar } from '../components/PromptToolbar.tsx';
import { PromptActiveFilters } from '../components/PromptActiveFilters.tsx';
import { PromptList } from '../components/PromptList.tsx';
import { PromptDrawer } from '../components/PromptDrawer.tsx';
import { PromptFormDrawer } from '../components/PromptFormDrawer.tsx';
import { AdvancedFiltersDrawer } from '../components/AdvancedFiltersDrawer.tsx';
import { PromptVariablesModal } from '@/features/prompt-variables/components/PromptVariablesModal.tsx';
import { usePrompts } from '../hooks/usePrompts.ts';
import { promptApi } from '../api/promptApi.ts';
import { promptKeys } from '../api/promptKeys.ts';
import { apiClient } from '@/shared/api/apiClient.ts';
import {
  PromptQueryParams,
  PromptSummaryDTO,
  CategoryItem,
  CollectionItem,
  TagItem,
} from '@/shared/types/index.ts';

interface PromptLibraryPageProps {
  preset?: 'all' | 'favorites' | 'recent' | 'archived';
}

export const PromptLibraryPage: React.FC<PromptLibraryPageProps> = ({ preset = 'all' }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const outletContext = useOutletContext<{ onOpenNewPrompt: () => void } | null>();

  // Detail drawer & form state
  const detailPromptId = searchParams.get('detailId');
  const [editingPrompt, setEditingPrompt] = useState<PromptSummaryDTO | null>(null);
  const [advancedFiltersOpen, setAdvancedFiltersOpen] = useState(false);
  const [variablesModalPrompt, setVariablesModalPrompt] = useState<PromptSummaryDTO | null>(null);

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Parse filters from URL
  const filters: PromptQueryParams = useMemo(() => {
    const q = searchParams.get('q') || '';
    const category = searchParams.get('category') || '';
    const collection = searchParams.get('collection') || '';
    const tags = searchParams.get('tags') || '';
    const sort =
      searchParams.get('sort') ||
      (preset === 'recent' ? 'recently_used' : 'recently_updated');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '25', 10);
    const has_variables = searchParams.get('has_variables') || undefined;
    const created_from = searchParams.get('created_from') || undefined;
    const created_to = searchParams.get('created_to') || undefined;

    let favorite = searchParams.get('favorite') || undefined;
    let archived = searchParams.get('archived') || undefined;

    if (preset === 'favorites') {
      favorite = 'true';
      archived = 'false';
    } else if (preset === 'recent') {
      archived = 'false';
    } else if (preset === 'archived') {
      archived = 'true';
    } else {
      archived = 'false';
    }

    return {
      q,
      category,
      collection,
      tags,
      sort,
      page,
      pageSize,
      favorite,
      archived,
      has_variables,
      created_from,
      created_to,
    };
  }, [searchParams, preset]);

  // Fetch prompts
  const { data, isLoading } = usePrompts(filters);

  // Fetch categories, collections, tags for filter dropdowns
  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories'),
  });

  const { data: collections = [] } = useQuery<CollectionItem[]>({
    queryKey: ['collections'],
    queryFn: () => apiClient.get('/api/collections'),
  });

  const { data: tags = [] } = useQuery<TagItem[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.get('/api/tags'),
  });

  // URL state updater
  const updateUrlFilters = (newFilters: Partial<PromptQueryParams>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v === undefined || v === null || v === '') {
        next.delete(k);
      } else {
        next.set(k, String(v));
      }
    });
    setSearchParams(next, { replace: true });
  };

  const handleRemoveFilter = (key: keyof PromptQueryParams, val?: string) => {
    if (key === 'tags' && val && filters.tags) {
      const remaining = filters.tags
        .split(',')
        .filter((t) => t.trim() !== val.trim())
        .join(',');
      updateUrlFilters({ tags: remaining || undefined, page: 1 });
    } else {
      updateUrlFilters({ [key]: undefined, page: 1 });
    }
  };

  const handleClearAllFilters = () => {
    const next = new URLSearchParams();
    if (filters.pageSize && filters.pageSize !== 25) {
      next.set('pageSize', String(filters.pageSize));
    }
    setSearchParams(next, { replace: true });
  };

  const handleSelectPrompt = (id: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('detailId', id);
    setSearchParams(next, { replace: true });
  };

  const handleCloseDetail = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('detailId');
    setSearchParams(next, { replace: true });
  };

  // Bulk actions mutation
  const bulkMutation = useMutation({
    mutationFn: ({ action, ids }: { action: 'delete' | 'archive' | 'restore'; ids: string[] }) =>
      promptApi.bulkAction(action, ids),
    onSuccess: (res) => {
      message.success(`Successfully updated ${res.count} prompt(s)`);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: promptKeys.all });
    },
    onError: () => message.error('Failed to perform bulk action'),
  });

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Preset headers
  const getHeaderInfo = () => {
    switch (preset) {
      case 'favorites':
        return {
          title: 'Favorite Prompts',
          description: 'Quick access to your most valued and starred prompt templates.',
        };
      case 'recent':
        return {
          title: 'Recently Used Prompts',
          description: 'Prompts ordered by your most recent copy events and inspection history.',
        };
      case 'archived':
        return {
          title: 'Archived Prompts',
          description: 'Retired or deprecated prompts. You can inspect, restore, or delete them permanently.',
        };
      default:
        return {
          title: 'All Prompts',
          description: 'Comprehensive personal knowledge base of engineering, writing, and strategy prompts.',
        };
    }
  };

  const headerInfo = getHeaderInfo();
  const isFiltered = Boolean(
    filters.q ||
      filters.category ||
      filters.collection ||
      filters.tags ||
      filters.has_variables ||
      (preset === 'all' && filters.favorite)
  );

  const matchedCategory = categories.find((c) => c.id === filters.category);
  const matchedCollection = collections.find((col) => col.id === filters.collection);

  return (
    <div>
      {/* Page Header */}
      <PageHeader
        title={headerInfo.title}
        count={data?.total}
        description={headerInfo.description}
        extra={
          preset !== 'archived' ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => outletContext?.onOpenNewPrompt()}
            >
              New Prompt
            </Button>
          ) : null
        }
      />

      {/* Toolbar */}
      <PromptToolbar
        filters={filters}
        onFilterChange={updateUrlFilters}
        categories={categories}
        collections={collections}
        tags={tags}
        onOpenAdvancedFilters={() => setAdvancedFiltersOpen(true)}
        selectedCount={selectedIds.length}
        onBulkAction={(action) => {
          if (action === 'delete' || action === 'archive' || action === 'restore') {
            bulkMutation.mutate({ action, ids: selectedIds });
          }
        }}
        onClearSelection={() => setSelectedIds([])}
        isArchivedView={preset === 'archived'}
      />

      {/* Active Filters */}
      <PromptActiveFilters
        filters={filters}
        onRemoveFilter={handleRemoveFilter}
        onClearAll={handleClearAllFilters}
        categoryName={matchedCategory?.name}
        collectionName={matchedCollection?.name}
      />

      {/* Main List & Pagination */}
      <PromptList
        items={data?.items || []}
        total={data?.total || 0}
        page={filters.page || 1}
        pageSize={filters.pageSize || 25}
        isLoading={isLoading}
        isFiltered={isFiltered}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onPageChange={(page, pageSize) => updateUrlFilters({ page, pageSize })}
        onPromptClick={handleSelectPrompt}
        onEditPrompt={(prompt) => setEditingPrompt(prompt)}
        onUseVariables={(prompt) => setVariablesModalPrompt(prompt)}
        onClearFilters={handleClearAllFilters}
        onCreatePrompt={() => outletContext?.onOpenNewPrompt()}
      />

      {/* Detail Drawer (Deep-link & scroll preservation) */}
      <PromptDrawer
        promptId={detailPromptId}
        onClose={handleCloseDetail}
        onEdit={(prompt) => setEditingPrompt(prompt)}
      />

      {/* Edit Prompt Drawer */}
      <PromptFormDrawer
        open={Boolean(editingPrompt)}
        promptToEdit={editingPrompt}
        onClose={() => setEditingPrompt(null)}
      />

      {/* Advanced Filters Drawer */}
      <AdvancedFiltersDrawer
        open={advancedFiltersOpen}
        onClose={() => setAdvancedFiltersOpen(false)}
        filters={filters}
        onApplyFilters={updateUrlFilters}
        onResetFilters={handleClearAllFilters}
        categories={categories}
        collections={collections}
        tags={tags}
      />

      {/* Variables Modal */}
      <PromptVariablesModal
        open={Boolean(variablesModalPrompt)}
        prompt={variablesModalPrompt}
        onClose={() => setVariablesModalPrompt(null)}
      />
    </div>
  );
};
