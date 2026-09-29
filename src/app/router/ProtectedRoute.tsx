import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Flex, Spin } from 'antd';
import { useAuth } from '@/features/auth/index.ts';
import { authStorage } from '@/shared/api/apiClient.ts';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const token = authStorage.getToken();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" style={{ height: '100vh', width: '100vw' }}>
        <Spin size="large" />
      </Flex>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
