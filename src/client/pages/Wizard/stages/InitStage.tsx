import { Card, Typography, Space, Button, Result } from 'antd'
import { KBCredentialForm } from '../components/KBCredentialForm'
import { useWizardStore } from '../hooks/useWizard'
import { wizardApi } from '../../../services/wizard'
import type { KBCredential } from '../../../services/wizard'

const { Title, Text } = Typography

export function InitStage() {
  const { setCredential, setStage, setError, setLoading, loading, error } = useWizardStore()

  const handleSubmit = async (credential: KBCredential) => {
    setLoading(true)
    setError(null)
    try {
      const res = await wizardApi.init(credential)
      if (res.success && res.data) {
        setCredential(credential)
        setStage('diagnose')
      } else {
        setError(res.error || res.message || '凭证验证失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '凭证验证失败')
      throw err
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <Card style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>知识库向导</Title>
        <Text type="secondary">
          输入知识库凭证，开始探索和生成运营产物
        </Text>
      </Card>

      {error ? (
        <Result
          status="error"
          title="凭证验证失败"
          subTitle={error}
          extra={
            <Button type="primary" onClick={() => setError(null)}>
              重试
            </Button>
          }
        />
      ) : (
        <KBCredentialForm onSubmit={handleSubmit} loading={loading} />
      )}

      <Card style={{ marginTop: 24 }}>
        <Title level={5}>向导流程</Title>
        <Space direction="vertical">
          <Text>
            <strong>1. 凭证输入</strong> — 验证 KB ID 和访问 Token
          </Text>
          <Text>
            <strong>2. 能力诊断</strong> — 分析知识库结构和内容
          </Text>
          <Text>
            <strong>3. 产物生成</strong> — 生成 5 类运营产物
          </Text>
          <Text>
            <strong>4. 运营分析</strong> — 查看运营数据和效果
          </Text>
        </Space>
      </Card>
    </div>
  )
}