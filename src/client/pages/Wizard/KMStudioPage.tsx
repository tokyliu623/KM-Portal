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
  LoadingOutlined,
} from '@ant-design/icons'
import { wizardApi, type ProductItem, type ProductType } from '../../services/wizard'
import { useWizardStore, getKbId, getAccessToken } from './hooks/useWizard'
import { KBCredentialForm } from './components/KBCredentialForm'
import { TreeVisualizer } from './components/TreeVisualizer'
import { StatsPanel } from './components/StatsPanel'

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
      style={{ width: '100%' }}
      cover={
        <div style={{ background: '#fafafa', padding: 24, textAlign: 'center', fontSize: 36, color: '#1677ff' }}>
          {meta.icon}
        </div>
      }
    >
      <Card.Meta
        title={
          <Space>
            <span>{meta.name}</span>
            <Tag color={meta.color}>{product.type}</Tag>
            {product.status === 'done' && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
            {product.status === 'error' && <Tag color="error">失败</Tag>}
          </Space>
        }
        description={
          <>
            <Paragraph style={{ minHeight: 44 }}>{meta.description}</Paragraph>
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

function KMStudioPage() {
  const { message } = App.useApp()
  const [activeTab, setActiveTab] = useState<'init' | 'products' | 'tree' | 'stats'>('init')
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
        // v1.8.6: wizardApi 已 unwrap response.data,res 直接是 ApiResponse
        if (res.success && res.data) {
          useWizardStore.setState({
            jobStatus: res.data.status,
            products: res.data.products ?? state.products,
          })
          // v1.8.6 对齐服务端 status 枚举 done/error
          if (res.data.status === 'done' || res.data.status === 'error') {
            setPolling(false)
            if (res.data.status === 'done') {
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
  }, [polling, message])

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
      // v1.8.6: wizardApi 已 unwrap,res 直接是 ApiResponse
      if (res.success && res.data) {
        useWizardStore.setState({ jobId: res.data.jobId, jobStatus: 'pending', products: res.data.products ?? [] })
        setPolling(true)
        setActiveTab('products')
      } else {
        message.error(res.error || '生成请求失败')
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
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <RocketOutlined /> KM Studio
      </Title>
      <Paragraph type="secondary">一站式知识库运营管理平台 - 输入 KB 凭证，一键生成 5 类生态产物</Paragraph>

      <Tabs
        activeKey={activeTab}
        onChange={(k: string) => setActiveTab(k as 'init' | 'products' | 'tree' | 'stats')}
        items={[
          {
            key: 'init',
            label: '1. 凭证初始化',
            children: <KBCredentialForm onSubmit={handleInit} />,
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
                    <LoadingOutlined /> 生成中... ({jobStatus})
                  </div>
                )}
                {products.length === 0 && !polling && (
                  <Card>
                    <Paragraph>尚未生成产物。请先在「凭证初始化」标签完成配置，再点击「生成全部产物」按钮。</Paragraph>
                    <Button type="primary" onClick={handleGenerate} disabled={!kbId || !accessToken} loading={isLoading}>
                      生成全部产物
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
    </div>
  )
}

export default KMStudioPage
