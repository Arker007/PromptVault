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
  Select,
  Tag,
  Tooltip,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  AppstoreOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from '@/shared/lib/message.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { apiClient } from '@/shared/api/apiClient.ts';
import { CollectionItem, CategoryItem } from '@/shared/types/index.ts';
import { formatDate } from '@/shared/lib/formatters.ts';

const { Text } = Typography;

export const CollectionsPage: React.FC = () => {
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionItem | null>(null);
  const [form] = Form.useForm();

  const { data: collections = [], isLoading } = useQuery<CollectionItem[]>({
    queryKey: ['collections'],
    queryFn: () => apiClient.get('/api/collections'),
  });

  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; description?: string; categoryId?: string }) => {
      if (editingCollection) {
        return apiClient.patch(`/api/collections/${editingCollection.id}`, values);
      }
      return apiClient.post('/api/collections', values);
    },
    onSuccess: () => {
      message.success(editingCollection ? 'Collection updated' : 'Collection created');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      setModalOpen(false);
      setEditingCollection(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/api/collections/${id}`),
    onSuccess: () => {
      message.success('Collection deleted (prompts preserved)');
      queryClient.invalidateQueries({ queryKey: ['collections'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
    },
    onError: () => message.error('Failed to delete collection'),
  });

  const handleOpenCreate = () => {
    setEditingCollection(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (col: CollectionItem) => {
    setEditingCollection(col);
    form.setFieldsValue({
      name: col.name,
      description: col.description,
      categoryId: col.category?.id || undefined,
    });
    setModalOpen(true);
  };

  const filteredCollections = collections.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: ColumnsType<CollectionItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      render: (text, record) => (
        <Flex align="start" gap={12} style={{ padding: '4px 0' }}>
          <AppstoreOutlined style={{ color: token.colorPrimary, marginTop: 4, fontSize: 16 }} />
          <div>
            <Button
              type="link"
              onClick={() => navigate(`/prompts?collection=${record.id}`)}
              style={{ padding: 0, fontWeight: 600, fontSize: 14, height: 'auto', lineHeight: 'normal' }}
            >
              {text}
            </Button>
            {record.description && (
              <Text type="secondary" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>
                {record.description}
              </Text>
            )}
          </div>
        </Flex>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      align: 'left',
      width: 180,
      render: (category) =>
        category ? (
          <Tag icon={<FolderOutlined />} variant="filled">
            {category.name}
          </Tag>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Unassigned
          </Text>
        ),
    },
    {
      title: 'Prompts',
      dataIndex: 'promptCount',
      key: 'promptCount',
      align: 'right',
      width: 120,
      render: (count) => (
        <Text strong style={{ fontSize: 13 }}>
          {count || 0}
        </Text>
      ),
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      align: 'right',
      width: 140,
      render: (date) => (
        <Text type="secondary" style={{ fontSize: 12 }}>
          {formatDate(date)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 120,
      render: (_, record) => (
        <Space orientation="horizontal" size={4}>
          <Tooltip title="Edit Collection">
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={() => handleOpenEdit(record)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Collection?"
            description="Prompts in this collection will not be deleted, only unassigned from this collection."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteMutation.mutate(record.id)}
          >
            <Tooltip title="Delete Collection">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Collections"
        count={collections.length}
        description="Curated project, workflow, or team-specific groups of prompts."
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
            New Collection
          </Button>
        }
      />

      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          placeholder="Filter collections by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </Flex>

      <Table
        dataSource={filteredCollections}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} collections` }}
        bordered={false}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingCollection ? 'Edit Collection' : 'New Collection'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saveMutation.isPending}
        destroyOnHidden
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => saveMutation.mutate(values)}
          requiredMark="optional"
        >
          <Form.Item
            name="name"
            label="Collection Name"
            rules={[{ required: true, message: 'Please enter collection name' }]}
          >
            <Input placeholder="e.g. Code Review Assistant, Weekly Reports" maxLength={60} />
          </Form.Item>

          <Form.Item name="categoryId" label="Parent Category (Optional)">
            <Select
              placeholder="Assign to a category"
              allowClear
              options={categories.map((c) => ({ label: c.name, value: c.id }))}
            />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Describe the purpose of this collection..." rows={3} maxLength={250} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
