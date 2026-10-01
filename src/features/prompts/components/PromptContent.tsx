import React, { useRef } from 'react';
import { Typography, Flex, Button, Space, theme } from 'antd';
import { CopyOutlined, CheckOutlined, SelectOutlined } from '@ant-design/icons';
import { message } from '@/shared/lib/message.ts';
import { useCopyPrompt } from '../hooks/useCopyPrompt.ts';

const { Paragraph } = Typography;

interface PromptContentProps {
  id: string;
  content: string;
}

export const PromptContent: React.FC<PromptContentProps> = ({ id, content }) => {
  const { copyPrompt, isCopying } = useCopyPrompt();
  const contentRef = useRef<HTMLDivElement>(null);
  const { token } = theme.useToken();

  const handleSelectAll = () => {
    if (!contentRef.current) return;
    const range = document.createRange();
    range.selectNodeContents(contentRef.current);
    const sel = window.getSelection();
    if (sel) {
      sel.removeAllRanges();
      sel.addRange(range);
      message.info('Content selected');
    }
  };

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: token.borderRadius,
        backgroundColor: token.colorBgContainer,
        position: 'relative',
      }}
    >
      {/* Top action bar */}
      <Flex
        justify="space-between"
        align="center"
        style={{
          padding: '8px 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          backgroundColor: token.colorBgLayout,
          borderTopLeftRadius: token.borderRadius,
          borderTopRightRadius: token.borderRadius,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: token.colorTextSecondary }}>
          PROMPT TEMPLATE
        </span>
        <Space direction="horizontal" size={8}>
          <Button
            size="small"
            icon={<SelectOutlined />}
            onClick={handleSelectAll}
          >
            Select All
          </Button>
          <Button
            size="small"
            type="primary"
            icon={<CopyOutlined />}
            loading={isCopying}
            onClick={() => copyPrompt(id, content)}
          >
            Copy
          </Button>
        </Space>
      </Flex>

      {/* Content body preserving line breaks and whitespace */}
      <div
        ref={contentRef}
        style={{
          padding: '16px 20px',
          maxHeight: 520,
          overflowY: 'auto',
          fontSize: 13,
          lineHeight: 1.6,
          color: token.colorText,
        }}
      >
        <Paragraph
          style={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontFamily:
              'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            margin: 0,
          }}
        >
          {content}
        </Paragraph>
      </div>
    </div>
  );
};
