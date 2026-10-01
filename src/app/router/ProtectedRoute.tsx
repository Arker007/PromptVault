import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Flex, Spin, Typography, theme } from 'antd';
import { KeyOutlined } from '@ant-design/icons';
import { useAuth } from '@/features/auth/index.ts';
import { authStorage } from '@/shared/api/apiClient.ts';

const { Title, Text } = Typography;

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const token = authStorage.getToken();
  const { token: themeToken } = theme.useToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <Flex
        vertical
        justify="center"
        align="center"
        style={{
          height: '100vh',
          width: '100vw',
          backgroundColor: themeToken.colorBgLayout,
          gap: 16,
        }}
      >
        <Flex
          vertical
          align="center"
          style={{
            padding: '32px 48px',
            backgroundColor: themeToken.colorBgContainer,
            border: `1px solid ${themeToken.colorBorderSecondary}`,
            borderRadius: themeToken.borderRadiusLG,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            textAlign: 'center',
          }}
        >
          <Flex align="center" gap={8} style={{ marginBottom: 16 }}>
            <KeyOutlined style={{ fontSize: 24, color: themeToken.colorPrimary }} />
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              PromptVault
            </Title>
          </Flex>

          <Spin size="large" style={{ margin: '12px 0' }} />

          <Text type="secondary" style={{ fontSize: 13, marginTop: 8 }}>
            Verifying authentication session...
          </Text>
        </Flex>
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
