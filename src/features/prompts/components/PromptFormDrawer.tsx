import React, { useState, useEffect } from 'react';
import { Drawer, Form, Button, Flex, Space } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { PromptForm } from './PromptForm.tsx';
import { useCreatePrompt } from '../hooks/useCreatePrompt.ts';
import { useUpdatePrompt } from '../hooks/useUpdatePrompt.ts';
import { apiClient } from '@/shared/api/apiClient.ts';
import { modal } from '@/shared/lib/message.ts';
import { CategoryItem, CollectionItem, TagItem } from '@/shared/types/index.ts';

interface PromptFormDrawerProps {
  open: boolean;
  onClose: () => void;
  promptToEdit?: any | null;
}

export const PromptFormDrawer: React.FC<PromptFormDrawerProps> = ({
  open,
  onClose,
  promptToEdit,
}) => {
  const [form] = Form.useForm();
  const [isDirty, setIsDirty] = useState(false);

  const createMutation = useCreatePrompt();
  const updateMutation = useUpdatePrompt();

  const isEditing = Boolean(promptToEdit);

  // Fetch categories, collections, tags for select options
  const { data: categories = [] } = useQuery<CategoryItem[]>({
    queryKey: ['categories'],
    queryFn: () => apiClient.get('/api/categories'),
    enabled: open,
  });

  const { data: collections = [] } = useQuery<CollectionItem[]>({
    queryKey: ['collections'],
    queryFn: () => apiClient.get('/api/collections'),
    enabled: open,
  });

  const { data: tags = [] } = useQuery<TagItem[]>({
    queryKey: ['tags'],
    queryFn: () => apiClient.get('/api/tags'),
    enabled: open,
  });

  useEffect(() => {
    if (open) {
      setIsDirty(false);
    }
  }, [open, promptToEdit]);

  const handleClose = () => {
    if (isDirty) {
      modal.confirm({
        title: 'Discard Unsaved Changes?',
        content: 'You have unsaved edits in this prompt. Are you sure you want to close without saving?',
        okText: 'Discard',
        okButtonProps: { danger: true },
        cancelText: 'Continue Editing',
        onOk: () => {
          setIsDirty(false);
          form.resetFields();
          onClose();
        },
      });
    } else {
      form.resetFields();
      onClose();
    }
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const payload = {
        title: values.title,
        description: values.description || null,
        content: values.content,
        categoryId: values.categoryId || null,
        collectionId: values.collectionId || null,
        tags: values.tags || [],
        isFavorite: Boolean(values.isFavorite),
      };

      // Persist selection for future new prompt creation
      try {
        localStorage.setItem(
          'pv_last_prompt_selection',
          JSON.stringify({
            categoryId: values.categoryId || undefined,
            collectionId: values.collectionId || undefined,
            tags: values.tags || [],
          })
        );
      } catch {}

      if (isEditing && promptToEdit) {
        updateMutation.mutate(
          { id: promptToEdit.id, payload },
          {
            onSuccess: () => {
              setIsDirty(false);
              form.resetFields();
              onClose();
            },
          }
        );
      } else {
        createMutation.mutate(payload, {
          onSuccess: () => {
            setIsDirty(false);
            form.resetFields();
            onClose();
          },
        });
      }
    } catch {
      // form validation failed
    }
  };

  // Shortcut: Cmd/Ctrl + Enter to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, isEditing, promptToEdit]);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Drawer
      title={isEditing ? 'Edit Prompt' : 'Create New Prompt'}
      open={open}
      onClose={handleClose}
      size={720}
      destroyOnHidden
      footer={
        <Flex justify="space-between" align="center">
          <Button onClick={handleClose}>Cancel</Button>
          <Space orientation="horizontal" size={8}>
            <span style={{ fontSize: 11, color: '#8c8c8c' }}>⌘ + Enter to save</span>
            <Button type="primary" loading={isSaving} onClick={handleSave}>
              {isEditing ? 'Save Changes' : 'Create Prompt'}
            </Button>
          </Space>
        </Flex>
      }
    >
      <PromptForm
        form={form}
        initialValues={promptToEdit}
        categories={categories}
        collections={collections}
        tags={tags}
        onChange={() => setIsDirty(true)}
      />
    </Drawer>
  );
};
