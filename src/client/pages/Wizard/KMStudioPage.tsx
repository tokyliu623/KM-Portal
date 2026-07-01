import { useState, useEffect } from 'react'
import { Card, Tabs, Typography, Space, Tag, Button, App } from 'antd'
import {
  RocketOutlined,
  ThunderboltOutlined,
  CodeOutlined,
  FileSearchOutlined,
  ApiOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  FolderViewOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { wizardApi, type ProductItem, type ProductType } from '../../services/wizard'
import { useWizardStore, getKbId, getAccessToken } from './hooks/useWizard'
import { KBCredentialForm } from './components/KBCredentialForm'
import { TreeVisualizer } from './components/TreeVisualizer'
import { StatsPanel } from './components/StatsPanel'
import { SectionTag, FlowNode, FlowArrow, PulseDot, AgentCard, Highlight } from '../../components/ai'

const { Title, Paragraph } = Typography

const PRODUCT_META: Record<ProductType, { name: string; icon: React.ReactNode; color: string; description: string }> = {
  skill: { name: 'SKILL 包', icon: <ThunderboltOutlined />, color: 'blue', description: '可直接安装到 Claude / Cursor / Continue 的 Skill 安装包' },
  mcp: { name: 'MCP 配置', icon: <ApiOutlined />, color: 'purple', description: '4 客户端 MCP mcpServers JSON（Claude Desktop / Cursor / Continue / Cline）' },
  ai_template: { name: 'AI 指令模板', icon: <FileSearchOutlined />, color: 'cyan', description: '5 类 AI 指令模板（写作 / 阅读 / 问答 / 检索 / 指令）' },
  openapi: { name: 'OpenAPI 规范', icon: <CodeOutlined />, color: 'green', description: 'OpenAPI 3.0.3 规范 + Swagger UI 在线浏览' },
  tree: { name: '目录结构', icon: <RocketOutlined />, color: 'orange', description: '知识库树形结构 JSON + Markdown 可视化' },
}

function downloadText(content: string, filename: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadBase64(b64: string, filename: string, mimeType: string) {
  const byteChars = atob(b64)
  const bytes = new Uint8Array(byteChars.length)
  for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i)
  const blob = new Blob([bytes], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

interface ProductCardProps {
  product: ProductItem
  onDownload: (p: ProductItem) => void
}

function ProductCard({ product, onDownload }: ProductCardProps) {
  const meta = PRODUCT_META[product.type] || { name: product.name, icon: null, color: 'default', description: product.description }
  return (
    <Card
      hoverable
      style={{
        width: '100%',
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
      }}
      cover={
        <div style={{ background: 'var(--bg-card-alt)', padding: 24, textAlign: 'center', fontSize: 36, color: 'var(--accent-blue)' }}>
          {meta.icon}
        </div>
      }
    >
      <Card.Meta
        title={
          <Space>
            <span style={{ color: 'var(--text-primary)' }}>{meta.name}</span>
            <Tag color={meta.color}>{product.type}</Tag>
            {product.status === 'done' && <CheckCircleOutlined style={{ color: 'var(--accent-green)' }} />}
            {product.status === 'error' && <Tag color="error">失败</Tag>}
          </Space>
        }
        description={
          <>
            <Paragraph style={{ minHeight: 44, color: 'var(--text-secondary)' }}>{meta.description}</Paragraph>
            {product.error && <Typography.Text type="danger">{product.error}</Typography.Text>}
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              disabled={product.status === 'error' || (!product.content && !product.downloadUrl)}
              onClick={() => onDownload(product)}
              block
            >
              下载
            </Button>
          </>
        }
      />
    </Card>
  )
}

type StageKey = 'init' | 'tree' | 'products' | 'stats'

const STAGES: { key: StageKey; index: number; title: string; icon: React.ReactNode; color: 'blue' | 'orange' | 'green' | 'purple' }[] = [
  { key: 'init', index: 1, title: '初始化', icon: <KeyOutlined />, color: 'blue' },
  { key: 'tree', index: 2, title: '诊断', icon: <FolderViewOutlined />, color: 'orange' },
  { key: 'products', index: 3, title: '生成', icon: <ThunderboltOutlined />, color: 'green' },
  { key: 'stats', index: 4, title: '运营', icon: <BarChartOutlined />, color: 'purple' },
]

function KMStudioPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState<StageKey>('init')
  const { tree, docCount, products, jobStatus, loading } = useWizardStore()
  const kbId = getKbId()
  const accessToken = getAccessToken()
  const [polling, setPolling] = useState(false)

  useEffect(() => {
    if (!polling || !useWizardStore.getState().jobId) return
    const timer = setInterval(async () => {
      const state = useWizardStore.getState()
      if (!state.jobId) {
        setPolling(false)
        return
      }
      try {
        const res = await wizardApi.getStatus(state.jobId)
        if (res.data.success && res.data.data) {
          useWizardStore.setState({
            jobStatus: res.data.data.status,
            products: res.data.data.result?.products ?? state.products,
          })
          if (res.data.data.status === 'completed' || res.data.data.status === 'failed') {
            setPolling(false)
            if (res.data.data.status === 'completed') {
              message.success('产物生成完成')
              setActiveTab('products')
            } else {
              message.error('产物生成失败')
            }
          }
        }
      } catch (e) {
        setPolling(false)
        message.error('轮询失败')
      }
    }, 1500)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- message 是 App.useApp() 稳定引用；jobId 通过 getState() 始终读最新值
  }, [polling])

  const handleInit = async (cred: { kbId: string; kbName: string; token: string }) => {
    try {
      await wizardApi.init(cred)
      message.success('凭证验证成功')
    } catch (e) {
      message.warning('凭证已保存，部分高级功能可能不可用')
    }
    setActiveTab('tree')
  }

  const handleGenerate = async () => {
    if (!kbId || !accessToken) {
      message.warning('请先完成 KB 凭证初始化')
      return
    }
    try {
      const res = await wizardApi.generate(kbId, accessToken)
      if (res.data.success && res.data.data) {
        useWizardStore.setState({ jobId: res.data.data.jobId, jobStatus: 'pending', products: res.data.data.products ?? [] })
        setPolling(true)
        setActiveTab('products')
      } else {
        message.error(res.data.error || '生成请求失败')
      }
    } catch (e) {
      message.error('网络错误')
    }
  }

  const handleDownload = (product: ProductItem) => {
    if (product.downloadUrl) {
      window.open(product.downloadUrl, '_blank')
      return
    }
    if (!product.content) {
      message.warning('产物内容为空')
      return
    }
    const filename = product.filename || `${product.type}.txt`
    const mime = product.mimeType || 'text/plain'
    if (product.type === 'skill') {
      downloadBase64(product.content, filename, mime)
    } else if (product.type === 'openapi') {
      downloadText(product.content, filename, 'application/json')
    } else {
      downloadText(product.content, filename, mime)
    }
    message.success(`已下载 ${filename}`)
  }

  const isLoading = loading || polling

  return (
    <div>
      <PageHeaderForStudio active={activeTab} />
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 4 阶段流程图卡片 */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: 24,
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 'fit-content' }}>
            {STAGES.map((stage, i) => (
              <div key={stage.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <FlowNode
                  color={stage.color}
                  title={`${stage.index}. ${stage.title}`}
                  subtitle={getStageSubtitle(stage.key, activeTab, polling, products.length)}
                  icon={stage.icon}
                  active={activeTab === stage.key}
                />
                {i < STAGES.length - 1 && <FlowArrow />}
              </div>
            ))}
          </div>
        </div>

        {/* 阶段面板 */}
        <AgentCard
          title={`当前阶段：${STAGES.find(s => s.key === activeTab)?.title}`}
          subtitle={getStageSubtitle(activeTab, activeTab, polling, products.length)}
          variant="main"
        >
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as StageKey)}
            items={[
              {
                key: 'init',
                label: '1. 凭证初始化',
                children: <KBCredentialForm onSuccess={handleInit} />,
              },
              {
                key: 'tree',
                label: '2. 目录可视化',
                children: <TreeVisualizer tree={tree} docCount={docCount} onGenerate={handleGenerate} loading={isLoading} />,
              },
              {
                key: 'products',
                label: '3. 产物生成',
                children: (
                  <div>
                    {polling && (
                      <div style={{ marginBottom: 16 }}>
                        <PulseDot color="blue" label={`AI 生成中 (${jobStatus})`} />
                      </div>
                    )}
                    {products.length === 0 && !polling && (
                      <Card style={{ background: 'var(--bg-card-alt)' }}>
                        <Paragraph>尚未生成产物。请先在「凭证初始化」标签完成配置，再点击「生成全部产物」按钮。</Paragraph>
                        <Button type="primary" onClick={handleGenerate} disabled={!kbId || !accessToken} loading={isLoading}>
                          <Highlight color="purple">生成全部产物</Highlight>
                        </Button>
                      </Card>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                      {products.map((p, idx) => (
                        <ProductCard key={`${p.type}-${idx}`} product={p} onDownload={handleDownload} />
                      ))}
                    </div>
                  </div>
                ),
              },
              {
                key: 'stats',
                label: '4. 运营分析',
                children: <StatsPanel kbId={kbId} />,
              },
            ]}
          />
        </AgentCard>
      </Space>
    </div>
  )
}

function getStageSubtitle(stage: StageKey, _active: StageKey, polling: boolean, productsCount: number): string {
  if (polling) return '生成中...'
  switch (stage) {
    case 'init': return '配置 KB 凭证'
    case 'tree': return '查看知识库结构'
    case 'products': return `${productsCount} 个产物`
    case 'stats': return '查看运营指标'
  }
}

function PageHeaderForStudio({ active }: { active: StageKey }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <SectionTag index="01" label="KM Studio" englishLabel="One-Stop Knowledge Operations" />
      <Title level={3} style={{ color: 'var(--text-primary)', marginTop: 8 }}>
        <RocketOutlined style={{ color: 'var(--accent-blue)' }} /> 一站式知识库运营 - AI 驱动
      </Title>
      <Paragraph style={{ color: 'var(--text-secondary)' }}>
        输入 KB 凭证，一键生成 5 类生态产物。当前阶段：<Highlight color="blue">{STAGES.find(s => s.key === active)?.title}</Highlight>
      </Paragraph>
    </div>
  )
}

export default KMStudioPage
