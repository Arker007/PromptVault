import React from 'react';
import { Typography, Flex, Space, Tag, theme } from 'antd';
import { InfoCircleOutlined, LockOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

export const SupabaseInstructionsPanel: React.FC = () => {
  const { token } = theme.useToken();

  return (
    <div
      style={{
        backgroundColor: token.colorBgLayout,
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadiusLG,
        padding: '16px',
        height: '100%',
      }}
    >
      <Flex align="center" gap={8} style={{ marginBottom: 12 }}>
        <InfoCircleOutlined style={{ color: token.colorPrimary, fontSize: 16 }} />
        <Text strong style={{ fontSize: 13, color: token.colorText }}>
          Where to find these fields:
        </Text>
      </Flex>

      <Space orientation="vertical" size={10} style={{ width: '100%' }}>
        <Flex align="start" gap={8}>
          <Tag color="blue" style={{ margin: 0, minWidth: 20, textAlign: 'center' }}>
            1
          </Tag>
          <div>
            <Text strong style={{ fontSize: 12 }}>
              Open Supabase Dashboard
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
              Sign in at{' '}
              <a href="https://supabase.com/dashboard" target="_blank" rel="noreferrer">
                supabase.com/dashboard
              </a>{' '}
              and select your project.
            </Paragraph>
          </div>
        </Flex>

        <Flex align="start" gap={8}>
          <Tag color="blue" style={{ margin: 0, minWidth: 20, textAlign: 'center' }}>
            2
          </Tag>
          <div>
            <Text strong style={{ fontSize: 12 }}>
              Navigate to API Settings
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
              Click <strong>Project Settings</strong> (gear icon ⚙️) &gt; <strong>API</strong>.
            </Paragraph>
          </div>
        </Flex>

        <Flex align="start" gap={8}>
          <Tag color="blue" style={{ margin: 0, minWidth: 20, textAlign: 'center' }}>
            3
          </Tag>
          <div>
            <Text strong style={{ fontSize: 12 }}>
              Copy Project URL
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
              Copy the <strong>URL</strong> field under Project API keys (e.g. <code>https://xxx.supabase.co</code>).
            </Paragraph>
          </div>
        </Flex>

        <Flex align="start" gap={8}>
          <Tag color="blue" style={{ margin: 0, minWidth: 20, textAlign: 'center' }}>
            4
          </Tag>
          <div>
            <Text strong style={{ fontSize: 12 }}>
              Copy API Key
            </Text>
            <Paragraph type="secondary" style={{ fontSize: 11, margin: 0 }}>
              Copy the <code>service_role</code> secret key (recommended) or <code>anon</code> key.
            </Paragraph>
          </div>
        </Flex>
      </Space>

      <Flex
        align="center"
        gap={6}
        style={{
          marginTop: 14,
          paddingTop: 10,
          borderTop: `1px dashed ${token.colorBorderSecondary}`,
        }}
      >
        <LockOutlined style={{ color: token.colorSuccess, fontSize: 12 }} />
        <Text type="secondary" style={{ fontSize: 11 }}>
          Credentials are saved securely server-side via encrypted token.
        </Text>
      </Flex>
    </div>
  );
};
