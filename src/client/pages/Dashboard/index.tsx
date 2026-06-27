import { Card, Row, Col, Statistic } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { useStatsStore } from '../../stores/useStatsStore'
import { useEffect } from 'react'
import { statsApi } from '../../services/stats'

export function Dashboard() {
  const { last7Days, last30Days, loading, setStats, setLoading } = useStatsStore()

  useEffect(() => {
    setLoading(true)
    statsApi.getSummary()
      .then((res) => {
        if (res.code === 1) {
          setStats(res.data.last7Days, res.data.last30Days)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="仪表盘" subTitle="知识库运营概览" />
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