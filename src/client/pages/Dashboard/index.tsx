import { Card, Row, Col, Statistic, message, Button } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { useStatsStore } from '../../stores/useStatsStore'
import { useEffect } from 'react'
import { statsApi } from '../../services/stats'
import { useNavigate } from 'react-router-dom'
import { RocketOutlined } from '@ant-design/icons'

export function Dashboard() {
  const { last7Days, last30Days, loading, setStats, setLoading } = useStatsStore()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [overviewRes, daily7Res, daily30Res] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getDaily(7),
          statsApi.getDaily(30),
        ])
        let l7 = last7Days
        let l30 = last30Days
        if (overviewRes.success && overviewRes.data) {
          l7 = { total: overviewRes.data.totalCalls, avgLatency: 0 }
        }
        if (daily7Res.success && daily7Res.data) {
          l7 = daily7Res.data
        }
        if (daily30Res.success && daily30Res.data) {
          l30 = daily30Res.data
        }
        setStats(l7, l30)
      } catch (err: unknown) {
        message.error(`加载失败: ${err instanceof Error ? err.message : '未知错误'}`)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setStats/setLoading 为 zustand 稳定引用；overview/daily 7/30 不应在重渲染时重复触发
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader
        title="仪表盘"
        subTitle="知识库运营概览"
        extra={
          <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/wizard')}>
            快速开始向导
          </Button>
        }
      />
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="近7天调用次数" value={last7Days?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="近30天调用次数" value={last30Days?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="7天平均延迟" value={last7Days?.avgLatency || 0} suffix="ms" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="7天日均调用" value={Math.round((last7Days?.total || 0) / 7)} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}