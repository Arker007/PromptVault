import React from 'react';
import {
  Input,
  Select,
  Button,
  Flex,
  Space,
  Badge,
  Tooltip,
  Popconfirm,
  theme,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  InboxOutlined,
  RollbackOutlined,
  PushpinOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { PromptQueryParams, CategoryItem, CollectionItem, TagItem } from '@/shared/types/index.ts';

interface PromptToolbarProps {
  filters: PromptQueryParams;
  onFilterChange: (newFilters: Partial<PromptQueryParams>) => void;
  categories: CategoryItem[];
  collections: CollectionItem[];
  tags: TagItem[];
  onOpenAdvancedFilters: () => void;
  selectedCount: number;
  onBulkAction: (action: 'delete' | 'archive' | 'restore' | 'addTag' | 'pin' | 'unpin') => void;
  onClearSelection: () => void;
  isArchivedView?: boolean;
  onFetchSupabase?: () => void;
  isFetchingSupabase?: boolean;
}

export const PromptToolbar: React.FC<PromptToolbarProps> = ({
  filters,
  onFilterChange,
  categories,
  collections,
  tags,
  onOpenAdvancedFilters,
  selectedCount,
  onBulkAction,
  onClearSelection,
  isArchivedView,
  onFetchSupabase,
  isFetchingSupabase,
}) => {
  const { token } = theme.useToken();

  const sortOptions = [
    { label: 'Recently Updated', value: 'recently_updated' },
    { label: 'Recently Used', value: 'recently_used' },
    { label: 'Recently Created', value: 'recently_created' },
    { label: 'Most Copied', value: 'most_copied' },
    { label: 'Title (A-Z)', value: 'title_asc' },
    { label: 'Title (Z-A)', value: 'title_desc' },
  ];

  const hasAdvancedFilters = Boolean(
    filters.has_variables ||
    filters.created_from ||
    filters.created_to ||
    (filters.favorite && !filters.archived)
  );

  return (
    <div style={{ marginBottom: 16 }}>
      {/* 
        Standard Filters Toolbar: Always rendered in place to maintain
        100% zero-layout-shift stability for the prompt list below.
      */}
      <Flex justify="space-between" align="center" wrap="wrap" gap={10}>
        {/* Left filters: Search, Category, Collection, Tag */}
        <Flex align="center" wrap="wrap" gap={8} style={{ flex: '1 1 auto', minWidth: 280 }}>
          <Input
            prefix={<SearchOutlined style={{ color: token.colorTextSecondary }} />}
            placeholder="Filter by title, content, or description..."
            allowClear
            value={filters.q || ''}
            onChange={(e) => onFilterChange({ q: e.target.value, page: 1 })}
            style={{ width: 260 }}
          />

          <Select
            placeholder="Category"
            allowClear
            value={filters.category || undefined}
            onChange={(val) => onFilterChange({ category: val, page: 1 })}
            style={{ width: 150 }}
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />

          <Select
            placeholder="Collection"
            allowClear
            value={filters.collection || undefined}
            onChange={(val) => onFilterChange({ collection: val, page: 1 })}
            style={{ width: 160 }}
            options={collections.map((col) => ({ label: col.name, value: col.id }))}
          />

          <Select
            placeholder="Tag"
            allowClear
            value={filters.tags ? filters.tags.split(',')[0] : undefined}
            onChange={(val) => onFilterChange({ tags: val || undefined, page: 1 })}
            style={{ width: 130 }}
            options={tags.map((t) => ({ label: `#${t.name}`, value: t.name }))}
          />

          <Tooltip title="Advanced filters">
            <Badge dot={hasAdvancedFilters}>
              <Button
                icon={<FilterOutlined />}
                onClick={onOpenAdvancedFilters}
              >
                Filters
              </Button>
            </Badge>
          </Tooltip>

          {onFetchSupabase && (
            <Tooltip title="Fetch latest prompts from Supabase API">
              <Button
                icon={<SyncOutlined spin={isFetchingSupabase} />}
                onClick={onFetchSupabase}
                loading={isFetchingSupabase}
              >
                Fetch Supabase
              </Button>
            </Tooltip>
          )}
        </Flex>

        {/* Right: Sort By */}
        <Flex align="center" gap={8}>
          <span style={{ fontSize: 13, color: token.colorTextSecondary }}>Sort:</span>
          <Select
            value={filters.sort || 'recently_updated'}
            onChange={(val) => onFilterChange({ sort: val, page: 1 })}
            style={{ width: 160 }}
            options={sortOptions}
          />
        </Flex>
      </Flex>

      {/* 
        Floating Docked Bulk Actions Toolbar:
        Appears gracefully at the bottom when prompts are selected without pushing or shifting the list.
      */}
      {selectedCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 24,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1050,
            backgroundColor: token.colorBgElevated,
            border: `1px solid ${token.colorPrimaryBorder}`,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
            borderRadius: token.borderRadiusLG,
            padding: '8px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            backdropFilter: 'blur(8px)',
          }}
        >
          <Space orientation="horizontal" size={10}>
            <Badge
              count={selectedCount}
              style={{
                backgroundColor: token.colorPrimary,
                color: '#fff',
                fontWeight: 600,
              }}
            />
            <span style={{ fontSize: 13, fontWeight: 600, color: token.colorText }}>
              prompt{selectedCount > 1 ? 's' : ''} selected
            </span>
            <Button size="small" type="link" onClick={onClearSelection} style={{ padding: 0 }}>
              Deselect All
            </Button>
          </Space>

          <div
            style={{
              width: 1,
              height: 20,
              backgroundColor: token.colorBorderSecondary,
            }}
          />

          <Space orientation="horizontal" size={8}>
            {!isArchivedView && (
              <>
                <Button
                  size="small"
                  icon={<PushpinOutlined />}
                  onClick={() => onBulkAction('pin')}
                >
                  Pin
                </Button>
                <Button
                  size="small"
                  onClick={() => onBulkAction('unpin')}
                >
                  Unpin
                </Button>
              </>
            )}

            {isArchivedView ? (
              <Button
                size="small"
                icon={<RollbackOutlined />}
                onClick={() => onBulkAction('restore')}
              >
                Restore Selected
              </Button>
            ) : (
              <Button
                size="small"
                icon={<InboxOutlined />}
                onClick={() => onBulkAction('archive')}
              >
                Archive Selected
              </Button>
            )}

            <Popconfirm
              title={`Delete ${selectedCount} prompt${selectedCount > 1 ? 's' : ''}?`}
              description="This will permanently delete the selected prompts."
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
              onConfirm={() => onBulkAction('delete')}
            >
              <Button size="small" danger icon={<DeleteOutlined />}>
                Delete
              </Button>
            </Popconfirm>
          </Space>
        </div>
      )}
    </div>
  );
};
