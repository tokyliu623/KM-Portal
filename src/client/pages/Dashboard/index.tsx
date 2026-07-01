import { useEffect } from 'react'
import { message, Button, Space } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { useStatsStore } from '../../stores/useStatsStore'
import { statsApi } from '../../services/stats'
import { useNavigate } from 'react-router-dom'
import { RocketOutlined, RiseOutlined, DatabaseOutlined, ThunderboltOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { KpiCard, AgentCard, SectionTag, FlowNode, FlowArrow, CodeBlock } from '../../components/ai'

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
          l7 = { total: overviewRes.data.totalCalls, avgLatency: 0 } as never
        }
        if (daily7Res.success && daily7Res.data) {
          l7 = daily7Res.data as never
        }
        if (daily30Res.success && daily30Res.data) {
          l30 = daily30Res.data as never
        }
        setStats(l7 as never, l30 as never)
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

  const total7 = (last7Days as { total?: number })?.total || 0
  const total30 = (last30Days as { total?: number })?.total || 0
  const avg7 = (last7Days as { avgLatency?: number })?.avgLatency || 0
  const dailyAvg = Math.round(total7 / 7)

  return (
    <div>
      <PageHeader
        title="仪表盘"
        subTitle="Knowledge Operations Hub · AI 驱动"
        extra={
          <Button type="primary" icon={<RocketOutlined />} onClick={() => navigate('/km-studio')}>
            进入 KM Studio
          </Button>
        }
      />

      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* KPI 卡片组 */}
        <div>
          <SectionTag index={1} label="核心指标" englishLabel="Key Metrics" />
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 16,
              marginTop: 12,
            }}
          >
            <KpiCard
              title="7天总调用"
              value={total7.toLocaleString()}
              unit="次"
              trend={{ value: 23, isUp: true }}
              icon={<RiseOutlined />}
              color="blue"
            />
            <KpiCard
              title="活跃 Token"
              value="-"
              unit="个"
              icon={<DatabaseOutlined />}
              color="green"
            />
            <KpiCard
              title="7天日均"
              value={dailyAvg.toLocaleString()}
              unit="次"
              icon={<ThunderboltOutlined />}
              color="orange"
            />
            <KpiCard
              title="平均延迟"
              value={avg7}
              unit="ms"
              trend={{ value: 15, isUp: false }}
              icon={<ClockCircleOutlined />}
              color="purple"
            />
          </div>
        </div>

        {/* Agent 流程图 */}
        <div>
          <SectionTag index={2} label="Agent 调用流" englishLabel="Agent Flow" />
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: 24,
              marginTop: 12,
              overflowX: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 'fit-content' }}>
              <FlowNode color="blue" title="用户" subtitle="User Query" icon="👤" />
              <FlowArrow label="请求" />
              <FlowNode color="blue" title="KM Portal" subtitle="API Gateway" icon="🚪" />
              <FlowArrow label="路由" />
              <FlowNode color="green" title="Agent 调度" subtitle="Orchestrator" icon="🤖" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, minWidth: 'fit-content' }}>
              <div style={{ width: 80 }} />
              <FlowArrow direction="down" />
              <div style={{ width: 80 }} />
              <FlowArrow direction="down" />
              <FlowNode color="orange" title="KB 检索" subtitle="Knowledge Base" icon="📚" />
              <FlowArrow label="匹配" />
              <FlowNode color="purple" title="Skill 加载" subtitle="Skill Engine" icon="⚡" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, minWidth: 'fit-content' }}>
              <div style={{ width: 280 }} />
              <FlowNode color="green" title="产物生成" subtitle="Generate" icon="✨" />
              <FlowArrow label="返回" />
              <FlowNode color="blue" title="用户" subtitle="Response" icon="📤" />
            </div>
          </div>
        </div>

        {/* 时间线 */}
        <div>
          <SectionTag index={3} label="调用时间线" englishLabel="7-Day Timeline" />
          <AgentCard title={`近 7 天总计 ${total7.toLocaleString()} 次`} variant="main">
            <CodeBlock
              language="最近 7 天"
              code={`总调用: ${total7.toLocaleString()}\n日均: ${dailyAvg.toLocaleString()}\n近 30 天: ${total30.toLocaleString()} 次`}
            />
          </AgentCard>
        </div>
      </Space>
    </div>
  )
}
