import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Radio,
  Select,
  Typography,
  Flex,
  Space,
  Upload,
  Divider,
  theme,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  SettingOutlined,
  DownloadOutlined,
  UploadOutlined,
  CloudServerOutlined,
} from '@ant-design/icons';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import { useAuth } from '@/features/auth/index.ts';
import { useThemeMode } from '@/app/providers/ThemeProvider.tsx';
import { apiClient } from '@/shared/api/apiClient.ts';
import { authApi } from '@/features/auth/api/authApi.ts';
import { message } from '@/shared/lib/message.ts';
import { SupabaseStorageSettings } from '../components/SupabaseStorageSettings.tsx';

const { Text, Title, Paragraph } = Typography;

export const SettingsPage: React.FC = () => {
  const { user, updateProfile, isUpdatingProfile } = useAuth();
  const { isDarkMode, setDarkMode } = useThemeMode();
  const { token } = theme.useToken();

  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [preferencesForm] = Form.useForm();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const getResolvedTab = (): string => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'security', 'preferences', 'supabase', 'backup'].includes(tabParam)) {
      return tabParam;
    }
    const pathPart = location.pathname.split('/')[2];
    if (pathPart && ['profile', 'security', 'preferences', 'supabase', 'backup'].includes(pathPart)) {
      return pathPart;
    }
    return 'profile';
  };

  const [activeTab, setActiveTab] = useState<string>(getResolvedTab);

  useEffect(() => {
    setActiveTab(getResolvedTab());
  }, [location.pathname, location.search]);

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    navigate(`/settings/${key}`, { replace: true });
  };

  // Profile update
  const handleProfileSubmit = (values: any) => {
    updateProfile({ displayName: values.displayName });
  };

  // Password update
  const handlePasswordSubmit = async (values: any) => {
    setIsChangingPassword(true);
    try {
      await authApi.updatePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      message.success('Password updated successfully');
      passwordForm.resetFields();
    } catch (err: any) {
      message.error(err.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Preferences update
  const handlePreferencesSubmit = (values: any) => {
    if (values.theme) {
      setDarkMode(values.theme === 'dark');
    }
    updateProfile({
      preferences: {
        theme: values.theme,
        defaultPageSize: values.defaultPageSize,
        copyNotificationDuration: values.copyNotificationDuration,
      },
    });
  };

  // Export JSON
  const handleExportData = async () => {
    try {
      const data = await apiClient.get<any>('/api/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `promptvault-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      message.success('Data exported successfully');
    } catch (err: any) {
      message.error('Failed to export data');
    }
  };

  // Import JSON
  const handleImportFile = async (file: File) => {
    setIsImporting(true);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed.data || !Array.isArray(parsed.data.prompts)) {
        throw new Error('Invalid PromptVault export format');
      }

      const res = await apiClient.post<any>('/api/import', { data: parsed.data });
      message.success(
        `Imported ${res.imported.prompts} prompts, ${res.imported.categories} categories, and ${res.imported.collections} collections.`
      );
      window.location.reload();
    } catch (err: any) {
      message.error(err.message || 'Failed to parse or import file');
    } finally {
      setIsImporting(false);
    }
    return false;
  };

  return (
    <PageContainer
      header={{
        title: 'Settings',
        subTitle: 'Configure account profile, theme modes, database persistence, and library backups.',
      }}
      tabList={[
        {
          key: 'profile',
          tab: (
            <Space size={6}>
              <UserOutlined />
              <span>Profile</span>
            </Space>
          ),
        },
        {
          key: 'security',
          tab: (
            <Space size={6}>
              <LockOutlined />
              <span>Security</span>
            </Space>
          ),
        },
        {
          key: 'preferences',
          tab: (
            <Space size={6}>
              <SettingOutlined />
              <span>Preferences</span>
            </Space>
          ),
        },
        {
          key: 'supabase',
          tab: (
            <Space size={6}>
              <CloudServerOutlined />
              <span>Cloud & Supabase Storage</span>
            </Space>
          ),
        },
        {
          key: 'backup',
          tab: (
            <Space size={6}>
              <DownloadOutlined />
              <span>Local Backup & Import</span>
            </Space>
          ),
        },
      ]}
      tabActiveKey={activeTab}
      onTabChange={handleTabChange}
    >
      <div style={{ marginTop: 8 }}>
        <div style={{ display: activeTab === 'profile' ? 'block' : 'none' }}>
          <ProCard
            bordered
            headerBordered
            title="Edit Profile"
            style={{ maxWidth: 640 }}
          >
            <Form
              form={profileForm}
              layout="vertical"
              initialValues={{
                displayName: user?.displayName || '',
                email: user?.email || '',
              }}
              onFinish={handleProfileSubmit}
            >
              <Form.Item label="Email Address">
                <Input value={user?.email} disabled />
                <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                  Your primary login email cannot be changed directly.
                </Text>
              </Form.Item>

              <Form.Item
                name="displayName"
                label="Display Name"
                rules={[{ required: true, message: 'Please enter your name' }]}
              >
                <Input placeholder="Your Name" maxLength={50} />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={isUpdatingProfile}>
                  Save Profile
                </Button>
              </Form.Item>
            </Form>
          </ProCard>
        </div>

        <div style={{ display: activeTab === 'security' ? 'block' : 'none' }}>
          <ProCard
            bordered
            headerBordered
            title="Update Password"
            style={{ maxWidth: 640 }}
          >
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handlePasswordSubmit}
            >
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Enter your current password' }]}
              >
                <Input.Password placeholder="••••••••" />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Enter new password' },
                  { min: 6, message: 'Password must be at least 6 characters' },
                ]}
              >
                <Input.Password placeholder="Minimum 6 characters" />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm New Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm password' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm new password" />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={isChangingPassword}>
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </ProCard>
        </div>

        <div style={{ display: activeTab === 'preferences' ? 'block' : 'none' }}>
          <ProCard
            bordered
            headerBordered
            title="App Preferences"
            style={{ maxWidth: 640 }}
          >
            <Form
              form={preferencesForm}
              layout="vertical"
              initialValues={{
                theme: isDarkMode ? 'dark' : 'light',
                defaultPageSize: user?.preferences?.defaultPageSize || 25,
                copyNotificationDuration: user?.preferences?.copyNotificationDuration || 2,
              }}
              onFinish={handlePreferencesSubmit}
            >
              <Form.Item name="theme" label="Theme Appearance">
                <Radio.Group
                  onChange={(e) => setDarkMode(e.target.value === 'dark')}
                >
                  <Radio.Button value="light">Light Mode</Radio.Button>
                  <Radio.Button value="dark">Dark Mode</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item name="defaultPageSize" label="Default Prompts Per Page">
                <Select
                  options={[
                    { label: '15 items', value: 15 },
                    { label: '25 items', value: 25 },
                    { label: '50 items', value: 50 },
                    { label: '100 items', value: 100 },
                  ]}
                />
              </Form.Item>

              <Form.Item name="copyNotificationDuration" label="Copy Alert Duration">
                <Select
                  options={[
                    { label: '1.5 seconds', value: 1.5 },
                    { label: '2.0 seconds (Default)', value: 2 },
                    { label: '3.0 seconds', value: 3 },
                  ]}
                />
              </Form.Item>

              <Form.Item style={{ marginTop: 24, marginBottom: 0 }}>
                <Button type="primary" htmlType="submit" loading={isUpdatingProfile}>
                  Save Preferences
                </Button>
              </Form.Item>
            </Form>
          </ProCard>
        </div>

        <div style={{ display: activeTab === 'supabase' ? 'block' : 'none', width: '100%' }}>
          <SupabaseStorageSettings />
        </div>

        <div style={{ display: activeTab === 'backup' ? 'block' : 'none' }}>
          <ProCard
            bordered
            headerBordered
            title="Library Data Export & Import"
            style={{ maxWidth: 640 }}
          >
            <Title level={5}>Export Knowledge Base</Title>
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              Download a complete JSON export of all your prompts, categories, collections, tags, version histories, and metadata.
            </Paragraph>
            <Button icon={<DownloadOutlined />} onClick={handleExportData} style={{ marginBottom: 16 }}>
              Export JSON Archive
            </Button>

            <Divider />

            <Title level={5}>Import Knowledge Base</Title>
            <Paragraph type="secondary" style={{ fontSize: 13 }}>
              Restore or import prompts from a previously exported PromptVault JSON archive. Duplicates will be safely merged.
            </Paragraph>
            <Upload
              beforeUpload={handleImportFile}
              showUploadList={false}
              accept=".json"
            >
              <Button icon={<UploadOutlined />} loading={isImporting}>
                Select JSON File to Import
              </Button>
            </Upload>
          </ProCard>
        </div>
      </div>
    </PageContainer>
  );
};
