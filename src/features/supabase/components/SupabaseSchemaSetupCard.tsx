import React from 'react';
import { Button, Tag, Space, Flex, Alert, Tooltip } from 'antd';
import { ProCard } from '@ant-design/pro-components';
import {
  ApiOutlined,
  CodeOutlined,
  CopyOutlined,
  CheckOutlined,
} from '@ant-design/icons';

interface SupabaseSchemaSetupCardProps {
  onTestDbTables: () => void;
  isTestingDb?: boolean;
  onOpenSqlModal: () => void;
  onCopySchemaSql: () => void;
  isCopied?: boolean;
}

export const SupabaseSchemaSetupCard: React.FC<SupabaseSchemaSetupCardProps> = ({
  onTestDbTables,
  isTestingDb,
  onOpenSqlModal,
  onCopySchemaSql,
  isCopied,
}) => {
  return (
    <ProCard
      title="Database Setup Required: Relational Schema & Row-Level Security"
      headerBordered
      extra={
        <Space direction="horizontal" size={8}>
          <Tooltip title="Verify required tables exist in your Supabase project">
            <Button
              icon={<ApiOutlined />}
              size="small"
              loading={isTestingDb}
              onClick={onTestDbTables}
            >
              Test DB Tables
            </Button>
          </Tooltip>
          <Tooltip title="View or copy Phase 1 SQL DDL schema & security policies">
            <Button
              type="primary"
              icon={<CodeOutlined />}
              size="small"
              onClick={onOpenSqlModal}
            >
              View & Copy SQL Script
            </Button>
          </Tooltip>
        </Space>
      }
    >
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 12 }}
        message="Setup Guidance: Provision PostgreSQL Database"
        description="Connect your Supabase project credentials above, then run the SQL script in your Supabase SQL Editor to provision tables (prompts, categories, collections, tags, prompt_versions) with RLS."
      />

      <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
        <Space direction="horizontal" size={8}>
          <Tag color="blue">7 Relational Tables</Tag>
          <Tag color="green">Row-Level Security (RLS)</Tag>
          <Tag color="purple">Performance Indexes</Tag>
        </Space>

        <Button
          size="small"
          icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={onCopySchemaSql}
        >
          {isCopied ? 'Copied SQL Script' : 'Copy SQL Script'}
        </Button>
      </Flex>
    </ProCard>
  );
};
