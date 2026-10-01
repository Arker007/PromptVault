import React from 'react';
import { Flex, Typography, Space, theme } from 'antd';

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: string;
  description?: string;
  count?: number;
  extra?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  count,
  extra,
}) => {
  const { token } = theme.useToken();

  return (
    <Flex
      justify="space-between"
      align="center"
      wrap="wrap"
      gap={12}
      style={{ marginBottom: 20 }}
    >
      <div>
        <Space direction="horizontal" size={8} align="baseline">
          <Title
            level={3}
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: token.colorText,
              margin: 0,
            }}
          >
            {title}
          </Title>
          {count !== undefined && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
              ({count})
            </Text>
          )}
        </Space>
        {description && (
          <Text
            type="secondary"
            style={{ display: 'block', fontSize: 13, marginTop: 2 }}
          >
            {description}
          </Text>
        )}
      </div>

      {extra && <div>{extra}</div>}
    </Flex>
  );
};
