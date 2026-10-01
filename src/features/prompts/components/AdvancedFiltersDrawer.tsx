import React from 'react';
import {
  Drawer,
  Form,
  Select,
  Switch,
  Button,
  DatePicker,
  Flex,
  Space,
  theme,
} from 'antd';
import { PromptQueryParams, CategoryItem, CollectionItem, TagItem } from '@/shared/types/index.ts';

const { RangePicker } = DatePicker;

interface AdvancedFiltersDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: PromptQueryParams;
  onApplyFilters: (newFilters: Partial<PromptQueryParams>) => void;
  onResetFilters: () => void;
  categories: CategoryItem[];
  collections: CollectionItem[];
  tags: TagItem[];
}

export const AdvancedFiltersDrawer: React.FC<AdvancedFiltersDrawerProps> = ({
  open,
  onClose,
  filters,
  onApplyFilters,
  onResetFilters,
  categories,
  collections,
  tags,
}) => {
  const [form] = Form.useForm();
  const { token } = theme.useToken();

  const handleFinish = (values: any) => {
    const newFilters: Partial<PromptQueryParams> = {
      category: values.category || undefined,
      collection: values.collection || undefined,
      tags: values.tags && values.tags.length > 0 ? values.tags.join(',') : undefined,
      has_variables: values.has_variables ? 'true' : undefined,
      favorite: values.favorite ? 'true' : undefined,
      archived: values.archived ? 'true' : undefined,
    };

    if (values.createdRange && values.createdRange[0] && values.createdRange[1]) {
      newFilters.created_from = values.createdRange[0].toISOString();
      newFilters.created_to = values.createdRange[1].toISOString();
    } else {
      newFilters.created_from = undefined;
      newFilters.created_to = undefined;
    }

    onApplyFilters(newFilters);
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    onResetFilters();
    onClose();
  };

  return (
    <Drawer
      title="Advanced Filters"
      placement="right"
      width={400}
      onClose={onClose}
      open={open}
      footer={
        <Flex justify="space-between" align="center">
          <Button onClick={handleReset}>Reset All</Button>
          <Space direction="horizontal" size={8}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="primary" onClick={() => form.submit()}>
              Apply Filters
            </Button>
          </Space>
        </Flex>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{
          category: filters.category || undefined,
          collection: filters.collection || undefined,
          tags: filters.tags ? filters.tags.split(',').filter(Boolean) : [],
          has_variables: filters.has_variables === 'true' || filters.has_variables === true,
          favorite: filters.favorite === 'true' || filters.favorite === true,
          archived: filters.archived === 'true' || filters.archived === true,
        }}
      >
        <Form.Item name="category" label="Category">
          <Select
            placeholder="Filter by category"
            allowClear
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>

        <Form.Item name="collection" label="Collection">
          <Select
            placeholder="Filter by collection"
            allowClear
            options={collections.map((col) => ({ label: col.name, value: col.id }))}
          />
        </Form.Item>

        <Form.Item name="tags" label="Tags (Match All)">
          <Select
            mode="multiple"
            placeholder="Select tags"
            allowClear
            options={tags.map((t) => ({ label: `#${t.name}`, value: t.name }))}
          />
        </Form.Item>

        <Form.Item name="createdRange" label="Creation Date Range">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="has_variables"
          label="Contains Dynamic Variables {{var}}"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item name="favorite" label="Favorites Only" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item name="archived" label="Archived Only" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
};
