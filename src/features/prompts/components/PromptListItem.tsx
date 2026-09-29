import React from 'react';
import {
  Typography,
  Flex,
  Space,
  Tag,
  Button,
  Dropdown,
  Tooltip,
  Popconfirm,
  Checkbox,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  StarOutlined,
  StarFilled,
  PushpinOutlined,
  PushpinFilled,
  MoreOutlined,
  EditOutlined,
  CopyOutlined,
  InboxOutlined,
  RollbackOutlined,
  DeleteOutlined,
  FolderOutlined,
  AppstoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { PromptSummaryDTO } from '@/shared/types/index.ts';
import { formatRelativeTime } from '@/shared/lib/formatters.ts';
import { CopyPromptButton } from './CopyPromptButton.tsx';
import { usePromptActions } from '../hooks/usePromptActions.ts';
import { useDeletePrompt } from '../hooks/useDeletePrompt.ts';

const { Text, Paragraph } = Typography;

interface PromptListItemProps {
  prompt: PromptSummaryDTO;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onClick: (id: string) => void;
  onEdit: (prompt: PromptSummaryDTO) => void;
  onUseVariables?: (prompt: PromptSummaryDTO) => void;
}

export const PromptListItem: React.FC<PromptListItemProps> = ({
  prompt,
  isSelected,
  onToggleSelect,
  onClick,
  onEdit,
  onUseVariables,
}) => {
  const { token } = theme.useToken();
  const { toggleFavorite, togglePin, archivePrompt, restorePrompt, duplicatePrompt } = usePromptActions();
  const deleteMutation = useDeletePrompt();

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(prompt.id, !prompt.isFavorite);
  };

  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePin(prompt.id, !prompt.isPinned);
  };

  const overflowMenuItems: MenuProps['items'] = [
    {
      key: 'pin',
      icon: prompt.isPinned ? <PushpinFilled style={{ color: token.colorPrimary }} /> : <PushpinOutlined />,
      label: prompt.isPinned ? 'Unpin from Top' : 'Pin to Top',
      onClick: () => togglePin(prompt.id, !prompt.isPinned),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Edit Prompt',
      onClick: () => onEdit(prompt),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate',
      onClick: () => duplicatePrompt(prompt.id),
    },
    {
      key: 'favorite',
      icon: prompt.isFavorite ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />,
      label: prompt.isFavorite ? 'Unfavorite' : 'Add to Favorites',
      onClick: () => toggleFavorite(prompt.id, !prompt.isFavorite),
    },
    {
      key: 'archive',
      icon: prompt.isArchived ? <RollbackOutlined /> : <InboxOutlined />,
      label: prompt.isArchived ? 'Restore' : 'Archive',
      onClick: () => (prompt.isArchived ? restorePrompt(prompt.id) : archivePrompt(prompt.id)),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      danger: true,
      label: (
        <Popconfirm
          title="Delete Prompt"
          description="Are you sure you want to permanently delete this prompt?"
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => deleteMutation.mutate(prompt.id)}
        >
          <span>Delete</span>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div
      role="listitem"
      onClick={() => onClick(prompt.id)}
      style={{
        padding: '16px 20px',
        backgroundColor: token.colorBgContainer,
        borderRadius: token.borderRadius,
        borderTop: `1px solid ${isSelected ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderRight: `1px solid ${isSelected ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderBottom: `1px solid ${isSelected ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        borderLeft: prompt.isPinned
          ? `3px solid ${token.colorPrimary}`
          : `1px solid ${isSelected ? token.colorPrimaryBorder : token.colorBorderSecondary}`,
        marginBottom: 8,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      className="prompt-list-item hover:border-gray-400"
    >
      <Flex vertical style={{ width: '100%' }} gap={8}>
        {/* Top Header: Checkbox, Favorite, Pin, Title, Actions */}
        <Flex justify="space-between" align="flex-start" gap={12}>
          <Flex align="center" gap={8} style={{ minWidth: 0, flexWrap: 'wrap' }}>
            {onToggleSelect && (
              <div onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={isSelected}
                  onChange={() => onToggleSelect(prompt.id)}
                />
              </div>
            )}

            <Tooltip title={prompt.isPinned ? 'Unpin from top' : 'Pin to top'}>
              <Button
                type="text"
                size="small"
                icon={
                  prompt.isPinned ? (
                    <PushpinFilled style={{ color: token.colorPrimary, fontSize: 16 }} />
                  ) : (
                    <PushpinOutlined style={{ color: token.colorTextSecondary, fontSize: 16 }} />
                  )
                }
                onClick={handlePinClick}
                aria-label={prompt.isPinned ? 'Unpin from top' : 'Pin to top'}
                style={{ padding: 0, width: 24, height: 24 }}
              />
            </Tooltip>

            <Tooltip title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <Button
                type="text"
                size="small"
                icon={
                  prompt.isFavorite ? (
                    <StarFilled style={{ color: '#faad14', fontSize: 16 }} />
                  ) : (
                    <StarOutlined style={{ color: token.colorTextSecondary, fontSize: 16 }} />
                  )
                }
                onClick={handleFavoriteClick}
                aria-label={prompt.isFavorite ? 'Unfavorite' : 'Favorite'}
                style={{ padding: 0, width: 24, height: 24 }}
              />
            </Tooltip>

            <Text
              strong
              style={{
                fontSize: 15,
                color: token.colorText,
                letterSpacing: -0.1,
              }}
              ellipsis
            >
              {prompt.title}
            </Text>

            {prompt.isPinned && (
              <Tag
                color="blue"
                variant="filled"
                icon={<PushpinOutlined />}
                style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
              >
                Pinned
              </Tag>
            )}

            {prompt.hasVariables && (
              <Tag color="cyan" style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
                {prompt.variables.length} var{prompt.variables.length > 1 ? 's' : ''}
              </Tag>
            )}

            {prompt.isArchived && (
              <Tag color="default" style={{ fontSize: 11, lineHeight: '18px', padding: '0 6px' }}>
                Archived
              </Tag>
            )}
          </Flex>

          {/* Action buttons */}
          <Flex align="center" gap={8} onClick={(e) => e.stopPropagation()}>
            {prompt.hasVariables && onUseVariables && (
              <Tooltip title="Fill variables and copy">
                <Button
                  size="small"
                  icon={<FormOutlined />}
                  onClick={() => onUseVariables(prompt)}
                >
                  Fill & Copy
                </Button>
              </Tooltip>
            )}

            <CopyPromptButton
              id={prompt.id}
              content={prompt.content}
              size="small"
              showLabel={true}
            />

            <Dropdown
              menu={{ items: overflowMenuItems }}
              trigger={['click']}
              placement="bottomRight"
            >
              <Button
                type="text"
                size="small"
                icon={<MoreOutlined />}
                aria-label="More actions"
                style={{ padding: '0 4px', color: token.colorTextSecondary }}
              />
            </Dropdown>
          </Flex>
        </Flex>

        {/* Description or Preview (1-2 lines) */}
        <Paragraph
          type="secondary"
          ellipsis={{ rows: 2 }}
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            paddingLeft: 34,
            marginBottom: 2,
          }}
        >
          {prompt.description || prompt.preview}
        </Paragraph>

        {/* Bottom Metadata: Category, Collection, Tags, Updated Time, Copy Count */}
        <Flex
          justify="space-between"
          align="center"
          wrap="wrap"
          gap={8}
          style={{ paddingLeft: 34 }}
        >
          <Space orientation="horizontal" size={6} wrap>
            {prompt.category && (
              <Tag
                icon={<FolderOutlined />}
                variant="filled"
                style={{
                  fontSize: 12,
                  backgroundColor: token.colorBgLayout,
                  color: token.colorTextSecondary,
                  margin: 0,
                }}
              >
                {prompt.category.name}
              </Tag>
            )}

            {prompt.collection && (
              <Tag
                icon={<AppstoreOutlined />}
                variant="filled"
                style={{
                  fontSize: 12,
                  backgroundColor: token.colorBgLayout,
                  color: token.colorTextSecondary,
                  margin: 0,
                }}
              >
                {prompt.collection.name}
              </Tag>
            )}

            {prompt.tags.map((t) => (
              <Tag
                key={t.id}
                variant="filled"
                style={{
                  fontSize: 11,
                  backgroundColor: token.colorBgLayout,
                  color: token.colorTextTertiary || token.colorTextSecondary,
                  margin: 0,
                }}
              >
                #{t.name}
              </Tag>
            ))}
          </Space>

          <Space orientation="horizontal" size={14}>
            {prompt.copyCount > 0 && (
              <Text type="secondary" style={{ fontSize: 12 }}>
                <CheckCircleOutlined style={{ marginRight: 4 }} />
                Copied {prompt.copyCount} time{prompt.copyCount > 1 ? 's' : ''}
              </Text>
            )}

            <Text type="secondary" style={{ fontSize: 12 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />
              Updated {formatRelativeTime(prompt.updatedAt)}
            </Text>
          </Space>
        </Flex>
      </Flex>
    </div>
  );
};
