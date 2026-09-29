import React, { useEffect, useState } from 'react';
import { Form, Input, Select, Switch, Typography, Space, Button, Flex, Upload, theme } from 'antd';
import type { FormInstance } from 'antd';
import { BulbOutlined, PaperClipOutlined } from '@ant-design/icons';
import { CategoryItem, CollectionItem, TagItem } from '@/shared/types/index.ts';
import { message } from '@/shared/lib/message.ts';

const { Text } = Typography;

function extractTitleFromContent(content: string): string | null {
  if (!content) return null;
  // Match TITLE: Font, Title: My Prompt, # TITLE: ..., etc.
  const titleRegex = /(?:^|\n)\s*(?:#+\s*)?(?:TITLE|Title|title)\s*[:=\-]\s*([^\r\n]+)/;
  const match = content.match(titleRegex);
  if (match && match[1]) {
    const extracted = match[1].trim();
    return extracted.length > 0 ? extracted : null;
  }
  return null;
}

interface PromptFormProps {
  form: FormInstance;
  initialValues?: any;
  categories: CategoryItem[];
  collections: CollectionItem[];
  tags: TagItem[];
  onChange?: () => void;
}

export const PromptForm: React.FC<PromptFormProps> = ({
  form,
  initialValues,
  categories,
  collections,
  tags,
  onChange,
}) => {
  const { token } = theme.useToken();
  const [detectedTitle, setDetectedTitle] = useState<string | null>(null);

  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue({
        title: initialValues.title || '',
        description: initialValues.description || '',
        content: initialValues.content || '',
        categoryId: initialValues.categoryId || initialValues.category?.id || undefined,
        collectionId: initialValues.collectionId || initialValues.collection?.id || undefined,
        tags: Array.isArray(initialValues.tags)
          ? initialValues.tags.map((t: any) => (typeof t === 'string' ? t : t.name))
          : [],
        isFavorite: Boolean(initialValues.isFavorite),
        isPinned: Boolean(initialValues.isPinned),
      });
      const initialDetected = extractTitleFromContent(initialValues.content || '');
      setDetectedTitle(initialDetected);
    } else {
      // Remember and restore last saved category, collection, and tags for new prompts
      let lastSelection: { categoryId?: string; collectionId?: string; tags?: string[] } = {};
      try {
        const saved = localStorage.getItem('pv_last_prompt_selection');
        if (saved) {
          lastSelection = JSON.parse(saved);
        }
      } catch {}

      form.setFieldsValue({
        title: '',
        description: '',
        content: '',
        categoryId: lastSelection.categoryId || undefined,
        collectionId: lastSelection.collectionId || undefined,
        tags: Array.isArray(lastSelection.tags) ? lastSelection.tags : [],
        isFavorite: false,
        isPinned: false,
      });
      setDetectedTitle(null);
    }
  }, [initialValues, form]);

  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);

  const handleUploadAttachment = async (file: File) => {
    setIsUploadingAttachment(true);
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
        throw new Error(data.message || 'Failed to upload attachment to Supabase');
      }

      const currentContent = form.getFieldValue('content') || '';
      const markdownRef = `\n\n[Attached Asset: ${data.file.name}](${data.file.url})`;
      form.setFieldValue('content', currentContent + markdownRef);
      message.success(`Attached ${file.name} to prompt via Supabase Storage`);
      if (onChange) onChange();
    } catch (err: any) {
      message.error(err.message || 'Failed to upload attachment');
    } finally {
      setIsUploadingAttachment(false);
    }
    return false;
  };

  const handleValuesChange = (changedValues: any, allValues: any) => {
    if (changedValues.content !== undefined) {
      const extracted = extractTitleFromContent(changedValues.content);
      setDetectedTitle(extracted);
      if (extracted) {
        const currentTitle = form.getFieldValue('title');
        // Auto fill prompt title if empty
        if (!currentTitle || currentTitle.trim() === '') {
          form.setFieldValue('title', extracted);
        }
      }
    }
    if (onChange) {
      onChange();
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onValuesChange={handleValuesChange}
      requiredMark="optional"
    >
      <Form.Item
        name="title"
        label={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <span>Prompt Title</span>
            {detectedTitle && (
              <Button
                type="link"
                size="small"
                icon={<BulbOutlined />}
                onClick={() => form.setFieldValue('title', detectedTitle)}
                style={{ padding: 0, height: 'auto', fontSize: 12 }}
              >
                Auto-fill: "{detectedTitle}"
              </Button>
            )}
          </Flex>
        }
        rules={[{ required: true, message: 'Please enter a prompt title' }]}
      >
        <Input placeholder="e.g. Senior TypeScript PR Auditor" maxLength={150} showCount />
      </Form.Item>

      <Form.Item name="description" label="Description / Context (Optional)">
        <Input.TextArea
          placeholder="Brief explanation of when and why to use this prompt..."
          rows={2}
          maxLength={300}
          showCount
        />
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Form.Item name="categoryId" label="Category">
          <Select
            placeholder="Select a category"
            allowClear
            options={categories.map((c) => ({ label: c.name, value: c.id }))}
          />
        </Form.Item>

        <Form.Item name="collectionId" label="Collection">
          <Select
            placeholder="Select a collection"
            allowClear
            options={collections.map((col) => ({ label: col.name, value: col.id }))}
          />
        </Form.Item>
      </div>

      <Form.Item name="tags" label="Tags">
        <Select
          mode="tags"
          placeholder="Type or select tags (e.g. typescript, refactoring)"
          allowClear
          tokenSeparators={[',', ' ']}
          options={tags.map((t) => ({ label: `#${t.name}`, value: t.name }))}
        />
      </Form.Item>

      <Form.Item
        name="content"
        label={
          <Flex justify="space-between" align="center" style={{ width: '100%' }}>
            <Space orientation="horizontal" size={6}>
              <span>Prompt Content</span>
              <Text type="secondary" style={{ fontSize: 12 }}>
                (Use {'{{variable}}'} for fillable inputs)
              </Text>
            </Space>

            <Upload
              beforeUpload={handleUploadAttachment}
              showUploadList={false}
              multiple={false}
            >
              <Button
                size="small"
                icon={<PaperClipOutlined />}
                loading={isUploadingAttachment}
                style={{ fontSize: 12, height: 26, padding: '0 8px' }}
              >
                Attach File to Supabase
              </Button>
            </Upload>
          </Flex>
        }
        rules={[{ required: true, message: 'Please provide prompt content' }]}
      >
        <Input.TextArea
          placeholder="You are an expert software engineer...&#10;&#10;Review the following code:&#10;{{code_snippet}}"
          rows={12}
          style={{
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
            fontSize: 13,
            lineHeight: 1.5,
          }}
        />
      </Form.Item>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        <Form.Item name="isPinned" label="Pin to Top" valuePropName="checked" extra="Pinned prompts appear at the top of your library">
          <Switch />
        </Form.Item>

        <Form.Item name="isFavorite" label="Star as Favorite" valuePropName="checked">
          <Switch />
        </Form.Item>
      </div>
    </Form>
  );
};
