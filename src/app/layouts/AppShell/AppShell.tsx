import React, { useState, useEffect } from 'react';
import {
  Button,
  Avatar,
  Dropdown,
  Space,
  Typography,
  Tooltip,
  Tag,
  Flex,
  theme,
} from 'antd';
import type { MenuProps } from 'antd';
import {
  ProLayout,
  ProConfigProvider,
  enUSIntl,
} from '@ant-design/pro-components';
import {
  PlusOutlined,
  SearchOutlined,
  SunOutlined,
  MoonOutlined,
  KeyOutlined,
  LogoutOutlined,
  SettingOutlined,
  FileTextOutlined,
  PushpinOutlined,
  StarOutlined,
  HistoryOutlined,
  InboxOutlined,
  FolderOutlined,
  AppstoreOutlined,
  TagsOutlined,
  CloudServerOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/features/auth/index.ts';
import { useThemeMode } from '@/app/providers/ThemeProvider.tsx';
import { GlobalSearchModal } from '@/features/search/components/GlobalSearchModal.tsx';
import { PromptFormDrawer } from '@/features/prompts/components/PromptFormDrawer.tsx';

const { Text } = Typography;

export const AppShell: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useThemeMode();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [createPromptOpen, setCreatePromptOpen] = useState(false);

  // Global Keyboard shortcuts: Cmd+K / Ctrl+K for search, N for new prompt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
        return;
      }

      // Check if user is typing in an input, textarea, or contentEditable
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (!isInput) {
        if ((e.key === 'n' || e.key === 'N') && isAuthenticated) {
          e.preventDefault();
          setCreatePromptOpen(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated]);

  const currentPath = location.pathname;

  const routeConfig = {
    path: '/',
    routes: [
      {
        key: '/prompts',
        path: '/prompts',
        name: 'All Prompts',
        icon: <FileTextOutlined />,
      },
      {
        key: '/prompts/pinned',
        path: '/prompts/pinned',
        name: 'Pinned',
        icon: <PushpinOutlined />,
      },
      {
        key: '/prompts/favorites',
        path: '/prompts/favorites',
        name: 'Favorites',
        icon: <StarOutlined />,
      },
      {
        key: '/prompts/recent',
        path: '/prompts/recent',
        name: 'Recently Used',
        icon: <HistoryOutlined />,
      },
      {
        key: '/prompts/archived',
        path: '/prompts/archived',
        name: 'Archived',
        icon: <InboxOutlined />,
      },
      {
        key: '/categories',
        path: '/categories',
        name: 'Categories',
        icon: <FolderOutlined />,
      },
      {
        key: '/collections',
        path: '/collections',
        name: 'Collections',
        icon: <AppstoreOutlined />,
      },
      {
        key: '/tags',
        path: '/tags',
        name: 'Tags',
        icon: <TagsOutlined />,
      },
      ...(isAuthenticated
        ? [
            {
              key: '/settings/profile',
              path: '/settings/profile',
              name: 'Settings & Cloud Storage',
              icon: <SettingOutlined />,
            },
          ]
        : []),
    ],
  };

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
      key: 'cloud-storage',
      icon: <CloudServerOutlined />,
      label: 'Cloud & Supabase Storage',
      onClick: () => navigate('/settings/profile?tab=supabase'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Account & Preferences',
      onClick: () => navigate('/settings/profile?tab=profile'),
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
    <ProConfigProvider dark={isDarkMode} intl={enUSIntl}>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: token.colorBgLayout,
        }}
      >
        <ProLayout
          title="PromptVault"
          logo={
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                backgroundColor: token.colorPrimary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <KeyOutlined style={{ fontSize: 18 }} />
            </div>
          }
          layout="mix"
          fixSiderbar
          fixedHeader
          splitMenus={false}
          siderWidth={220}
          collapsed={collapsed}
          onCollapse={setCollapsed}
          location={{
            pathname: location.pathname,
          }}
          route={routeConfig}
          selectedKeys={[currentPath]}
          menuProps={{
            selectedKeys: [currentPath],
          }}
          menu={{
            defaultOpenAll: true,
          }}
          menuItemRender={(item) => {
            const isSelected = (item.key || item.path) === currentPath;
            const activeColor = isDarkMode ? '#ffffff' : token.colorPrimary;
            const content = (
              <div
                onClick={() => {
                  if (item.path) {
                    navigate(item.path);
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  gap: collapsed ? 0 : 10,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer',
                  color: isSelected ? activeColor : token.colorTextSecondary,
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isSelected ? activeColor : 'inherit',
                  }}
                >
                  {item.icon}
                </span>
                {!collapsed && (
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isSelected ? activeColor : token.colorText,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.name}
                  </span>
                )}
              </div>
            );

            if (collapsed) {
              return (
                <Tooltip title={item.name} placement="right">
                  {content}
                </Tooltip>
              );
            }

            return content;
          }}
          token={{
            header: {
              colorBgHeader: token.colorBgContainer,
              colorHeaderTitle: token.colorTextHeading,
              colorTextMenu: token.colorTextSecondary,
              colorTextMenuSelected: isDarkMode ? '#ffffff' : token.colorPrimary,
              colorBgMenuItemHover: token.colorFillTertiary,
              heightLayoutHeader: 56,
            },
            sider: {
              colorBgCollapsedButton: token.colorBgContainer,
              colorTextCollapsedButton: token.colorTextSecondary,
              colorMenuBackground: token.colorBgContainer,
              colorMenuItemDivider: token.colorBorderSecondary,
              colorTextMenu: token.colorTextSecondary,
              colorTextMenuSelected: isDarkMode ? '#ffffff' : token.colorPrimary,
              colorTextMenuItemHover: isDarkMode ? '#ffffff' : token.colorPrimary,
              colorBgMenuItemHover: token.colorFillTertiary,
              colorBgMenuItemSelected: isDarkMode ? token.colorPrimary : token.colorPrimaryBg,
            },
            pageContainer: {
              paddingBlockPageContainerContent: 16,
              paddingInlinePageContainerContent: 20,
            },
          }}
          headerContentRender={() => (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                width: '100%',
                padding: '0 16px',
              }}
            >
              <Button
                onClick={() => setSearchOpen(true)}
                style={{
                  width: '100%',
                  maxWidth: 420,
                  height: 36,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: token.colorTextSecondary,
                  backgroundColor: token.colorBgLayout,
                  borderColor: token.colorBorderSecondary,
                  padding: '0 12px',
                  borderRadius: token.borderRadius,
                  boxShadow: 'none',
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
                    Search prompts, tags, categories...
                  </Text>
                </Flex>

                <Tag
                  bordered={true}
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 600,
                    lineHeight: '18px',
                    height: 20,
                    padding: '0 6px',
                    backgroundColor: token.colorBgContainer,
                    borderColor: token.colorBorderSecondary,
                    borderRadius: 4,
                    color: token.colorTextSecondary,
                  }}
                >
                  ⌘K
                </Tag>
              </Button>
            </div>
          )}
          actionsRender={() =>
            [
              <Tooltip key="theme" title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                <Button
                  type="text"
                  icon={isDarkMode ? <SunOutlined style={{ fontSize: 15 }} /> : <MoonOutlined style={{ fontSize: 15 }} />}
                  onClick={toggleDarkMode}
                  aria-label="Toggle theme"
                  style={{ width: 34, height: 34, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                />
              </Tooltip>,
              !isAuthenticated && (
                <Button
                  key="login"
                  type="primary"
                  icon={<LoginOutlined />}
                  onClick={() => navigate('/login')}
                  style={{ fontWeight: 600 }}
                >
                  Sign In
                </Button>
              ),
            ].filter(Boolean) as React.ReactNode[]
          }
          avatarProps={
            isAuthenticated
              ? {
                  src: undefined,
                  title: user?.displayName || 'User',
                  size: 'small',
                  render: (_props, dom) => {
                    return (
                      <Dropdown menu={{ items: userMenuItems }} trigger={['click']} placement="bottomRight">
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            cursor: 'pointer',
                            padding: '4px 6px',
                            borderRadius: 6,
                          }}
                        >
                          <Avatar
                            size={26}
                            style={{
                              backgroundColor: token.colorPrimary,
                              fontSize: 12,
                              fontWeight: 600,
                            }}
                          >
                            {user?.displayName ? user.displayName.slice(0, 1).toUpperCase() : 'U'}
                          </Avatar>
                          <Text
                            style={{
                              fontSize: 13,
                              maxWidth: 110,
                              lineHeight: 'normal',
                              color: token.colorText,
                            }}
                            ellipsis
                          >
                            {user?.displayName}
                          </Text>
                        </div>
                      </Dropdown>
                    );
                  },
                }
              : undefined
          }
          contentStyle={{
            padding: 0,
            margin: 0,
            minHeight: 'calc(100vh - 56px)',
          }}
        >
          <div
            style={{
              padding: '16px 24px',
              maxWidth: 1440,
              width: '100%',
              margin: '0 auto',
            }}
          >
            <Outlet context={{ onOpenNewPrompt: () => setCreatePromptOpen(true) }} />
          </div>
        </ProLayout>

        {/* Global Search Modal */}
        <GlobalSearchModal
          open={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectPrompt={(id) => {
            setSearchOpen(false);
            navigate(`/prompts?detailId=${id}`);
          }}
          onSelectCategory={(id) => {
            setSearchOpen(false);
            navigate(`/prompts?category=${id}`);
          }}
          onSelectCollection={(id) => {
            setSearchOpen(false);
            navigate(`/prompts?collection=${id}`);
          }}
          onSelectTag={(name) => {
            setSearchOpen(false);
            navigate(`/prompts?tags=${encodeURIComponent(name)}`);
          }}
        />

        {/* Global Create Prompt Drawer */}
        <PromptFormDrawer
          open={createPromptOpen}
          onClose={() => setCreatePromptOpen(false)}
        />
      </div>
    </ProConfigProvider>
  );
};
