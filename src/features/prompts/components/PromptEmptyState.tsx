import React from 'react';
import { Empty, Button, Flex } from 'antd';
import { PlusOutlined, FilterOutlined } from '@ant-design/icons';

interface PromptEmptyStateProps {
  isFiltered: boolean;
  onClearFilters?: () => void;
  onCreatePrompt?: () => void;
}

export const PromptEmptyState: React.FC<PromptEmptyStateProps> = ({
  isFiltered,
  onClearFilters,
  onCreatePrompt,
}) => {
  return (
    <Flex
      justify="center"
      align="center"
      style={{
        padding: '60px 16px',
        backgroundColor: 'transparent',
      }}
    >
      {isFiltered ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No prompts match your current search and filters"
        >
          {onClearFilters && (
            <Button icon={<FilterOutlined />} onClick={onClearFilters}>
              Clear All Filters
            </Button>
          )}
        </Empty>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No prompts found in this library view"
        >
          {onCreatePrompt && (
            <Button type="primary" icon={<PlusOutlined />} onClick={onCreatePrompt}>
              Create First Prompt
            </Button>
          )}
        </Empty>
      )}
    </Flex>
  );
};
