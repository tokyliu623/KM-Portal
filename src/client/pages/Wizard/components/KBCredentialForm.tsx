import { Form, Input, Button, Card, Space, Typography, message } from 'antd'
import type { KBCredential } from '../../../services/wizard'
import { useWizardStore } from '../hooks/useWizard'

const { Text } = Typography

interface KBCredentialFormProps {
  onSubmit?: (credential: KBCredential) => Promise<void> | void
  onSuccess?: (credential: KBCredential) => void
  loading?: boolean
}

export function KBCredentialForm({ onSubmit, onSuccess, loading }: KBCredentialFormProps) {
  const [form] = Form.useForm()

  const handleFinish = async (values: KBCredential) => {
    try {
      if (onSubmit) {
        await onSubmit(values)
      }
      const setCredential = useWizardStore.getState().setCredential
      setCredential(values)
      if (onSuccess) {
        onSuccess(values)
      }
    } catch {
      message.error('凭证验证失败')
    }
  }

  return (
    <Card title="知识库凭证" style={{ maxWidth: 500, margin: '0 auto' }}>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        initialValues={{ kbId: '', token: '', kbName: '' }}
      >
        <Form.Item
          name="kbId"
          label="KB ID"
          rules={[
            { required: true, message: '请输入 KB ID' },
            {
              validator: (_: unknown, value: string) => {
                if (!value) return Promise.reject('KB ID 不能为空')
                const num = Number(value)
                if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
                  return Promise.reject('KB ID 必须是正整数')
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <Input type="number" placeholder="输入 KB ID" />
        </Form.Item>

        <Form.Item
          name="token"
          label="访问 Token"
          rules={[{ required: true, message: '请输入访问 Token' }]}
        >
          <Input.Password placeholder="输入访问 Token" />
        </Form.Item>

        <Form.Item
          name="kbName"
          label="知识库名称"
          rules={[{ required: true, message: '请输入知识库名称' }]}
        >
          <Input placeholder="输入知识库名称" />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              验证凭证
            </Button>
            <Text type="secondary">凭证将用于访问知识库 API</Text>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}