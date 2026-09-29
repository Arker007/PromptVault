import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Flex, Typography, Space, theme } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { message } from '@/shared/lib/message.ts';
import { PromptDetailDTO, PromptSummaryDTO } from '@/shared/types/index.ts';
import { useCopyPrompt } from '@/features/prompts/hooks/useCopyPrompt.ts';

const { Text } = Typography;

interface PromptVariablesModalProps {
  open: boolean;
  prompt: PromptDetailDTO | PromptSummaryDTO | null;
  onClose: () => void;
}

const PromptVariablesContent: React.FC<{
  prompt: PromptDetailDTO | PromptSummaryDTO;
  onClose: () => void;
}> = ({ prompt, onClose }) => {
  const [form] = Form.useForm();
  const [renderedContent, setRenderedContent] = useState(prompt.content);
  const { copyPrompt, isCopying } = useCopyPrompt();
  const { token } = theme.useToken();

  const variables = prompt.variables || [];

  useEffect(() => {
    form.resetFields();
    setRenderedContent(prompt.content);
  }, [prompt, form]);

  const updatePreview = () => {
    const values = form.getFieldsValue();
    let text = prompt.content;
    variables.forEach((v) => {
      const val = values[v] !== undefined && values[v] !== '' ? values[v] : `{{${v}}}`;
      const regex = new RegExp(`\\{\\{${v}\\}\\}`, 'g');
      text = text.replace(regex, val);
    });
    setRenderedContent(text);
  };

  const handleCopyRendered = async () => {
    try {
      await form.validateFields();
      copyPrompt(prompt.id, renderedContent);
      onClose();
    } catch {
      // form errors
    }
  };

  return (
    <>
      <div style={{ padding: '8px 0' }}>
        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
          Fill in the variable placeholders below to generate a tailored copy of this prompt template without modifying the original.
        </Text>

        <Form
          form={form}
          layout="vertical"
          onValuesChange={updatePreview}
          requiredMark="optional"
        >
          {variables.map((v) => (
            <Form.Item
              key={v}
              name={v}
              label={
                <Text strong style={{ fontSize: 13, textTransform: 'capitalize' }}>
                  {v.replace(/_/g, ' ')}
                </Text>
              }
              rules={[{ required: true, message: `Please provide value for ${v}` }]}
            >
              <Input.TextArea
                placeholder={`Enter ${v}...`}
                autoSize={{ minRows: 1, maxRows: 4 }}
              />
            </Form.Item>
          ))}
        </Form>

        <div style={{ marginTop: 20 }}>
          <Text strong style={{ fontSize: 12, color: token.colorTextSecondary }}>
            LIVE PREVIEW
          </Text>
          <div
            style={{
              marginTop: 6,
              padding: '12px 16px',
              backgroundColor: token.colorBgLayout,
              border: `1px solid ${token.colorBorderSecondary}`,
              borderRadius: token.borderRadius,
              maxHeight: 220,
              overflowY: 'auto',
              fontFamily:
                'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
              fontSize: 12,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {renderedContent}
          </div>
        </div>
      </div>

      <Flex justify="space-between" align="center" style={{ marginTop: 20 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          type="primary"
          icon={<CopyOutlined />}
          loading={isCopying}
          onClick={handleCopyRendered}
        >
          Copy Generated Prompt
        </Button>
      </Flex>
    </>
  );
};

export const PromptVariablesModal: React.FC<PromptVariablesModalProps> = ({
  open,
  prompt,
  onClose,
}) => {
  if (!open || !prompt) return null;

  return (
    <Modal
      title={
        <Space orientation="horizontal" size={8}>
          <Text strong style={{ fontSize: 16 }}>
            Fill Variables: {prompt.title}
          </Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <PromptVariablesContent prompt={prompt} onClose={onClose} />
    </Modal>
  );
};
