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

// Hoverable result item utilizing Ant Design tokens for pristine theme consistency
const SearchResultRow: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  padding?: string | number;
}> = ({ onClick, children, padding = '8px 12px' }) => {
  const { token } = theme.useToken();
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: 'pointer',
        padding,
        borderRadius: token.borderRadiusSM,
        backgroundColor: hovered ? token.controlItemBgHover : 'transparent',
        transition: 'background-color 0.15s ease',
        display: 'block',
      }}
    >
      {children}
    </div>
  );
};

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
        // search error handling
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
        <Flex justify="center" align="center" style={{ padding: '36px 0' }}>
          <Spin tip="Searching knowledge base..." delay={150} />
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
        <div style={{ maxHeight: 420, overflowY: 'auto', paddingRight: 4 }}>
          {/* Prompts Section */}
          {results.prompts.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
                PROMPTS ({results.prompts.length})
              </Text>
              <Flex vertical gap={4} style={{ marginTop: 4 }}>
                {results.prompts.map((p) => (
                  <SearchResultRow key={p.id} onClick={() => onSelectPrompt(p.id)} padding="8px 12px">
                    <Flex justify="space-between" align="center">
                      <Space orientation="horizontal" size={8}>
                        <FileTextOutlined style={{ color: token.colorPrimary }} />
                        <Text strong style={{ fontSize: 13, color: token.colorText }}>
                          {p.title}
                        </Text>
                        {p.isFavorite && <StarFilled style={{ color: '#faad14', fontSize: 12 }} />}
                      </Space>
                      {p.categoryName && (
                        <Tag
                          style={{
                            fontSize: 11,
                            marginRight: 0,
                            backgroundColor: token.colorFillSecondary,
                            border: `1px solid ${token.colorBorderSecondary}`,
                            color: token.colorTextSecondary,
                          }}
                        >
                          {p.categoryName}
                        </Tag>
                      )}
                    </Flex>
                    {p.preview && (
                      <Text
                        type="secondary"
                        ellipsis
                        style={{
                          fontSize: 12,
                          display: 'block',
                          marginTop: 3,
                          paddingLeft: 22,
                          color: token.colorTextSecondary,
                        }}
                      >
                        {p.preview}
                      </Text>
                    )}
                  </SearchResultRow>
                ))}
              </Flex>
            </div>
          )}

          {/* Categories Section */}
          {results.categories.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
                CATEGORIES ({results.categories.length})
              </Text>
              <Flex vertical gap={4} style={{ marginTop: 4 }}>
                {results.categories.map((c) => (
                  <SearchResultRow key={c.id} onClick={() => onSelectCategory(c.id)} padding="6px 12px">
                    <Space orientation="horizontal" size={8}>
                      <FolderOutlined style={{ color: token.colorTextSecondary }} />
                      <Text style={{ fontSize: 13, color: token.colorText }}>{c.name}</Text>
                    </Space>
                  </SearchResultRow>
                ))}
              </Flex>
            </div>
          )}

          {/* Collections Section */}
          {results.collections.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <Text strong type="secondary" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
                COLLECTIONS ({results.collections.length})
              </Text>
              <Flex vertical gap={4} style={{ marginTop: 4 }}>
                {results.collections.map((col) => (
                  <SearchResultRow key={col.id} onClick={() => onSelectCollection(col.id)} padding="6px 12px">
                    <Space orientation="horizontal" size={8}>
                      <AppstoreOutlined style={{ color: token.colorTextSecondary }} />
                      <Text style={{ fontSize: 13, color: token.colorText }}>{col.name}</Text>
                    </Space>
                  </SearchResultRow>
                ))}
              </Flex>
            </div>
          )}

          {/* Tags Section */}
          {results.tags.length > 0 && (
            <div>
              <Text strong type="secondary" style={{ fontSize: 11, letterSpacing: '0.05em' }}>
                TAGS ({results.tags.length})
              </Text>
              <Flex gap={8} wrap="wrap" style={{ marginTop: 8 }}>
                {results.tags.map((t) => (
                  <Tag
                    key={t.id}
                    icon={<TagsOutlined />}
                    style={{
                      cursor: 'pointer',
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: token.borderRadiusSM,
                    }}
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
