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
  TagOutlined,
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
  onBulkAction: (action: 'delete' | 'archive' | 'restore' | 'addTag') => void;
  onClearSelection: () => void;
  isArchivedView?: boolean;
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
      {selectedCount > 0 ? (
        /* Bulk Actions Toolbar */
        <Flex
          justify="space-between"
          align="center"
          style={{
            padding: '8px 16px',
            backgroundColor: token.colorPrimaryBg,
            borderRadius: token.borderRadius,
            border: `1px solid ${token.colorPrimaryBorder}`,
          }}
        >
          <Space orientation="horizontal" size={12}>
            <span style={{ fontSize: 13, fontWeight: 500, color: token.colorPrimaryText }}>
              {selectedCount} prompt{selectedCount > 1 ? 's' : ''} selected
            </span>
            <Button size="small" type="link" onClick={onClearSelection} style={{ padding: 0 }}>
              Deselect All
            </Button>
          </Space>

          <Space orientation="horizontal" size={8}>
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
              title={`Delete ${selectedCount} prompts?`}
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
        </Flex>
      ) : (
        /* Regular Filters Toolbar */
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
      )}
    </div>
  );
};
