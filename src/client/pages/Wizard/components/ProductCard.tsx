import { Card, Button, Typography, Space, Tag } from 'antd'
import {
  GiftOutlined,
  ApiOutlined,
  BulbOutlined,
  FileTextOutlined,
  FolderOutlined,
  DownloadOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons'
import type { ProductItem } from '../../../services/wizard'

const { Text } = Typography

const iconMap: Record<string, React.ReactNode> = {
  skill: <GiftOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
  mcp: <ApiOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
  // v1.8.6: 对齐服务端 WizardProduct.type = 'ai_template' | 'tree'
  ai_template: <BulbOutlined style={{ fontSize: 32, color: '#faad14' }} />,
  openapi: <FileTextOutlined style={{ fontSize: 32, color: '#f5222d' }} />,
  tree: <FolderOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
}

const typeNameMap: Record<string, string> = {
  skill: 'Skill 安装包',
  mcp: 'MCP 配置',
  ai_template: 'AI 指令模板',
  openapi: 'OpenAPI 规范',
  tree: '目录结构',
}

const typeColorMap: Record<string, string> = {
  skill: 'blue',
  mcp: 'green',
  ai_template: 'gold',
  openapi: 'red',
  tree: 'purple',
}

interface ProductCardProps {
  product: ProductItem
  onDownload?: (product: ProductItem) => void
}

export function ProductCard({ product, onDownload }: ProductCardProps) {
  const handleDownload = () => {
    if (product.content) {
      const blob = new Blob([product.content], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${product.type}-${product.name.toLowerCase().replace(/\s+/g, '-')}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } else if (onDownload) {
      onDownload(product)
    }
  }

  return (
    <Card
      hoverable
      cover={
        <div
          style={{
            height: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#fafafa',
          }}
        >
          {iconMap[product.type] || <GiftOutlined style={{ fontSize: 32 }} />}
        </div>
      }
      actions={[
        <Button
          key="download"
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          disabled={!product.content && !product.downloadUrl}
        >
          下载
        </Button>,
      ]}
    >
      <Card.Meta
        title={
          <Space>
            {typeNameMap[product.type] || product.type}
            <Tag color={typeColorMap[product.type]}>{product.name}</Tag>
          </Space>
        }
        description={
          <Space direction="vertical" size={4}>
            <Text type="secondary">{product.description}</Text>
            {product.content && (
              <Text type="success" style={{ fontSize: 12 }}>
                <CheckCircleOutlined /> 已生成
              </Text>
            )}
          </Space>
        }
      />
    </Card>
  )
}