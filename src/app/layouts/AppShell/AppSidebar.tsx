import React from 'react';
import { Layout, Menu, Flex, Typography, theme } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  FileTextOutlined,
  StarOutlined,
  HistoryOutlined,
  InboxOutlined,
  FolderOutlined,
  AppstoreOutlined,
  TagsOutlined,
  SettingOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import type { ItemType } from 'antd/es/menu/interface';

const { Sider } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ collapsed, onCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const getSelectedKey = (): string => {
    const path = location.pathname;
    if (path.startsWith('/prompts/favorites')) return '/prompts/favorites';
    if (path.startsWith('/prompts/recent')) return '/prompts/recent';
    if (path.startsWith('/prompts/archived')) return '/prompts/archived';
    if (path.startsWith('/prompts')) return '/prompts';
    if (path.startsWith('/categories')) return '/categories';
    if (path.startsWith('/collections')) return '/collections';
    if (path.startsWith('/tags')) return '/tags';
    if (path.startsWith('/settings')) return '/settings/profile';
    return '/prompts';
  };

  const menuItems: ItemType[] = [
    {
      type: 'group',
      label: collapsed ? null : 'LIBRARY',
      children: [
        {
          key: '/prompts',
          icon: <FileTextOutlined />,
          label: 'All Prompts',
          onClick: () => navigate('/prompts'),
        },
        {
          key: '/prompts/favorites',
          icon: <StarOutlined />,
          label: 'Favorites',
          onClick: () => navigate('/prompts/favorites'),
        },
        {
          key: '/prompts/recent',
          icon: <HistoryOutlined />,
          label: 'Recently Used',
          onClick: () => navigate('/prompts/recent'),
        },
        {
          key: '/prompts/archived',
          icon: <InboxOutlined />,
          label: 'Archived',
          onClick: () => navigate('/prompts/archived'),
        },
      ],
    },
    {
      type: 'group',
      label: collapsed ? null : 'ORGANIZE',
      children: [
        {
          key: '/categories',
          icon: <FolderOutlined />,
          label: 'Categories',
          onClick: () => navigate('/categories'),
        },
        {
          key: '/collections',
          icon: <AppstoreOutlined />,
          label: 'Collections',
          onClick: () => navigate('/collections'),
        },
        {
          key: '/tags',
          icon: <TagsOutlined />,
          label: 'Tags',
          onClick: () => navigate('/tags'),
        },
      ],
    },
    {
      type: 'group',
      label: collapsed ? null : 'SYSTEM',
      children: [
        {
          key: '/settings/profile',
          icon: <SettingOutlined />,
          label: 'Settings',
          onClick: () => navigate('/settings/profile'),
        },
      ],
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      breakpoint="lg"
      width={240}
      collapsedWidth={80}
      style={{
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 50,
        borderRight: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex
        align="center"
        justify={collapsed ? 'center' : 'flex-start'}
        style={{
          height: 64,
          padding: collapsed ? '0' : '0 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <KeyOutlined style={{ fontSize: 20, color: token.colorPrimary, marginRight: collapsed ? 0 : 10 }} />
        {!collapsed && (
          <Text strong style={{ fontSize: 16, letterSpacing: -0.2 }}>
            PromptVault
          </Text>
        )}
      </Flex>

      <div style={{ height: 'calc(100vh - 64px - 48px)', overflowY: 'auto' }}>
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          items={menuItems}
          style={{ borderRight: 0, paddingTop: 8 }}
        />
      </div>
    </Sider>
  );
};
