import React, { useState } from 'react';
import {
  Table,
  Button,
  Input,
  Modal,
  Form,
  Space,
  Popconfirm,
  Typography,
  Flex,
  Tag,
  Tooltip,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  TagsOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from '@/shared/lib/message.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { apiClient } from '@/shared/api/apiClient.ts';
import { TagItem } from '@/shared/types/index.ts';
import { formatRelativeTime } from '@/shared/lib/formatters.ts';
import { useAuth } from '@/features/auth/index.ts';

const { Text } = Typography;

export const TagsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [form] = Form.useForm();

  const { data: tags = [], isLoading } = useQuery<TagItem[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.get('/api/tags'),
  });

  const saveMutation = useMutation({
    mutationFn: (values: { name: string }) => {
      if (editingTag) {
        return apiClient.patch(`/api/tags/${editingTag.id}`, values);
      }
      return apiClient.post('/api/tags', values);
    },
    onSuccess: () => {
      message.success(editingTag ? 'Tag renamed' : 'Tag created');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setModalOpen(false);
      setEditingTag(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/tags/${id}`),
    onSuccess: () => {
      message.success('Tag deleted');
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: () => message.error('Failed to delete tag'),
  });

  const handleOpenCreate = () => {
    setEditingTag(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (tag: TagItem) => {
    setEditingTag(tag);
    form.setFieldsValue({ name: tag.name });
    setModalOpen(true);
  };

  const filteredTags = tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const columns: ColumnsType<TagItem> = [
    {
      title: 'Tag',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      render: (name, record) => (
        <Space orientation="horizontal" size={8}>
          <Tag
            icon={<TagsOutlined />}
            style={{ fontSize: 13, padding: '2px 8px', cursor: 'pointer' }}
            onClick={() => navigate(`/prompts?tags=${encodeURIComponent(name)}`)}
          >
            #{name}
          </Tag>
        </Space>
      ),
    },
    {
      title: 'Prompt Count',
      dataIndex: 'promptCount',
      key: 'promptCount',
      align: 'right',
      width: 140,
      render: (count) => (
        <Text strong style={{ fontSize: 13 }}>
          {count || 0}
        </Text>
      ),
    },
    {
      title: 'Last Used',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      align: 'right',
      width: 160,
      render: (lastUsed) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatRelativeTime(lastUsed)}
        </Text>
      ),
    },
    ...(isAuthenticated
      ? [
          {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            width: 120,
            render: (_: any, record: TagItem) => (
              <Space orientation="horizontal" size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(record)}
                  aria-label="Edit Tag"
                />
                <Popconfirm
                  title="Delete Tag?"
                  description="This will remove this tag from all associated prompts."
                  okText="Delete"
                  cancelText="Cancel"
                  okButtonProps={{ danger: true }}
                  onConfirm={() => deleteMutation.mutate(record.id)}
                >
                  <Button type="text" size="small" danger icon={<DeleteOutlined />} aria-label="Delete Tag" />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Tags"
        count={tags.length}
        description="Lightweight, multi-label keywords for fine-grained search and filtering."
        extra={
          isAuthenticated ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              New Tag
            </Button>
          ) : null
        }
      />

      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          placeholder="Filter tags by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </Flex>

      <Table
        dataSource={filteredTags}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} tags` }}
        bordered={false}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingTag ? 'Edit Tag' : 'New Tag'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate({ name: values.name.toLowerCase().trim() })}
        >
          <Form.Item
            name="name"
            label="Tag Name"
            rules={[
              { required: true, message: 'Please enter tag name' },
              {
                pattern: /^[a-zA-Z0-9_-]+$/,
                message: 'Tag name should contain only letters, numbers, dashes, and underscores',
              },
            ]}
          >
            <Input prefix="#" placeholder="e.g. typescript, pr-review, quick-fix" maxLength={30} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
