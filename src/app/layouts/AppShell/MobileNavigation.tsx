import React from 'react';
import { Drawer, Menu, Flex, Typography, theme } from 'antd';
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

const { Text } = Typography;

interface MobileNavigationProps {
  open: boolean;
  onClose: () => void;
}

export const MobileNavigation: React.FC<MobileNavigationProps> = ({ open, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

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
      label: 'LIBRARY',
      children: [
        {
          key: '/prompts',
          icon: <FileTextOutlined />,
          label: 'All Prompts',
          onClick: () => handleNav('/prompts'),
        },
        {
          key: '/prompts/favorites',
          icon: <StarOutlined />,
          label: 'Favorites',
          onClick: () => handleNav('/prompts/favorites'),
        },
        {
          key: '/prompts/recent',
          icon: <HistoryOutlined />,
          label: 'Recently Used',
          onClick: () => handleNav('/prompts/recent'),
        },
        {
          key: '/prompts/archived',
          icon: <InboxOutlined />,
          label: 'Archived',
          onClick: () => handleNav('/prompts/archived'),
        },
      ],
    },
    {
      type: 'group',
      label: 'ORGANIZE',
      children: [
        {
          key: '/categories',
          icon: <FolderOutlined />,
          label: 'Categories',
          onClick: () => handleNav('/categories'),
        },
        {
          key: '/collections',
          icon: <AppstoreOutlined />,
          label: 'Collections',
          onClick: () => handleNav('/collections'),
        },
        {
          key: '/tags',
          icon: <TagsOutlined />,
          label: 'Tags',
          onClick: () => handleNav('/tags'),
        },
      ],
    },
    {
      type: 'group',
      label: 'SYSTEM',
      children: [
        {
          key: '/settings/profile',
          icon: <SettingOutlined />,
          label: 'Settings',
          onClick: () => handleNav('/settings/profile'),
        },
      ],
    },
  ];

  return (
    <Drawer
      title={
        <Flex align="center" gap={8}>
          <KeyOutlined style={{ color: token.colorPrimary, fontSize: 18 }} />
          <Text strong style={{ fontSize: 16 }}>
            PromptVault
          </Text>
        </Flex>
      }
      placement="left"
      onClose={onClose}
      open={open}
      size={280}
      styles={{ body: { padding: '8px 0' } }}
    >
      <Menu
        mode="inline"
        selectedKeys={[getSelectedKey()]}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
    </Drawer>
  );
};
