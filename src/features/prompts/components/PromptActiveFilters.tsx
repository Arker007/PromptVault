import React from 'react';
import { Flex, Tag, Button, Typography, Space } from 'antd';
import { CloseCircleOutlined } from '@ant-design/icons';
import { PromptQueryParams } from '@/shared/types/index.ts';

const { Text } = Typography;

interface PromptActiveFiltersProps {
  filters: PromptQueryParams;
  onRemoveFilter: (key: keyof PromptQueryParams, value?: string) => void;
  onClearAll: () => void;
  categoryName?: string;
  collectionName?: string;
}

export const PromptActiveFilters: React.FC<PromptActiveFiltersProps> = ({
  filters,
  onRemoveFilter,
  onClearAll,
  categoryName,
  collectionName,
}) => {
  const activeTags: { key: keyof PromptQueryParams; label: string; value?: string }[] = [];

  if (filters.q) {
    activeTags.push({ key: 'q', label: `Search: "${filters.q}"` });
  }
  if (filters.category) {
    activeTags.push({ key: 'category', label: `Category: ${categoryName || filters.category}` });
  }
  if (filters.collection) {
    activeTags.push({ key: 'collection', label: `Collection: ${collectionName || filters.collection}` });
  }
  if (filters.tags) {
    const list = filters.tags.split(',').filter(Boolean);
    list.forEach((t) => {
      activeTags.push({ key: 'tags', label: `#${t}`, value: t });
    });
  }
  if (filters.has_variables === true || filters.has_variables === 'true') {
    activeTags.push({ key: 'has_variables', label: 'Has Variables' });
  }
  if (filters.favorite === true || filters.favorite === 'true') {
    activeTags.push({ key: 'favorite', label: 'Favorites Only' });
  }
  if (filters.archived === true || filters.archived === 'true') {
    activeTags.push({ key: 'archived', label: 'Archived Only' });
  }

  if (activeTags.length === 0) return null;

  return (
    <Flex align="center" gap={8} wrap="wrap" style={{ marginBottom: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>
        Active filters:
      </Text>
      <Space direction="horizontal" size={6} wrap>
        {activeTags.map((item, idx) => (
          <Tag
            key={`${item.key}-${item.value || idx}`}
            closable
            onClose={() => onRemoveFilter(item.key, item.value)}
            style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4 }}
          >
            {item.label}
          </Tag>
        ))}
        <Button
          type="link"
          size="small"
          onClick={onClearAll}
          icon={<CloseCircleOutlined />}
          style={{ padding: 0, fontSize: 12 }}
        >
          Clear all
        </Button>
      </Space>
    </Flex>
  );
};
