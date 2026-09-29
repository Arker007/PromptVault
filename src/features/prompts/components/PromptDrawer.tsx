import React, { useState } from 'react';
import {
  Drawer,
  Typography,
  Flex,
  Space,
  Tag,
  Button,
  Dropdown,
  Tooltip,
  Descriptions,
  Divider,
  Popconfirm,
  Spin,
  Alert,
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
  HistoryOutlined,
  FormOutlined,
} from '@ant-design/icons';
import { usePrompt } from '../hooks/usePrompt.ts';
import { useCopyPrompt } from '../hooks/useCopyPrompt.ts';
import { usePromptActions } from '../hooks/usePromptActions.ts';
import { useDeletePrompt } from '../hooks/useDeletePrompt.ts';
import { PromptContent } from './PromptContent.tsx';
import { formatDateTime, formatRelativeTime } from '@/shared/lib/formatters.ts';
import { PromptVersionsDrawer } from '@/features/prompt-versions/components/PromptVersionsDrawer.tsx';
import { PromptVariablesModal } from '@/features/prompt-variables/components/PromptVariablesModal.tsx';

const { Title, Text, Paragraph } = Typography;

interface PromptDrawerProps {
  promptId: string | null;
  onClose: () => void;
  onEdit: (prompt: any) => void;
}

export const PromptDrawer: React.FC<PromptDrawerProps> = ({
  promptId,
  onClose,
  onEdit,
}) => {
  // Retain promptId during exit animation to prevent content unmounting while sliding closed
  const [cachedPromptId, setCachedPromptId] = useState<string | null>(promptId);

  React.useEffect(() => {
    if (promptId) {
      setCachedPromptId(promptId);
    }
  }, [promptId]);

  const activeId = promptId || cachedPromptId;
  const { data: prompt, isLoading, isError } = usePrompt(activeId);
  const { copyPrompt, isCopying } = useCopyPrompt();
  const { toggleFavorite, togglePin, archivePrompt, restorePrompt, duplicatePrompt } = usePromptActions();
  const deleteMutation = useDeletePrompt();
  const { token } = theme.useToken();

  const [versionsOpen, setVersionsOpen] = useState(false);
  const [variablesOpen, setVariablesOpen] = useState(false);

  const overflowMenuItems: MenuProps['items'] = [
    {
      key: 'pin',
      icon: prompt?.isPinned ? <PushpinFilled style={{ color: token.colorPrimary }} /> : <PushpinOutlined />,
      label: prompt?.isPinned ? 'Unpin from Top' : 'Pin to Top',
      onClick: () => prompt && togglePin(prompt.id, !prompt.isPinned),
    },
    {
      key: 'duplicate',
      icon: <CopyOutlined />,
      label: 'Duplicate Prompt',
      onClick: () => prompt && duplicatePrompt(prompt.id),
    },
    {
      key: 'archive',
      icon: prompt?.isArchived ? <RollbackOutlined /> : <InboxOutlined />,
      label: prompt?.isArchived ? 'Restore from Archive' : 'Archive Prompt',
      onClick: () =>
        prompt && (prompt.isArchived ? restorePrompt(prompt.id) : archivePrompt(prompt.id)),
    },
    {
      key: 'versions',
      icon: <HistoryOutlined />,
      label: `Version History (${prompt?.versionCount || 1})`,
      onClick: () => setVersionsOpen(true),
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
          onConfirm={() => {
            if (prompt) {
              deleteMutation.mutate(prompt.id, {
                onSuccess: () => onClose(),
              });
            }
          }}
        >
          <span>Delete Prompt</span>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <Drawer
        open={Boolean(promptId)}
        onClose={onClose}
        size={760}
        title={
          prompt ? (
            <Flex justify="space-between" align="center" style={{ width: '100%', paddingRight: 8 }}>
              <Flex align="center" gap={8} style={{ minWidth: 0 }}>
                <Tooltip title={prompt.isPinned ? 'Unpin from top' : 'Pin to top'}>
                  <Button
                    type="text"
                    icon={
                      prompt.isPinned ? (
                        <PushpinFilled style={{ color: token.colorPrimary, fontSize: 18 }} />
                      ) : (
                        <PushpinOutlined style={{ color: token.colorTextSecondary, fontSize: 18 }} />
                      )
                    }
                    onClick={() => togglePin(prompt.id, !prompt.isPinned)}
                    aria-label={prompt.isPinned ? 'Unpin from top' : 'Pin to top'}
                    style={{ padding: 0, width: 28, height: 28 }}
                  />
                </Tooltip>
                <Tooltip title={prompt.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
                  <Button
                    type="text"
                    icon={
                      prompt.isFavorite ? (
                        <StarFilled style={{ color: '#faad14', fontSize: 18 }} />
                      ) : (
                        <StarOutlined style={{ color: token.colorTextSecondary, fontSize: 18 }} />
                      )
                    }
                    onClick={() => toggleFavorite(prompt.id, !prompt.isFavorite)}
                    aria-label={prompt.isFavorite ? 'Unfavorite' : 'Favorite'}
                    style={{ padding: 0, width: 28, height: 28 }}
                  />
                </Tooltip>
                <Text
                  strong
                  style={{ fontSize: 16, color: token.colorText, maxWidth: 480 }}
                  ellipsis
                >
                  {prompt.title}
                </Text>
              </Flex>

              <Dropdown menu={{ items: overflowMenuItems }} trigger={['click']} placement="bottomRight">
                <Button
                  type="text"
                  icon={<MoreOutlined />}
                  aria-label="More actions"
                />
              </Dropdown>
            </Flex>
          ) : (
            'Prompt Details'
          )
        }
        footer={
          prompt ? (
            <Flex justify="space-between" align="center">
              <Space orientation="horizontal" size={8}>
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    onClose();
                    onEdit(prompt);
                  }}
                >
                  Edit
                </Button>
                <Button
                  icon={<CopyOutlined />}
                  onClick={() => duplicatePrompt(prompt.id)}
                >
                  Duplicate
                </Button>
                {prompt.hasVariables && (
                  <Button
                    icon={<FormOutlined />}
                    onClick={() => setVariablesOpen(true)}
                  >
                    Fill Variables
                  </Button>
                )}
              </Space>

              <Button
                type="primary"
                icon={<CopyOutlined />}
                loading={isCopying}
                onClick={() => copyPrompt(prompt.id, prompt.content)}
              >
                Copy Prompt
              </Button>
            </Flex>
          ) : null
        }
      >
        {isLoading && (
          <Flex justify="center" align="center" style={{ height: 300 }}>
            <Spin size="large" />
          </Flex>
        )}

        {isError && (
          <Alert
            title="Error"
            description="Failed to load prompt details. It may have been deleted."
            type="error"
            showIcon
          />
        )}

        {prompt && (
          <Flex vertical gap={20}>
            {/* Description */}
            {prompt.description && (
              <div>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', lineHeight: 1.6 }}>
                  {prompt.description}
                </Text>
              </div>
            )}

            {/* Organization Metadata: Category, Collection, Tags */}
            <Flex align="center" wrap="wrap" gap={8}>
              {prompt.isPinned && (
                <Tag
                  color="blue"
                  variant="filled"
                  icon={<PushpinOutlined />}
                  style={{ fontSize: 12 }}
                >
                  Pinned to Top
                </Tag>
              )}

              {prompt.category && (
                <Tag
                  icon={<FolderOutlined />}
                  variant="filled"
                  style={{
                    fontSize: 12,
                    backgroundColor: token.colorBgLayout,
                    color: token.colorTextSecondary,
                  }}
                >
                  Category: {prompt.category.name}
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
                  }}
                >
                  Collection: {prompt.collection.name}
                </Tag>
              )}

              {prompt.tags.map((t: any) => (
                <Tag
                  key={t.id}
                  variant="filled"
                  style={{
                    fontSize: 12,
                    backgroundColor: token.colorBgLayout,
                    color: token.colorTextSecondary,
                  }}
                >
                  #{t.name}
                </Tag>
              ))}

              {prompt.hasVariables && (
                <Tag color="cyan" style={{ fontSize: 12 }}>
                  Variables: {prompt.variables.join(', ')}
                </Tag>
              )}

              {prompt.isArchived && <Tag color="default">Archived</Tag>}
            </Flex>

            {/* Content block */}
            <PromptContent id={prompt.id} content={prompt.content} />

            <Divider style={{ margin: '8px 0' }} />

            {/* Version & Usage Metadata */}
            <Descriptions
              title="Usage & Audit Metadata"
              size="small"
              column={{ xs: 1, sm: 2, md: 3 }}
              items={[
                {
                  key: 'copied',
                  label: 'Times Copied',
                  children: `${prompt.copyCount} time${prompt.copyCount === 1 ? '' : 's'}`,
                },
                {
                  key: 'lastCopied',
                  label: 'Last Copied',
                  children: prompt.lastCopiedAt ? formatDateTime(prompt.lastCopiedAt) : 'Never',
                },
                {
                  key: 'versions',
                  label: 'Version History',
                  children: (
                    <Button
                      type="link"
                      size="small"
                      icon={<HistoryOutlined />}
                      onClick={() => setVersionsOpen(true)}
                      style={{ padding: 0 }}
                    >
                      v{prompt.versionCount} (View all)
                    </Button>
                  ),
                },
                {
                  key: 'created',
                  label: 'Created',
                  children: formatDateTime(prompt.createdAt),
                },
                {
                  key: 'updated',
                  label: 'Updated',
                  children: formatDateTime(prompt.updatedAt),
                },
              ]}
            />
          </Flex>
        )}
      </Drawer>

      {/* Version History Drawer */}
      {prompt && (
        <PromptVersionsDrawer
          open={versionsOpen}
          promptId={prompt.id}
          onClose={() => setVersionsOpen(false)}
        />
      )}

      {/* Variables Modal */}
      {prompt && (
        <PromptVariablesModal
          open={variablesOpen}
          prompt={prompt}
          onClose={() => setVariablesOpen(false)}
        />
      )}
    </>
  );
};
