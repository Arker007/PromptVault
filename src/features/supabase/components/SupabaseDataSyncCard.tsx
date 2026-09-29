import React from 'react';
import { Button, Tag, Space, Flex, Tooltip, Alert, theme } from 'antd';
import { ProCard, ProTable, type ProColumns } from '@ant-design/pro-components';
import {
  CloudUploadOutlined,
  CodeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { SupabaseDbStats } from '../types/index.ts';

interface SupabaseDataSyncCardProps {
  isConfigured: boolean;
  onOpenSqlModal: () => void;
  onRefetchStats: () => void;
  isDbStatsLoading?: boolean;
  onPushLocalToRemote: () => void;
  isSyncing?: boolean;
  stats?: SupabaseDbStats['stats'];
}

export const SupabaseDataSyncCard: React.FC<SupabaseDataSyncCardProps> = ({
  isConfigured,
  onOpenSqlModal,
  onRefetchStats,
  isDbStatsLoading,
  onPushLocalToRemote,
  isSyncing,
  stats,
}) => {
  const { token } = theme.useToken();

  const syncTableColumns: ProColumns<{ table: string; description: string; count: number }>[] = [
    {
      title: 'PostgreSQL Table',
      dataIndex: 'table',
      render: (text) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: token.colorPrimary }}>
          {text}
        </span>
      ),
    },
    {
      title: 'Description & RLS Status',
      dataIndex: 'description',
    },
    {
      title: 'Remote Record Count',
      dataIndex: 'count',
      align: 'right',
      render: (count) => <Tag color="blue">{count || 0} rows</Tag>,
    },
  ];

  const syncTableData = [
    {
      key: '1',
      table: 'prompts',
      description: 'Main prompt templates with titles, content, categories, tags & variable metadata',
      count: stats?.prompts ?? 0,
    },
    {
      key: '2',
      table: 'categories',
      description: 'Hierarchical taxonomy and category organization',
      count: stats?.categories ?? 0,
    },
    {
      key: '3',
      table: 'collections',
      description: 'Grouped prompt collections for workflow organizing',
      count: stats?.collections ?? 0,
    },
    {
      key: '4',
      table: 'tags',
      description: 'Multi-tag taxonomy labels with quick filtering',
      count: stats?.tags ?? 0,
    },
    {
      key: '5',
      table: 'prompt_versions',
      description: 'Historical prompt revision snapshots and changelogs',
      count: stats?.promptVersions ?? 0,
    },
  ];

  return (
    <ProCard
      title="PostgreSQL Database Sync & Data Migration"
      headerBordered
      extra={
        <Space orientation="horizontal" size={8}>
          {isConfigured && (
            <Tooltip title="Inspect relational SQL DDL schema and RLS rules">
              <Button
                icon={<CodeOutlined />}
                size="small"
                onClick={onOpenSqlModal}
              >
                View SQL Schema
              </Button>
            </Tooltip>
          )}
          <Tooltip title="Refresh remote database record statistics">
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={onRefetchStats}
              loading={isDbStatsLoading}
            />
          </Tooltip>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        title="Bi-Directional Persistence & Cloud Backup"
        description="Your PromptVault library automatically stays synchronized with your local sqlite cache. Use the action below to push local prompt templates to your remote Supabase PostgreSQL database."
      />

      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Sync Action:</span>{' '}
          <span style={{ fontSize: 12, color: token.colorTextSecondary }}>
            Upsert local database records to remote PostgreSQL instance
          </span>
        </div>

        <Button
          type="primary"
          icon={<CloudUploadOutlined />}
          loading={isSyncing}
          onClick={onPushLocalToRemote}
        >
          Push Local Library to Supabase
        </Button>
      </Flex>

      <ProTable
        columns={syncTableColumns}
        dataSource={syncTableData}
        rowKey="key"
        search={false}
        options={false}
        pagination={false}
        size="small"
        bordered
      />
    </ProCard>
  );
};
