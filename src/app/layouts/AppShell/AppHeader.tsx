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
  Tag,
  theme,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BulbOutlined,
  SunOutlined,
  MoonOutlined,
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
      icon: isDarkMode ? <SunOutlined /> : <MoonOutlined />,
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
        height: 60,
        lineHeight: 'normal',
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
            height: 36,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: token.colorTextSecondary,
            backgroundColor: token.colorBgLayout,
            borderColor: token.colorBorderSecondary,
            padding: '0 12px',
          }}
        >
          <Flex align="center" gap={8} style={{ minWidth: 0 }}>
            <SearchOutlined style={{ fontSize: 14 }} />
            <Text
              style={{
                fontSize: 13,
                color: token.colorTextTertiary,
                lineHeight: 'normal',
              }}
              ellipsis
            >
              Search prompts, tags...
            </Text>
          </Flex>

          <Tag
            variant="outlined"
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 500,
              lineHeight: '18px',
              height: 20,
              padding: '0 6px',
              backgroundColor: token.colorBgContainer,
              borderColor: token.colorBorderSecondary,
              borderRadius: 4,
              color: token.colorTextSecondary,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ⌘K
          </Tag>
        </Button>
      </Flex>

      <Flex align="center" gap={12}>
        {/* Quick Theme Toggle Button */}
        <Tooltip title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}>
          <Button
            type="text"
            icon={isDarkMode ? <SunOutlined style={{ fontSize: 16 }} /> : <MoonOutlined style={{ fontSize: 16 }} />}
            onClick={toggleDarkMode}
            aria-label={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            style={{ width: 36, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          />
        </Tooltip>

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
          <Button
            type="text"
            style={{
              padding: '0 8px',
              height: 36,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Flex align="center" gap={8}>
              <Avatar
                size={28}
                style={{
                  backgroundColor: token.colorPrimary,
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'U'}
              </Avatar>
              {!isMobile && (
                <Text
                  style={{
                    fontSize: 13,
                    maxWidth: 120,
                    lineHeight: 'normal',
                    color: token.colorText,
                  }}
                  ellipsis
                >
                  {user?.displayName}
                </Text>
              )}
            </Flex>
          </Button>
        </Dropdown>
      </Flex>
    </Header>
  );
};
