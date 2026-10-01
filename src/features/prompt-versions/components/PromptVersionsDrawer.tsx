import React, { useState } from 'react';
import {
  Drawer,
  List,
  Typography,
  Button,
  Flex,
  Space,
  Tag,
  Popconfirm,
  Spin,
  Alert,
  theme,
} from 'antd';
import {
  HistoryOutlined,
  RollbackOutlined,
  CopyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from '@/shared/lib/message.ts';
import { promptApi } from '@/features/prompts/api/promptApi.ts';
import { promptKeys } from '@/features/prompts/api/promptKeys.ts';
import { PromptVersionItem } from '@/shared/types/index.ts';
import { formatDateTime } from '@/shared/lib/formatters.ts';

const { Text, Paragraph } = Typography;

interface PromptVersionsDrawerProps {
  open: boolean;
  promptId: string;
  onClose: () => void;
}

export const PromptVersionsDrawer: React.FC<PromptVersionsDrawerProps> = ({
  open,
  promptId,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { token } = theme.useToken();
  const [selectedVersion, setSelectedVersion] = useState<PromptVersionItem | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: promptKeys.versions(promptId),
    queryFn: () => promptApi.getVersions(promptId),
    enabled: open && Boolean(promptId),
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId: string) => promptApi.restoreVersion(promptId, versionId),
    onSuccess: (res) => {
      message.success(`Restored to version ${res.versionNumber}`);
      queryClient.invalidateQueries({ queryKey: promptKeys.detail(promptId) });
      queryClient.invalidateQueries({ queryKey: promptKeys.versions(promptId) });
      queryClient.invalidateQueries({ queryKey: promptKeys.lists() });
      onClose();
    },
    onError: () => message.error('Failed to restore version'),
  });

  const versions = data?.versions || [];

  return (
    <Drawer
      title={
        <Space direction="horizontal" size={8}>
          <HistoryOutlined />
          <span>Version History ({versions.length})</span>
        </Space>
      }
      open={open}
      onClose={onClose}
      width={600}
    >
      {isLoading && (
        <Flex justify="center" align="center" style={{ height: 200 }}>
          <Spin />
        </Flex>
      )}

      {isError && (
        <Alert
          type="error"
          message="Failed to load version history"
          showIcon
        />
      )}

      {versions.length > 0 && (
        <List
          dataSource={versions}
          rowKey="id"
          split={false}
          renderItem={(v, index) => {
            const isLatest = index === 0;
            const isViewing = selectedVersion?.id === v.id;

            return (
              <div
                key={v.id}
                style={{
                  display: 'block',
                  padding: '16px',
                  backgroundColor: token.colorBgContainer,
                  border: `1px solid ${token.colorBorderSecondary}`,
                  borderRadius: token.borderRadius,
                  marginBottom: 12,
                }}
              >
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                  <Space direction="horizontal" size={8}>
                    <Tag color={isLatest ? 'blue' : 'default'} style={{ margin: 0 }}>
                      v{v.versionNumber} {isLatest ? '(Current)' : ''}
                    </Tag>
                    <Text strong style={{ fontSize: 14 }}>
                      {v.title}
                    </Text>
                  </Space>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatDateTime(v.createdAt)}
                  </Text>
                </Flex>

                {v.description && (
                  <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                    {v.description}
                  </Text>
                )}

                <div
                  style={{
                    padding: '8px 12px',
                    backgroundColor: token.colorBgLayout,
                    borderRadius: token.borderRadiusSM,
                    fontFamily: 'monospace',
                    fontSize: 12,
                    lineHeight: 1.4,
                    maxHeight: isViewing ? 300 : 80,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                    marginBottom: 10,
                  }}
                >
                  {v.content}
                </div>

                <Flex justify="flex-end" gap={8}>
                  <Button
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => setSelectedVersion(isViewing ? null : v)}
                  >
                    {isViewing ? 'Collapse' : 'Expand'}
                  </Button>
                  <Button
                    size="small"
                    icon={<CopyOutlined />}
                    onClick={() => {
                      navigator.clipboard.writeText(v.content);
                      message.success(`Copied v${v.versionNumber} content`);
                    }}
                  >
                    Copy
                  </Button>
                  {!isLatest && (
                    <Popconfirm
                      title={`Restore version ${v.versionNumber}?`}
                      description="This will create a new version with the content from this version."
                      okText="Restore"
                      cancelText="Cancel"
                      onConfirm={() => restoreMutation.mutate(v.id)}
                    >
                      <Button
                        size="small"
                        type="primary"
                        icon={<RollbackOutlined />}
                        loading={restoreMutation.isPending}
                      >
                        Restore
                      </Button>
                    </Popconfirm>
                  )}
                </Flex>
              </div>
            );
          }}
        />
      )}
    </Drawer>
  );
};
