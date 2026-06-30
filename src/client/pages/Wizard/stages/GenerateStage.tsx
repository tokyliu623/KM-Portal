import { Card, Typography, Row, Col, Button, Space, Result, Progress, message } from 'antd'
import { ProductCard } from '../components/ProductCard'
import { useWizardStore } from '../hooks/useWizard'
import { wizardApi } from '../../../services/wizard'
import type { ProductItem } from '../../../services/wizard'

const { Title, Text } = Typography

const defaultProducts: ProductItem[] = [
  {
    type: 'skill',
    name: 'Skill 安装包',
    description: 'Skill 安装包，可导入 BlueCode/Claude Code 等 Agent',
    icon: 'GiftOutlined',
  },
  {
    type: 'mcp',
    name: 'MCP 配置',
    description: 'MCP mcpServers JSON，配置 Claude Desktop/Cursor',
    icon: 'ApiOutlined',
  },
  {
    type: 'template',
    name: 'AI 模板',
    description: '5 类 AI 指令模板，涵盖写作/阅读/问答/检索/知识管理',
    icon: 'BulbOutlined',
  },
  {
    type: 'openapi',
    name: 'OpenAPI 规范',
    description: 'OpenAPI 3.0 规范，支持 Swagger 预览',
    icon: 'FileTextOutlined',
  },
  {
    type: 'structure',
    name: '目录结构',
    description: '知识库目录树可视化，JSON + Markdown 格式',
    icon: 'FolderOutlined',
  },
]

export function GenerateStage() {
  const {
    credential,
    products,
    loading,
    error,
    setProducts,
    setStage,
    setLoading,
    setError,
  } = useWizardStore()

  const handleGenerate = async () => {
    if (!credential) {
      message.error('缺少凭证信息')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await wizardApi.generate(credential.kbId, credential.token)
      if (res.success && res.data) {
        setProducts(res.data.products)
      } else {
        setError(res.error || res.message || '生成失败')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const handleNext = () => {
    setStage('analyze')
  }

  const handleBack = () => {
    setStage('diagnose')
  }

  const handleDownload = (product: ProductItem) => {
    message.info(`下载 ${product.name}`)
  }

  if (error) {
    return (
      <Result
        status="error"
        title="生成失败"
        subTitle={error}
        extra={
          <Space>
            <Button onClick={handleBack}>返回上一步</Button>
            <Button type="primary" onClick={handleGenerate} loading={loading}>
              重试
            </Button>
          </Space>
        }
      />
    )
  }

  const displayProducts = products.length > 0 ? products : defaultProducts

  return (
    <div>
      <Card style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>产物生成</Title>
        <Text type="secondary">
          生成 5 类运营产物：Skill 安装包、MCP 配置、AI 模板、OpenAPI 规范、目录结构
        </Text>
      </Card>

      {loading && (
        <Card style={{ marginBottom: 24 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <Text>正在生成产物...</Text>
            <Progress percent={75} status="active" />
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]}>
        {displayProducts.map((product) => (
          <Col span={8} key={product.type}>
            <ProductCard product={product} onDownload={handleDownload} />
          </Col>
        ))}
      </Row>

      <Card style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={handleBack}>返回上一步</Button>
          <Button type="primary" onClick={handleGenerate} loading={loading}>
            重新生成
          </Button>
          <Button
            type="primary"
            onClick={handleNext}
            disabled={products.length === 0}
          >
            下一步：运营分析
          </Button>
        </Space>
      </Card>
    </div>
  )
}