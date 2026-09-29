import React from 'react';
import { Button, Tooltip } from 'antd';
import { CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useCopyPrompt } from '../hooks/useCopyPrompt.ts';

interface CopyPromptButtonProps {
  id: string;
  content: string;
  size?: 'small' | 'middle' | 'large';
  type?: 'primary' | 'default' | 'text' | 'link';
  showLabel?: boolean;
}

export const CopyPromptButton: React.FC<CopyPromptButtonProps> = ({
  id,
  content,
  size = 'middle',
  type = 'default',
  showLabel = true,
}) => {
  const { copyPrompt, isCopying } = useCopyPrompt();

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    copyPrompt(id, content);
  };

  return (
    <Tooltip title="Copy prompt text to clipboard">
      <Button
        type={type}
        size={size}
        icon={<CopyOutlined />}
        onClick={handleCopy}
        loading={isCopying}
      >
        {showLabel ? 'Copy' : ''}
      </Button>
    </Tooltip>
  );
};
