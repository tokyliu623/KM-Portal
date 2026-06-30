import { Card, Row, Col, Statistic, Progress, Typography } from 'antd'
import {
  FileTextOutlined,
  FolderOutlined,
  ClockCircleOutlined,
  RiseOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface StatsPanelProps {
  kbId: string
  // v1.8.6: 所有 props 改为可选,KMStudioPage 只传 kbId 也能编译通过
  kbName?: string
  docCount?: number
  treeCount?: number
  recentCalls?: number
  avgLatency?: number
}

export function StatsPanel({
  kbId,
  kbName = '',
  docCount = 0,
  treeCount = 0,
  recentCalls = 0,
  avgLatency = 0,
}: StatsPanelProps) {
  return (
    <Card title="运营统计">
      <Row gutter={16}>
        <Col span={6}>
          <Statistic
            title="知识库 ID"
            value={kbId}
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="知识库名称"
            value={kbName}
            prefix={<FolderOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="文档数量"
            value={docCount}
            suffix="篇"
            prefix={<FileTextOutlined />}
          />
        </Col>
        <Col span={6}>
          <Statistic
            title="目录节点"
            value={treeCount}
            suffix="个"
            prefix={<FolderOutlined />}
          />
        </Col>
      </Row>
      <Row gutter={16} style={{ marginTop: 24 }}>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="近7天调用"
              value={recentCalls}
              prefix={<RiseOutlined />}
              suffix="次"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Statistic
              title="平均延迟"
              value={avgLatency}
              prefix={<ClockCircleOutlined />}
              suffix="ms"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small">
            <Text type="secondary">健康度</Text>
            <Progress
              percent={recentCalls > 0 ? 85 : 50}
              status={recentCalls > 0 ? 'success' : 'normal'}
              size="small"
            />
          </Card>
        </Col>
      </Row>
    </Card>
  )
}