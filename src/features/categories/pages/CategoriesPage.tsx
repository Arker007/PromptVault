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
  Tooltip,
  theme,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  FolderOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { message } from '@/shared/lib/message.ts';
import { PageHeader } from '@/shared/ui/PageHeader.tsx';
import { apiClient } from '@/shared/api/apiClient.ts';
import { CategoryItem } from '@/shared/types/index.ts';
import { formatDate } from '@/shared/lib/formatters.ts';
import { useAuth } from '@/features/auth/index.ts';

const { Text } = Typography;

export const CategoriesPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { token } = theme.useToken();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [deleteModalCategory, setDeleteModalCategory] = useState<CategoryItem | null>(null);
  const [reassignTargetId, setReassignTargetId] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();

  const { data: categories = [], isLoading } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories'),
  });

  const saveMutation = useMutation({
    mutationFn: (values: { name: string; description?: string }) => {
      if (editingCategory) {
        return apiClient.patch(`/api/categories/${editingCategory.id}`, values);
      }
      return apiClient.post('/api/categories', values);
    },
    onSuccess: () => {
      message.success(editingCategory ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setModalOpen(false);
      setEditingCategory(null);
      form.resetFields();
    },
    onError: (err: any) => message.error(err.message || 'Operation failed'),
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, reassignToCategoryId }: { id: string; reassignToCategoryId?: string }) =>
      apiClient.delete(`/api/categories/${id}`, { reassignToCategoryId }),
    onSuccess: () => {
      message.success('Category deleted');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['prompts'] });
      setDeleteModalCategory(null);
      setReassignTargetId(undefined);
    },
    onError: (err: any) => message.error(err.message || 'Failed to delete category'),
  });

  const handleOpenCreate = () => {
    setEditingCategory(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleOpenEdit = (category: CategoryItem) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
    });
    setModalOpen(true);
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description && c.description.toLowerCase().includes(search.toLowerCase()))
  );

  const columns: ColumnsType<CategoryItem> = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      align: 'left',
      render: (text, record) => (
        <Flex align="start" gap={12} style={{ padding: '4px 0' }}>
          <FolderOutlined style={{ color: token.colorPrimary, marginTop: 4, fontSize: 16 }} />
          <div>
            <Button
              type="link"
              onClick={() => navigate(`/prompts?category=${record.id}`)}
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
    ...(isAuthenticated
      ? [
          {
            title: 'Actions',
            key: 'actions',
            align: 'right' as const,
            width: 120,
            render: (_: any, record: CategoryItem) => (
              <Space orientation="horizontal" size={4}>
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => handleOpenEdit(record)}
                  aria-label="Edit Category"
                />
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => setDeleteModalCategory(record)}
                  aria-label="Delete Category"
                />
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Categories"
        count={categories.length}
        description="Broad structural classifications for your prompt knowledge base."
        extra={
          isAuthenticated ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
              New Category
            </Button>
          ) : null
        }
      />

      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Input
          prefix={<SearchOutlined style={{ color: '#8c8c8c' }} />}
          placeholder="Filter categories by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          allowClear
          style={{ width: 300 }}
        />
      </Flex>

      <Table
        dataSource={filteredCategories}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        pagination={{ pageSize: 15, showTotal: (total) => `Total ${total} categories` }}
        bordered={false}
      />

      {/* Create / Edit Modal */}
      <Modal
        title={editingCategory ? 'Edit Category' : 'New Category'}
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
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="e.g. Engineering, Editorial, Product" maxLength={50} />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea placeholder="Optional context about this category..." rows={3} maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Delete / Reassign Modal */}
      <Modal
        title="Delete Category"
        open={Boolean(deleteModalCategory)}
        onCancel={() => setDeleteModalCategory(null)}
        onOk={() => {
          if (deleteModalCategory) {
            deleteMutation.mutate({
              id: deleteModalCategory.id,
              reassignToCategoryId: reassignTargetId,
            });
          }
        }}
        okButtonProps={{ danger: true, loading: deleteMutation.isPending }}
        okText="Delete Category"
      >
        {deleteModalCategory && (
          <div>
            <p>
              Are you sure you want to delete category <strong>{deleteModalCategory.name}</strong>?
            </p>
            {deleteModalCategory.promptCount && deleteModalCategory.promptCount > 0 ? (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                  This category contains {deleteModalCategory.promptCount} prompt(s). What would you like to do?
                </Text>
                <Select
                  placeholder="Reassign prompts to another category (or leave blank to uncategorize)"
                  allowClear
                  value={reassignTargetId}
                  onChange={(val) => setReassignTargetId(val)}
                  style={{ width: '100%' }}
                  options={categories
                    .filter((c) => c.id !== deleteModalCategory.id)
                    .map((c) => ({ label: `Reassign to: ${c.name}`, value: c.id }))}
                />
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                This category is currently empty.
              </Text>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
