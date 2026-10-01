import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Typography,
  Alert,
  Tabs,
  Flex,
  Space,
  theme,
} from 'antd';
import { LockOutlined, MailOutlined, UserOutlined, KeyOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth.ts';

const { Title, Text, Paragraph } = Typography;

export const LoginPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const isExpired = searchParams.get('expired') === '1';
  const { login, register, isLoggingIn, isRegistering } = useAuth();
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginForm] = Form.useForm();
  const [registerForm] = Form.useForm();
  const { token } = theme.useToken();

  const handleLoginSubmit = (values: any) => {
    login({ email: values.email, password: values.password });
  };

  const handleRegisterSubmit = (values: any) => {
    register({
      displayName: values.displayName,
      email: values.email,
      password: values.password,
    });
  };

  const handleFillDemo = () => {
    loginForm.setFieldsValue({
      email: 'user@promptvault.local',
      password: 'vault123',
    });
  };

  return (
    <Flex
      justify="center"
      align="center"
      style={{
        minHeight: '100vh',
        backgroundColor: token.colorBgLayout,
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 400,
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: '32px 24px',
        }}
      >
        <Flex vertical align="center" style={{ marginBottom: 24, textAlign: 'center' }}>
          <Space orientation="horizontal" size={8} style={{ marginBottom: 4 }}>
            <KeyOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
            <Title level={4} style={{ margin: 0, fontWeight: 600 }}>
              PromptVault
            </Title>
          </Space>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Secure personal prompt knowledge base
          </Text>
        </Flex>

        {isExpired && (
          <Alert
            message="Session Expired"
            description="Your session has expired. Please sign in again."
            type="warning"
            showIcon
            style={{ marginBottom: 20 }}
          />
        )}

        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k as 'login' | 'register')}
          centered
          items={[
            { key: 'login', label: 'Sign In' },
            { key: 'register', label: 'Create Account' },
          ]}
          style={{ marginBottom: 16 }}
        />

        <div style={{ display: activeTab === 'login' ? 'block' : 'none' }}>
          <Form
            form={loginForm}
            layout="vertical"
            initialValues={{ email: 'user@promptvault.local', password: 'vault123' }}
            onFinish={handleLoginSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 12 }}>
              <Button type="primary" htmlType="submit" block loading={isLoggingIn}>
                Sign In
              </Button>
            </Form.Item>

            <Flex justify="space-between" align="center">
              <Button
                type="link"
                size="small"
                onClick={handleFillDemo}
                style={{ padding: 0, fontSize: 12 }}
              >
                Use Demo Credentials
              </Button>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Default: vault123
              </Text>
            </Flex>
          </Form>
        </div>

        <div style={{ display: activeTab === 'register' ? 'block' : 'none' }}>
          <Form
            form={registerForm}
            layout="vertical"
            onFinish={handleRegisterSubmit}
            requiredMark={false}
          >
            <Form.Item
              name="displayName"
              label="Display Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input
                prefix={<UserOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="e.g. Vishal Sharma"
              />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email address' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="name@example.com"
                autoComplete="email"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[
                { required: true, message: 'Please set a password' },
                { min: 6, message: 'Minimum 6 characters' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: token.colorTextSecondary }} />}
                placeholder="Minimum 6 characters"
                autoComplete="new-password"
              />
            </Form.Item>

            <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" block loading={isRegistering}>
                Create Account
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </Flex>
  );
};
