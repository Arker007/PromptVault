import React from 'react';
import { Button, Modal, Typography, Flex, theme } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface SupabaseSqlModalProps {
  open: boolean;
  onClose: () => void;
  schemaSql: string;
  onCopySchemaSql: () => void;
  isCopied?: boolean;
}

export const SupabaseSqlModal: React.FC<SupabaseSqlModalProps> = ({
  open,
  onClose,
  schemaSql,
  onCopySchemaSql,
  isCopied,
}) => {
  const { token } = theme.useToken();

  return (
    <Modal
      title="Supabase PostgreSQL Schema & Security Policies (Phase 1 DDL)"
      open={open}
      onCancel={onClose}
      width={780}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button
          key="copy"
          type="primary"
          icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={onCopySchemaSql}
        >
          {isCopied ? 'Copied to Clipboard' : 'Copy SQL Script'}
        </Button>,
      ]}
      destroyOnClose
    >
      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
        Copy and paste this script into your <strong>Supabase Dashboard &gt; SQL Editor</strong> and click <strong>Run</strong>.
      </Paragraph>

      <Flex justify="flex-end" style={{ marginBottom: 8 }}>
        <Button
          size="small"
          icon={isCopied ? <CheckOutlined /> : <CopyOutlined />}
          onClick={onCopySchemaSql}
        >
          {isCopied ? 'Copied' : 'Copy SQL'}
        </Button>
      </Flex>

      <div
        style={{
          maxHeight: 400,
          overflowY: 'auto',
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          borderRadius: token.borderRadius,
          padding: 16,
          fontSize: 12,
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          lineHeight: 1.5,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {schemaSql || '-- Loading SQL schema...'}
      </div>
    </Modal>
  );
};
