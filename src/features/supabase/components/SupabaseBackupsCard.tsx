import React, { useState } from 'react';
import { Button, Tag, Space, Flex, Popconfirm, Modal, Input } from 'antd';
import { ProCard, ProTable, type ProColumns } from '@ant-design/pro-components';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { formatDate } from '@/shared/lib/formatters.ts';
import type { BackupItem } from '../types/index.ts';

interface SupabaseBackupsCardProps {
  backups: BackupItem[];
  isLoading?: boolean;
  onRefetchBackups: () => void;
  onCreateSnapshot: (data: { name?: string }) => void;
  isCreatingSnapshot?: boolean;
  onRestoreBackup: (filename: string) => void;
  isRestoring?: boolean;
  onDeleteBackup: (filename: string) => void;
  isDeleting?: boolean;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const SupabaseBackupsCard: React.FC<SupabaseBackupsCardProps> = ({
  backups,
  isLoading,
  onRefetchBackups,
  onCreateSnapshot,
  isCreatingSnapshot,
  onRestoreBackup,
  isRestoring,
  onDeleteBackup,
}) => {
  const [snapshotModalOpen, setSnapshotModalOpen] = useState<boolean>(false);
  const [snapshotName, setSnapshotName] = useState<string>('');

  const handleCreateSnapshot = () => {
    onCreateSnapshot({ name: snapshotName.trim() || undefined });
    setSnapshotName('');
    setSnapshotModalOpen(false);
  };

  const backupColumns: ProColumns<BackupItem>[] = [
    {
      title: 'Snapshot File',
      dataIndex: 'name',
      render: (name) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{name}</span>,
    },
    {
      title: 'Size',
      dataIndex: 'size',
      width: 100,
      render: (size) => <Tag color="default">{formatBytes(Number(size))}</Tag>,
    },
    {
      title: 'Created At',
      dataIndex: 'createdAt',
      width: 180,
      render: (date) => formatDate(String(date)),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 180,
      valueType: 'option',
      render: (_, record) => [
        <Popconfirm
          key="restore"
          title="Restore Backup Snapshot?"
          description="This will update local database records from this backup snapshot."
          okText="Restore"
          cancelText="Cancel"
          onConfirm={() => onRestoreBackup(record.name)}
        >
          <Button size="small" type="primary" ghost icon={<HistoryOutlined />}>
            Restore
          </Button>
        </Popconfirm>,
        <Popconfirm
          key="delete"
          title="Delete Snapshot File?"
          okText="Delete"
          cancelText="Cancel"
          okButtonProps={{ danger: true }}
          onConfirm={() => onDeleteBackup(record.name)}
        >
          <Button size="small" danger icon={<DeleteOutlined />} />
        </Popconfirm>,
      ],
    },
  ];

  return (
    <>
      <ProCard
        title="Backup Snapshots & JSON Storage"
        headerBordered
        extra={
          <Space direction="horizontal" size={8}>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={onRefetchBackups}
              loading={isLoading}
            />
            <Button
              type="primary"
              icon={<CloudUploadOutlined />}
              size="small"
              loading={isCreatingSnapshot}
              onClick={() => setSnapshotModalOpen(true)}
            >
              Create Snapshot
            </Button>
          </Space>
        }
      >
        <ProTable
          columns={backupColumns}
          dataSource={backups}
          rowKey="name"
          loading={isLoading || isRestoring}
          search={false}
          options={false}
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </ProCard>

      {/* Modal for creating custom named snapshot */}
      <Modal
        title="Create Database Snapshot Backup"
        open={snapshotModalOpen}
        onCancel={() => setSnapshotModalOpen(false)}
        onOk={handleCreateSnapshot}
        confirmLoading={isCreatingSnapshot}
        destroyOnClose
      >
        <div style={{ paddingTop: 12 }}>
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            This creates a complete JSON backup snapshot of your prompts, categories, collections, and tags.
          </p>
          <Input
            placeholder="Optional snapshot name (e.g. pre-migration-backup)"
            value={snapshotName}
            onChange={(e) => setSnapshotName(e.target.value)}
            maxLength={50}
          />
        </div>
      </Modal>
    </>
  );
};
