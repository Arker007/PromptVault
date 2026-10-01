import React, { useState, useEffect } from 'react';
import {
  Form,
  Button,
  Tag,
  Space,
  Flex,
  Typography,
  Tooltip,
  Row,
  Col,
  Switch,
  theme,
} from 'antd';
import { ProCard, ProForm, ProFormText, ProFormSwitch } from '@ant-design/pro-components';
import {
  ApiOutlined,
  CheckCircleOutlined,
  SettingOutlined,
  LinkOutlined,
  KeyOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { SupabaseInstructionsPanel } from './SupabaseInstructionsPanel.tsx';
import type { SupabaseConfigData } from '../types/index.ts';
import { formatDate } from '@/shared/lib/formatters.ts';

const { Text } = Typography;

interface SupabaseCredentialsCardProps {
  config?: SupabaseConfigData;
  isConfigLoading?: boolean;
  onSaveConfig: (values: Partial<SupabaseConfigData>) => void;
  onTestConnection: (values?: { supabaseUrl?: string; supabaseKey?: string }) => void;
  isTestingConnection?: boolean;
}

export const SupabaseCredentialsCard: React.FC<SupabaseCredentialsCardProps> = ({
  config,
  isConfigLoading,
  onSaveConfig,
  onTestConnection,
  isTestingConnection,
}) => {
  const { token } = theme.useToken();
  const [configForm] = Form.useForm();
  const [isEditingCredentials, setIsEditingCredentials] = useState<boolean>(false);

  useEffect(() => {
    if (config) {
      configForm.setFieldsValue({
        supabaseUrl: config.supabaseUrl,
        supabaseKey: config.supabaseKey,
        autoFetchFromSupabase: config.autoFetchFromSupabase !== false,
      });
    }
  }, [config, configForm]);

  const handleFinish = (values: any) => {
    onSaveConfig(values);
    setIsEditingCredentials(false);
  };

  const handleTest = () => {
    const values = configForm.getFieldsValue();
    onTestConnection(values);
  };

  const handleAutoFetchToggle = (checked: boolean) => {
    onSaveConfig({
      autoFetchFromSupabase: checked,
    });
  };

  const showSavedView = !isEditingCredentials && (config?.isKeySet || config?.supabaseUrl);

  return (
    <ProCard
      title={
        <Space size={8}>
          <SettingOutlined style={{ color: token.colorPrimary }} />
          <span>Supabase Connection Credentials</span>
        </Space>
      }
      headerBordered
      extra={
        <Space direction="horizontal" size={8}>
          <Tooltip
            title={
              isEditingCredentials
                ? 'Hide credential fields and instructions'
                : 'Manage and update your stored Supabase URL & API key'
            }
          >
            <Button
              icon={<SettingOutlined />}
              size="small"
              type={isEditingCredentials ? 'primary' : 'default'}
              onClick={() => setIsEditingCredentials(!isEditingCredentials)}
            >
              {isEditingCredentials ? 'Hide Credentials' : 'Manage Credentials'}
            </Button>
          </Tooltip>

          <Tooltip title="Test connectivity to Supabase project API">
            <Button
              icon={<ApiOutlined />}
              size="small"
              loading={isTestingConnection}
              onClick={handleTest}
            >
              Test Connection
            </Button>
          </Tooltip>
        </Space>
      }
    >
      {/* 1. Stored & Active view container */}
      <div
        style={{
          display: showSavedView ? 'block' : 'none',
          backgroundColor: token.colorBgContainer,
          border: `1px solid ${token.colorBorderSecondary}`,
          borderRadius: token.borderRadiusLG,
          padding: '24px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
        }}
      >
        <Row gutter={[24, 24]} align="middle">
          <Col span={24}>
            <Flex vertical gap={16}>
              <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <Flex align="center" gap={8}>
                  <Tag
                    color="success"
                    icon={<CheckCircleOutlined />}
                    style={{
                      padding: '4px 12px',
                      fontSize: 13,
                      borderRadius: token.borderRadius,
                      border: 'none',
                      backgroundColor: 'rgba(82, 196, 26, 0.1)',
                      color: token.colorSuccessText,
                    }}
                  >
                    Credentials Stored & Active
                  </Tag>

                  {config?.autoFetchFromSupabase !== false ? (
                    <Tag
                      color="processing"
                      icon={<SyncOutlined spin={false} />}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: token.borderRadius,
                      }}
                    >
                      Auto-Fetch Enabled
                    </Tag>
                  ) : (
                    <Tag
                      color="default"
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: token.borderRadius,
                      }}
                    >
                      Auto-Fetch Paused
                    </Tag>
                  )}
                </Flex>

                <Flex align="center" gap={8}>
                  <Text style={{ fontSize: 13, color: token.colorTextSecondary }}>
                    Auto-fetch data on account access:
                  </Text>
                  <Switch
                    size="small"
                    checked={config?.autoFetchFromSupabase !== false}
                    onChange={handleAutoFetchToggle}
                  />
                </Flex>
              </Flex>

              <Flex vertical gap={8}>
                <Flex align="center" gap={8} wrap="wrap">
                  <LinkOutlined style={{ color: token.colorTextSecondary }} />
                  <Text type="secondary" style={{ minWidth: 90, fontSize: 13 }}>Project URL:</Text>
                  <Text
                    copyable
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      color: token.colorPrimary,
                      backgroundColor: token.colorBgLayout,
                      padding: '2px 8px',
                      borderRadius: token.borderRadiusSM,
                    }}
                  >
                    {config?.supabaseUrl}
                  </Text>
                </Flex>

                <Flex align="center" gap={8} wrap="wrap">
                  <KeyOutlined style={{ color: token.colorTextSecondary }} />
                  <Text type="secondary" style={{ minWidth: 90, fontSize: 13 }}>API Key:</Text>
                  <Text
                    style={{
                      fontFamily: 'Consolas, Monaco, monospace',
                      fontSize: 13,
                      color: token.colorTextTertiary,
                      backgroundColor: token.colorBgLayout,
                      padding: '2px 8px',
                      borderRadius: token.borderRadiusSM,
                    }}
                  >
                    ••••••••••••••••••••••••••••••••
                  </Text>
                </Flex>

                {config?.lastFetchedAt && (
                  <Flex align="center" gap={8} wrap="wrap" style={{ marginTop: 4 }}>
                    <SyncOutlined style={{ color: token.colorTextSecondary, fontSize: 12 }} />
                    <Text type="secondary" style={{ minWidth: 90, fontSize: 12 }}>Last Synced:</Text>
                    <Text style={{ fontSize: 12, color: token.colorTextSecondary }}>
                      {formatDate(config.lastFetchedAt)}
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Flex>
          </Col>
        </Row>
      </div>

      {/* 2. ProForm Edit Container (ALWAYS mounted to prevent useForm disconnected warning) */}
      <div style={{ display: !showSavedView ? 'block' : 'none' }}>
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} md={13}>
            <ProForm
              form={configForm}
              onFinish={handleFinish}
              disabled={isConfigLoading}
              initialValues={{ autoFetchFromSupabase: true }}
              submitter={{
                searchConfig: { submitText: 'Save & Auto-Fetch from Supabase' },
                render: (_, dom) => (
                  <Flex justify="flex-start" gap={8} style={{ marginTop: 8 }}>
                    {dom[1]}
                    {(config?.isKeySet || config?.supabaseUrl) && (
                      <Button onClick={() => setIsEditingCredentials(false)}>
                        Cancel
                      </Button>
                    )}
                  </Flex>
                ),
              }}
            >
              <ProFormText
                width="xl"
                name="supabaseUrl"
                label="Supabase Project URL"
                placeholder="https://xyz.supabase.co"
                rules={[{ required: true, message: 'Enter your Supabase URL' }]}
                extra="e.g. https://xyz.supabase.co"
              />
              <ProFormText.Password
                width="xl"
                name="supabaseKey"
                label="Supabase API Key (service_role / anon)"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                rules={[{ required: true, message: 'Enter your API Key' }]}
                extra="Stored securely server-side"
              />
              <ProFormSwitch
                name="autoFetchFromSupabase"
                label="Auto-fetch data from Supabase"
                extra="Automatically pull prompts, categories, and tags from Supabase on account login & startup"
              />
            </ProForm>
          </Col>

          <Col xs={24} md={11}>
            <SupabaseInstructionsPanel />
          </Col>
        </Row>
      </div>
    </ProCard>
  );
};
