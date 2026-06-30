import { Card, Typography, Space, Button, Row, Col, Statistic, message, Result } from 'antd'
import { TreeVisualizer } from '../components/TreeVisualizer'
import { useWizardStore } from '../hooks/useWizard'
import { wizardApi } from '../../../services/wizard'

const { Title, Text } = Typography

export function DiagnoseStage() {
  const {
    credential,
    tree,
    docCount,
    summary,
    loading,
    error,
    setDiagnoseResult,
    setStage,
    setLoading,
    setError,
  } = useWizardStore()

  const handleDiagnose = async () => {
    if (!credential) {
      message.error('缺少凭证信息')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await wizardApi.diagnose(credential.kbId, credential.token)
      if (res.success && res.data) {
        setDiagnoseResult(res.data)
      } else {
        setError(res.error || res.message || '诊断失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '诊断失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setStage('generate')
  }

  const handleBack = () => {
    setStage('init')
  }

  if (error) {
    return (
      <Result
        status="error"
        title="诊断失败"
        subTitle={error}
        extra={
          <Space>
            <Button onClick={handleBack}>返回上一步</Button>
            <Button type="primary" onClick={handleDiagnose} loading={loading}>
              重试
            </Button>
          </Space>
        }
      />
    )
  }

  return (
    <div>
      <Card style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>能力诊断</Title>
        <Text type="secondary">
          分析知识库结构、文档数量和内容摘要
        </Text>
      </Card>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识库 ID"
              value={credential?.kbId || '-'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="知识库名称"
              value={credential?.kbName || '-'}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="文档数量"
              value={docCount}
              suffix="篇"
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="目录节点"
              value={tree.length}
              suffix="个"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <TreeVisualizer tree={tree} loading={loading && tree.length === 0} />
        </Col>
        <Col span={12}>
          <Card title="内容摘要">
            {summary ? (
              <Text>{summary}</Text>
            ) : (
              <Text type="secondary">暂无摘要信息</Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={handleBack}>返回上一步</Button>
          <Button type="primary" onClick={handleDiagnose} loading={loading}>
            重新诊断
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={tree.length === 0}
          >
            下一步：生成产物
          </Button>
        </Space>
      </Card>
    </div>
  )
}