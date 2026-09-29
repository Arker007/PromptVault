import React from 'react';
import { Listy, Skeleton, Pagination, Flex } from 'antd';
import { PromptSummaryDTO } from '@/shared/types/index.ts';
import { PromptListItem } from './PromptListItem.tsx';
import { PromptEmptyState } from './PromptEmptyState.tsx';

interface PromptListProps {
  items: PromptSummaryDTO[];
  total: number;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isFiltered: boolean;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onPageChange: (page: number, pageSize: number) => void;
  onPromptClick: (id: string) => void;
  onEditPrompt: (prompt: PromptSummaryDTO) => void;
  onUseVariables: (prompt: PromptSummaryDTO) => void;
  onClearFilters: () => void;
  onCreatePrompt: () => void;
}

export const PromptList: React.FC<PromptListProps> = ({
  items,
  total,
  page,
  pageSize,
  isLoading,
  isFiltered,
  selectedIds,
  onToggleSelect,
  onPageChange,
  onPromptClick,
  onEditPrompt,
  onUseVariables,
  onClearFilters,
  onCreatePrompt,
}) => {
  if (isLoading && items.length === 0) {
    return (
      <div style={{ padding: '8px 0' }}>
        {[1, 2, 3, 4].map((n) => (
          <div
            key={n}
            style={{
              padding: '16px 20px',
              backgroundColor: '#fff',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              marginBottom: 8,
            }}
          >
            <Skeleton active avatar={{ size: 24, shape: 'circle' }} paragraph={{ rows: 2 }} />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <PromptEmptyState
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        onCreatePrompt={onCreatePrompt}
      />
    );
  }

  return (
    <div>
      <Listy
        items={items}
        rowKey="id"
        virtual={false}
        itemRender={(item) => (
          <PromptListItem
            key={item.id}
            prompt={item}
            isSelected={Boolean(selectedIds.includes(item.id))}
            onToggleSelect={onToggleSelect}
            onClick={onPromptClick}
            onEdit={onEditPrompt}
            onUseVariables={onUseVariables}
          />
        )}
      />

      {/* Server-side Pagination */}
      <Flex justify="flex-end" style={{ marginTop: 20 }}>
        <Pagination
          current={page}
          pageSize={pageSize}
          total={total}
          onChange={onPageChange}
          showSizeChanger
          pageSizeOptions={['15', '25', '50', '100']}
          showTotal={(total, range) => `${range[0]}-${range[1]} of ${total} prompts`}
        />
      </Flex>
    </div>
  );
};
