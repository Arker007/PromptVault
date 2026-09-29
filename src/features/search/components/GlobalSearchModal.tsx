import React, { useState, useEffect } from 'react';
import { Modal, Input, Typography, Flex, Space, Tag, Empty, Spin, theme } from 'antd';
import {
  SearchOutlined,
  FileTextOutlined,
  FolderOutlined,
  AppstoreOutlined,
  TagsOutlined,
  StarFilled,
} from '@ant-design/icons';
import { apiClient } from '@/shared/api/apiClient.ts';

const { Text } = Typography;

interface GlobalSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelectPrompt: (id: string) => void;
  onSelectCategory: (id: string) => void;
  onSelectCollection: (id: string) => void;
  onSelectTag: (name: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  open,
  onClose,
  onSelectPrompt,
  onSelectCategory,
  onSelectCollection,
  onSelectTag,
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    prompts: any[];
    categories: any[];
    collections: any[];
    tags: any[];
  }>({ prompts: [], categories: [], collections: [], tags: [] });

  const { token } = theme.useToken();

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults({ prompts: [], categories: [], collections: [], tags: [] });
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults({ prompts: [], categories: [], collections: [], tags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await apiClient.get<any>('/api/search', { q: query.trim() });
        setResults(data);
      } catch {
        // search error
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const hasAnyResults =
    results.prompts.length > 0 ||
    results.categories.length > 0 ||
    results.collections.length > 0 ||
    results.tags.length > 0;

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={640}
      styles={{ body: { padding: '16px 20px 24px' } }}
      closable={false}
      centered
    >
      <Input
        prefix={<SearchOutlined style={{ color: token.colorTextSecondary, fontSize: 16 }} />}
        placeholder="Search prompts, categories, collections, tags... (ESC to close)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
        allowClear
        size="large"
        style={{ marginBottom: 16 }}
      />

      {loading && (
        <Flex justify="center" align="center" style={{ padding: '32px 0' }}>
          <Spin />
        </Flex>
      )}

      {!loading && query.trim() && !hasAnyResults && (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={`No results found for "${query}"`}
          style={{ padding: '24px 0' }}
        />
      )}

      {!loading && hasAnyResults && (
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {/* Prompts Section */}
          {results.prompts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                PROMPTS ({results.prompts.length})
              </Text>
              <div style={{ marginTop: 4 }}>
                {results.prompts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => onSelectPrompt(p.id)}
                    style={{
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: 4,
                      display: 'block',
                    }}
                    className="hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <Flex justify="space-between" align="center">
                      <Space orientation="horizontal" size={8}>
                        <FileTextOutlined style={{ color: token.colorPrimary }} />
                        <Text strong style={{ fontSize: 13 }}>
                          {p.title}
                        </Text>
                        {p.isFavorite && <StarFilled style={{ color: '#faad14', fontSize: 12 }} />}
                      </Space>
                      {p.categoryName && (
                        <Tag variant="filled" style={{ fontSize: 11 }}>
                          {p.categoryName}
                        </Tag>
                      )}
                    </Flex>
                    {p.preview && (
                      <Text type="secondary" ellipsis style={{ fontSize: 12, display: 'block', marginTop: 2, paddingLeft: 22 }}>
                        {p.preview}
                      </Text>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Categories Section */}
          {results.categories.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                CATEGORIES ({results.categories.length})
              </Text>
              <div style={{ marginTop: 4 }}>
                {results.categories.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => onSelectCategory(c.id)}
                    style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}
                    className="hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <Space orientation="horizontal" size={8}>
                      <FolderOutlined style={{ color: token.colorTextSecondary }} />
                      <Text style={{ fontSize: 13 }}>{c.name}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Collections Section */}
          {results.collections.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                COLLECTIONS ({results.collections.length})
              </Text>
              <div style={{ marginTop: 4 }}>
                {results.collections.map((col) => (
                  <div
                    key={col.id}
                    onClick={() => onSelectCollection(col.id)}
                    style={{ cursor: 'pointer', padding: '6px 12px', borderRadius: 4 }}
                    className="hover:bg-gray-100 dark:hover:bg-neutral-800"
                  >
                    <Space orientation="horizontal" size={8}>
                      <AppstoreOutlined style={{ color: token.colorTextSecondary }} />
                      <Text style={{ fontSize: 13 }}>{col.name}</Text>
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags Section */}
          {results.tags.length > 0 && (
            <div>
              <Text strong type="secondary" style={{ fontSize: 11, textTransform: 'uppercase' }}>
                TAGS ({results.tags.length})
              </Text>
              <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
                {results.tags.map((t) => (
                  <Tag
                    key={t.id}
                    icon={<TagsOutlined />}
                    style={{ cursor: 'pointer', padding: '4px 8px', fontSize: 12 }}
                    onClick={() => onSelectTag(t.name)}
                  >
                    #{t.name}
                  </Tag>
                ))}
              </Flex>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};
