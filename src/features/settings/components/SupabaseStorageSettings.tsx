import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Button,
  Table,
  Tag,
  Badge,
  Space,
  Flex,
  Typography,
  Popconfirm,
  Upload,
  Alert,
  Switch,
  Select,
  Tooltip,
  Divider,
  Statistic,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CloudServerOutlined,
  CloudUploadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  HistoryOutlined,
  ApiOutlined,
  CopyOutlined,
  FileTextOutlined,
  FileImageOutlined,
  FileOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  InboxOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/shared/api/apiClient.ts';
import { message } from '@/shared/lib/message.ts';
import { formatDate, formatRelativeTime } from '@/shared/lib/formatters.ts';

const { Title, Text, Paragraph } = Typography;

interface SupabaseConfigData {
  supabaseUrl: string;
  supabaseKey: string;
  isKeySet: boolean;
  backupBucket: string;
  assetBucket: string;
  autoBackupEnabled: boolean;
  autoBackupFrequency: 'daily' | 'weekly';
}

interface BackupItem {
  id?: string;
  name: string;
  path: string;
  bucket: string;
  size: number;
  createdAt: string;
  stats?: {
    promptCount: number;
    categoryCount: number;
    collectionCount: number;
    tagCount: number;
  };
}

interface StorageFileItem {
  name: string;
  path: string;
  bucket: string;
  size: number;
  mimetype: string;
  url: string;
  createdAt: string;
}

function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export const SupabaseStorageSettings: React.FC = () => {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const [configForm] = Form.useForm();
  const [connectionStatus, setConnectionStatus] = useState<{
    tested: boolean;
    success?: boolean;
    message?: string;
  }>({ tested: false });

  const [availableBuckets, setAvailableBuckets] = useState<string[]>([]);

  // 1. Fetch Supabase Config
  const { data: config, isLoading: isConfigLoading } = useQuery<SupabaseConfigData>({
    queryKey: ['supabase-config'],
    queryFn: async () => {
      const res = await apiClient.get<SupabaseConfigData>('/api/supabase/config');
      configForm.setFieldsValue({
        supabaseUrl: res.supabaseUrl,
        supabaseKey: res.supabaseKey,
        backupBucket: res.backupBucket || 'promptvault-backups',
        assetBucket: res.assetBucket || 'promptvault-assets',
        autoBackupEnabled: res.autoBackupEnabled,
        autoBackupFrequency: res.autoBackupFrequency || 'daily',
      });
      return res;
    },
  });

  // 2. Fetch Backups
  const {
    data: backupsData,
    isLoading: isBackupsLoading,
    refetch: refetchBackups,
  } = useQuery<{ isConfigured: boolean; backups: BackupItem[]; bucketName: string }>({
    queryKey: ['supabase-backups'],
    queryFn: () => apiClient.get('/api/supabase/backups'),
  });

  // 3. Fetch Asset Files
  const {
    data: filesData,
    isLoading: isFilesLoading,
    refetch: refetchFiles,
  } = useQuery<{ isConfigured: boolean; files: StorageFileItem[]; bucketName: string }>({
    queryKey: ['supabase-files'],
    queryFn: () => apiClient.get('/api/supabase/storage/files'),
  });

  // 4. Save Config Mutation
  const saveConfigMutation = useMutation({
    mutationFn: (values: any) => apiClient.post('/api/supabase/config', values),
    onSuccess: () => {
      message.success('Supabase configuration saved');
      queryClient.invalidateQueries({ queryKey: ['supabase-config'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-backups'] });
      queryClient.invalidateQueries({ queryKey: ['supabase-files'] });
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to save configuration');
    },
  });

  // 5. Test Connection Mutation
  const testConnectionMutation = useMutation({
    mutationFn: (values: any) => apiClient.post<{ success: boolean; message: string; buckets?: string[] }>('/api/supabase/test-connection', values),
    onSuccess: (data) => {
      setConnectionStatus({ tested: true, success: data.success, message: data.message });
      if (data.buckets) {
        setAvailableBuckets(data.buckets);
      }
      if (data.success) {
        message.success(data.message);
      } else {
        message.error(data.message);
      }
    },
    onError: (err: any) => {
      setConnectionStatus({ tested: true, success: false, message: err.message || 'Connection failed' });
      message.error(err.message || 'Connection failed');
    },
  });

  // 6. Create Backup Mutation
  const createBackupMutation = useMutation({
    mutationFn: () => apiClient.post('/api/supabase/backups/create'),
    onSuccess: (res: any) => {
      message.success(res.message || 'Backup successfully uploaded to Supabase Storage!');
      refetchBackups();
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to create cloud backup');
    },
  });

  // 7. Restore Backup Mutation
  const restoreBackupMutation = useMutation({
    mutationFn: (path: string) => apiClient.post('/api/supabase/backups/restore', { path }),
    onSuccess: (res: any) => {
      message.success(res.message || 'Library restored successfully from cloud backup!');
      queryClient.invalidateQueries();
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to restore backup');
    },
  });

  // 8. Delete Backup Mutation
  const deleteBackupMutation = useMutation({
    mutationFn: (path: string) => apiClient.delete('/api/supabase/backups', { data: { path } }),
    onSuccess: () => {
      message.success('Backup snapshot deleted from Supabase Storage');
      refetchBackups();
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to delete backup');
    },
  });

  // 9. Delete File Mutation
  const deleteFileMutation = useMutation({
    mutationFn: (path: string) => apiClient.delete('/api/supabase/storage/files', { data: { path } }),
    onSuccess: () => {
      message.success('Asset deleted from Supabase Storage');
      refetchFiles();
    },
    onError: (err: any) => {
      message.error(err.message || 'Failed to delete asset');
    },
  });

  const handleSaveConfig = (values: any) => {
    saveConfigMutation.mutate(values);
  };

  const handleTestConnection = () => {
    const values = configForm.getFieldsValue();
    testConnectionMutation.mutate(values);
  };

  const handleUploadAsset = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/supabase/storage/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('pv_token') || ''}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Upload failed');
      }

      message.success(`Uploaded ${file.name} to Supabase Storage`);
      refetchFiles();
    } catch (err: any) {
      message.error(err.message || 'Failed to upload asset');
    }
    return false;
  };

  const handleCopyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    message.success('Asset URL copied to clipboard');
  };

  const backups = backupsData?.backups || [];
  const files = filesData?.files || [];
  const isConfigured = Boolean(config?.supabaseUrl && config?.isKeySet);

  const backupColumns: ColumnsType<BackupItem> = [
    {
      title: 'Snapshot File',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: BackupItem) => (
        <Flex vertical gap={2}>
          <Space orientation="horizontal" size={6}>
            <CloudServerOutlined style={{ color: token.colorPrimary }} />
            <Text strong style={{ fontSize: 13 }}>
              {name}
            </Text>
          </Space>
          <Text type="secondary" style={{ fontSize: 11 }}>
            Bucket: {record.bucket}
          </Text>
        </Flex>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 100,
      render: (size: number) => <Text type="secondary">{formatBytes(size)}</Text>,
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <Text style={{ fontSize: 12 }}>{formatRelativeTime(date)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 200,
      render: (_: any, record: BackupItem) => (
        <Space orientation="horizontal" size={8}>
          <Popconfirm
            title="Restore from this cloud snapshot?"
            description="All prompts, categories, and collections in this snapshot will be synced to your library."
            okText="Restore"
            cancelText="Cancel"
            onConfirm={() => restoreBackupMutation.mutate(record.path)}
          >
            <Button
              size="small"
              icon={<HistoryOutlined />}
              loading={restoreBackupMutation.isPending}
            >
              Restore
            </Button>
          </Popconfirm>

          <Popconfirm
            title="Delete this backup from Supabase Storage?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteBackupMutation.mutate(record.path)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteBackupMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const fileColumns: ColumnsType<StorageFileItem> = [
    {
      title: 'Asset Name',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: StorageFileItem) => {
        const isImg = record.mimetype.startsWith('image/');
        return (
          <Flex align="center" gap={8}>
            {isImg ? (
              <FileImageOutlined style={{ color: '#52c41a', fontSize: 16 }} />
            ) : (
              <FileTextOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
            )}
            <Flex vertical>
              <Text strong style={{ fontSize: 13 }} ellipsis={{ tooltip: name }}>
                {name}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                {record.mimetype}
              </Text>
            </Flex>
          </Flex>
        );
      },
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      width: 90,
      render: (size: number) => <Text type="secondary">{formatBytes(size)}</Text>,
    },
    {
      title: 'Uploaded',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => (
        <Tooltip title={formatDate(date)}>
          <Text style={{ fontSize: 12 }}>{formatRelativeTime(date)}</Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 140,
      render: (_: any, record: StorageFileItem) => (
        <Space orientation="horizontal" size={6}>
          <Tooltip title="Copy Public URL">
            <Button
              size="small"
              icon={<CopyOutlined />}
              onClick={() => handleCopyUrl(record.url)}
            />
          </Tooltip>

          <Tooltip title="Open Asset">
            <Button
              size="small"
              icon={<LinkOutlined />}
              onClick={() => window.open(record.url, '_blank')}
            />
          </Tooltip>

          <Popconfirm
            title="Delete this asset from Supabase?"
            okText="Delete"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteFileMutation.mutate(record.path)}
          >
            <Button
              size="small"
              type="text"
              danger
              icon={<DeleteOutlined />}
              loading={deleteFileMutation.isPending}
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 760, paddingTop: 8 }}>
      {/* 1. Header Banner & Status */}
      <Card
        size="small"
        style={{
          marginBottom: 20,
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
          <Space orientation="horizontal" size={12}>
            <CloudServerOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
            <div>
              <Title level={5} style={{ margin: 0 }}>
                Supabase Storage & Automated Cloud Backups
              </Title>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Connect your Supabase project to store encrypted JSON backups and prompt attachments.
              </Text>
            </div>
          </Space>

          <Badge
            status={isConfigured ? 'success' : 'default'}
            text={
              <Text strong style={{ fontSize: 12, color: isConfigured ? token.colorSuccess : token.colorTextSecondary }}>
                {isConfigured ? 'Supabase Connected' : 'Not Configured'}
              </Text>
            }
          />
        </Flex>
      </Card>

      {/* 2. Supabase Configuration Form */}
      <Card
        title="Supabase Connection Credentials"
        size="small"
        style={{
          marginBottom: 24,
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
        }}
        extra={
          <Button
            icon={<ApiOutlined />}
            size="small"
            loading={testConnectionMutation.isPending}
            onClick={handleTestConnection}
          >
            Test Connection
          </Button>
        }
      >
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          title="Supabase Storage & RLS Setup Note"
          description={
            <div style={{ fontSize: 12 }}>
              <Paragraph style={{ margin: '0 0 6px 0' }}>
                Supabase enforces Postgres Row-Level Security (RLS) on storage buckets by default. Choose one of the following setups:
              </Paragraph>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                <li>
                  <strong>Option A (Recommended for effortless setup):</strong> Use your Supabase <code>service_role</code> secret key (from Supabase Dashboard &gt; Project Settings &gt; API), which has admin privileges to auto-create and manage buckets.
                </li>
                <li>
                  <strong>Option B (Using public anon key):</strong> Go to your Supabase Dashboard &gt; <strong>Storage</strong>, click <strong>New Bucket</strong>, and create two buckets named <code>promptvault-backups</code> (Private) and <code>promptvault-assets</code> (Public).
                </li>
              </ul>
            </div>
          }
        />

        <Form
          form={configForm}
          layout="vertical"
          onFinish={handleSaveConfig}
          disabled={isConfigLoading}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Form.Item
              name="supabaseUrl"
              label="Supabase Project URL"
              rules={[{ required: true, message: 'Please enter your Supabase Project URL' }]}
              extra="e.g. https://your-project.supabase.co"
            >
              <Input placeholder="https://xyzcompany.supabase.co" />
            </Form.Item>

            <Form.Item
              name="supabaseKey"
              label="Supabase API Key (service_role or anon key)"
              rules={[{ required: true, message: 'Please enter your Supabase API Key' }]}
              extra="Stored securely server-side"
            >
              <Input.Password placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." />
            </Form.Item>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <Form.Item
              name="backupBucket"
              label="Backups Bucket Name"
              extra={
                availableBuckets.length > 0
                  ? `Available in your project: ${availableBuckets.join(', ')}`
                  : 'Storage bucket for JSON snapshots (default: promptvault-backups)'
              }
            >
              <Input placeholder="promptvault-backups" />
            </Form.Item>

            <Form.Item
              name="assetBucket"
              label="Assets Bucket Name"
              extra={
                availableBuckets.length > 0
                  ? `Available in your project: ${availableBuckets.join(', ')}`
                  : 'Storage bucket for file & image uploads (default: promptvault-assets)'
              }
            >
              <Input placeholder="promptvault-assets" />
            </Form.Item>
          </div>

          <Divider style={{ margin: '12px 0' }} />

          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space orientation="horizontal" size={16} wrap>
              <Form.Item
                name="autoBackupEnabled"
                label="Automated Cloud Sync"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Switch />
              </Form.Item>

              <Form.Item
                name="autoBackupFrequency"
                label="Sync Frequency"
                style={{ marginBottom: 0, minWidth: 120 }}
              >
                <Select
                  options={[
                    { label: 'Daily Backup', value: 'daily' },
                    { label: 'Weekly Backup', value: 'weekly' },
                  ]}
                />
              </Form.Item>
            </Space>

            <Button type="primary" htmlType="submit" loading={saveConfigMutation.isPending}>
              Save Supabase Credentials
            </Button>
          </Flex>
        </Form>
      </Card>

      {/* 3. Cloud Backups Section */}
      <Card
        title={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Space orientation="horizontal" size={8}>
              <span>Cloud Backup Snapshots</span>
              <Tag color="blue">{backups.length} snapshots</Tag>
            </Space>
            <Space orientation="horizontal" size={8}>
              <Button
                icon={<ReloadOutlined />}
                size="small"
                onClick={() => refetchBackups()}
                loading={isBackupsLoading}
              />
              <Button
                type="primary"
                icon={<CloudUploadOutlined />}
                size="small"
                loading={createBackupMutation.isPending}
                disabled={!isConfigured}
                onClick={() => createBackupMutation.mutate()}
              >
                Create Cloud Backup Now
              </Button>
            </Space>
          </Flex>
        }
        size="small"
        style={{
          marginBottom: 24,
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
        }}
      >
        {!isConfigured && (
          <Alert
            type="info"
            showIcon
            title="Configure Supabase to enable cloud snapshots"
            description="Enter and save your Supabase project URL and API key above to start storing encrypted cloud backups."
            style={{ marginBottom: 16 }}
          />
        )}

        <Table<BackupItem>
          columns={backupColumns}
          dataSource={backups}
          rowKey={(r) => r.path || r.name}
          loading={isBackupsLoading}
          pagination={{ pageSize: 5, hideOnSinglePage: true }}
          locale={{ emptyText: 'No cloud backups in Supabase yet. Click "Create Cloud Backup Now" to create your first snapshot.' }}
          size="middle"
        />
      </Card>

      {/* 4. Supabase Storage Asset Vault */}
      <Card
        title={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Space orientation="horizontal" size={8}>
              <span>Supabase Asset Vault</span>
              <Tag color="green">{files.length} files</Tag>
            </Space>
            <Button
              icon={<ReloadOutlined />}
              size="small"
              onClick={() => refetchFiles()}
              loading={isFilesLoading}
            />
          </Flex>
        }
        size="small"
        style={{
          backgroundColor: token.colorBgContainer,
          borderColor: token.colorBorderSecondary,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Upload.Dragger
            beforeUpload={handleUploadAsset}
            showUploadList={false}
            disabled={!isConfigured}
            multiple={false}
            style={{
              padding: '16px',
              backgroundColor: token.colorBgLayout,
              borderRadius: token.borderRadius,
            }}
          >
            <p className="ant-upload-drag-icon">
              <InboxOutlined style={{ fontSize: 28, color: token.colorPrimary }} />
            </p>
            <p className="ant-upload-text" style={{ fontSize: 13, fontWeight: 500, margin: '4px 0' }}>
              Click or drag file to upload to Supabase Storage
            </p>
            <p className="ant-upload-hint" style={{ fontSize: 12, color: token.colorTextTertiary }}>
              Support for prompt datasets, reference system context, JSON schemas, and images (Max 15MB)
            </p>
          </Upload.Dragger>
        </div>

        <Table<StorageFileItem>
          columns={fileColumns}
          dataSource={files}
          rowKey={(r) => r.path || r.name}
          loading={isFilesLoading}
          pagination={{ pageSize: 5, hideOnSinglePage: true }}
          locale={{ emptyText: 'No assets uploaded to Supabase Storage yet.' }}
          size="middle"
        />
      </Card>
    </div>
  );
};
