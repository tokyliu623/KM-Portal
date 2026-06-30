import { Card, Typography, Button, Space, Result } from 'antd'
import { StatsPanel } from '../components/StatsPanel'
import { useWizardStore } from '../hooks/useWizard'
import api from '../../../services/api'
import type { ApiResponse } from '../../../services/wizard'
import { useState, useEffect } from 'react'

const { Title, Text } = Typography

interface KBStats {
  totalCalls: number
  avgLatency: number
  last7Days: number
  last30Days: number
}

export function AnalyzeStage() {
  const {
    credential,
    kbInfo,
    docCount,
    tree,
    setStage,
    reset,
  } = useWizardStore()

  const [stats, setStats] = useState<KBStats | null>(null)

  useEffect(() => {
    fetchStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credential?.kbId])

  const fetchStats = async () => {
    if (!credential) return
    try {
      // v1.8.6: api.get 仍返 AxiosResponse,需要 .then unwrap
      const res = await api.get<ApiResponse<KBStats>>(`/stats/kb/${credential.kbId}`).then(r => r.data)
      if (res.success && res.data) {
        setStats(res.data)
      }
    } catch {
      setStats({
        totalCalls: 0,
        avgLatency: 0,
        last7Days: 0,
        last30Days: 0,
      })
    }
  }

  const handleBack = () => {
    setStage('generate')
  }

  const handleRestart = () => {
    reset()
  }

  if (!credential || !kbInfo) {
    return (
      <Result
        status="warning"
        title="缺少数据"
        subTitle="请先完成前面的步骤"
        extra={
          <Button type="primary" onClick={handleRestart}>
            重新开始
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <Card style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={4}>运营分析</Title>
        <Text type="secondary">
          查看知识库的运营数据和效果指标
        </Text>
      </Card>

      <StatsPanel
        kbId={credential.kbId}
        kbName={credential.kbName}
        docCount={docCount}
        treeCount={tree.length}
        recentCalls={stats?.last7Days || 0}
        avgLatency={stats?.avgLatency || 0}
      />

      <Card style={{ marginTop: 24 }}>
        <Space>
          <Button onClick={handleBack}>返回上一步</Button>
          <Button type="primary" onClick={handleRestart}>
            开始新向导
          </Button>
        </Space>
      </Card>
    </div>
  )
}