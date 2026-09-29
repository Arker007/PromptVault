import React from 'react';
import {
  Layout,
  Flex,
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Tooltip,
  theme,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/index.ts';
import { useThemeMode } from '@/app/providers/ThemeProvider.tsx';

const { Header } = Layout;
const { Text } = Typography;

interface AppHeaderProps {
  onOpenSearch: () => void;
  onOpenNewPrompt: () => void;
  onOpenMobileMenu?: () => void;
  isMobile?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  onOpenSearch,
  onOpenNewPrompt,
  onOpenMobileMenu,
  isMobile,
}) => {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useThemeMode();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      disabled: true,
      label: (
        <div style={{ padding: '4px 0' }}>
          <Text strong style={{ display: 'block', fontSize: 13 }}>
            {user?.displayName || 'User'}
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {user?.email}
          </Text>
        </div>
      ),
    },
    { type: 'divider' },
    {
      key: 'theme',
      icon: <BulbOutlined />,
      label: isDarkMode ? 'Light Mode' : 'Dark Mode',
      onClick: toggleDarkMode,
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account & Preferences',
      onClick: () => navigate('/settings/profile'),
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      danger: true,
      label: 'Sign Out',
      onClick: () => logout(),
    },
  ];

  return (
    <Header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        backgroundColor: token.colorBgContainer,
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Flex align="center" gap={12}>
        {isMobile && (
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onOpenMobileMenu}
            aria-label="Open navigation menu"
          />
        )}

        {/* Global Search Button / Trigger */}
        <Button
          onClick={onOpenSearch}
          style={{
            width: isMobile ? 180 : 340,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: token.colorTextSecondary,
            backgroundColor: token.colorBgLayout,
            borderColor: token.colorBorderSecondary,
            padding: '0 12px',
          }}
        >
          <Space orientation="horizontal" size={8}>
            <SearchOutlined />
            <span style={{ fontSize: 13 }}>Search prompts, tags...</span>
          </Space>
          <kbd
            style={{
              fontSize: 11,
              padding: '2px 5px',
              backgroundColor: token.colorBgContainer,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: 4,
            }}
          >
            ⌘K
          </kbd>
        </Button>
      </Flex>

      <Flex align="center" gap={16}>
        {/* Primary CTA */}
        <Tooltip title="Create new prompt (Shortcut: N)">
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={onOpenNewPrompt}
          >
            {isMobile ? '' : 'New Prompt'}
          </Button>
        </Tooltip>

        {/* User Dropdown */}
        <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
          <Button type="text" style={{ padding: '0 4px', height: 40 }}>
            <Space orientation="horizontal" size={8}>
              <Avatar
                size={30}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'U'}
              </Avatar>
              {!isMobile && (
                <Text style={{ fontSize: 13, maxWidth: 120 }} ellipsis>
                  {user?.displayName}
                </Text>
              )}
            </Space>
          </Button>
        </Dropdown>
      </Flex>
    </Header>
  );
};
