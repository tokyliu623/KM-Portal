import { useEffect, useState, useRef } from 'react'
import { Card, Row, Col, Select, Table, Statistic, Tag, Space, message, Button } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { statsApi, type BySkillStats } from '../../services/stats'
import { skillApi, type GeneratedSkill } from '../../services/skill'
import { useNavigate } from 'react-router-dom'
import { ReloadOutlined, BarChartOutlined } from '@ant-design/icons'
import * as echarts from 'echarts'

export function Stats() {
  const [skills, setSkills] = useState<GeneratedSkill[]>([])
  const [skillName, setSkillName] = useState<string | undefined>()
  const [kbId, setKbId] = useState<string | undefined>()
  const [days, setDays] = useState<number>(7)
  const [data, setData] = useState<BySkillStats | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    skillApi.list().then((res) => {
      if (res.success && res.data) setSkills(res.data)
    })
  }, [])

  const loadStats = () => {
    setLoading(true)
    statsApi.getBySkill({ skillName, kbId, days })
      .then((res) => {
        if (res.success && res.data) setData(res.data)
        else message.error(res.error || '加载失败')
      })
      .catch((err: Error) => message.error(`加载失败: ${err.message}`))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadStats()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadStats 闭包依赖 skillName/kbId/days 已在依赖列表
  }, [skillName, kbId, days])

  const kbIdOptions = Array.from(new Set(skills.map((s) => s.kbId))).map((id) => ({
    label: `KB ${id}`,
    value: String(id),
  }))

  const skillOptions = skills.map((s) => ({ label: s.name, value: s.name }))

  return (
    <div>
      <PageHeader
        title="调用统计（v1.9.0）"
        subTitle="按 Skill 名称 + KB ID 双维度分析 Skill 调用情况"
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadStats}>刷新</Button>
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/dashboard')}>返回仪表盘</Button>
          </Space>
        }
      />

      <Card style={{ marginBottom: 16 }}>
        <Space wrap size="middle">
          <div>
            <span style={{ marginRight: 8 }}>Skill 名称:</span>
            <Select
              placeholder="全部 Skill"
              allowClear
              style={{ width: 240 }}
              value={skillName}
              onChange={setSkillName}
              options={skillOptions}
              showSearch
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>KB ID:</span>
            <Select
              placeholder="全部 KB"
              allowClear
              style={{ width: 180 }}
              value={kbId}
              onChange={setKbId}
              options={kbIdOptions}
            />
          </div>
          <div>
            <span style={{ marginRight: 8 }}>时间范围:</span>
            <Select
              value={days}
              onChange={setDays}
              style={{ width: 120 }}
              options={[
                { label: '近 7 天', value: 7 },
                { label: '近 30 天', value: 30 },
              ]}
            />
          </div>
        </Space>
      </Card>

      {loading && !data ? (
        <Loading />
      ) : data ? (
        <>
          <Row gutter={16} style={{ marginBottom: 16 }}>
            <Col span={6}>
              <Card>
                <Statistic title="总调用次数" value={data.total} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="平均延迟" value={data.avgLatency} suffix="ms" />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="错误率" value={data.errorRate} suffix="%" valueStyle={{ color: data.errorRate > 5 ? '#f5222d' : '#52c41a' }} />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic title="活跃 Skill 数" value={data.skills.length} />
              </Card>
            </Col>
          </Row>

          <BarChartCard
            title="按 Skill 名称统计（柱状图）"
            data={data.skills.map((s) => ({ name: s.skillName || '(unassigned)', value: s.calls }))}
            empty={data.skills.length === 0}
          />

          <Card title="Skill 调用详情" style={{ marginTop: 16 }}>
            {data.skills.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
                暂无调用记录。生成 Skill 并下载 zip 后调用 KM-Portal 代理即可看到统计。
              </div>
            ) : (
              <Table
                dataSource={data.skills.map((s) => ({ ...s, key: s.skillName }))}
                columns={[
                  { title: 'Skill 名称', dataIndex: 'skillName' },
                  { title: '调用次数', dataIndex: 'calls', sorter: (a, b) => a.calls - b.calls, defaultSortOrder: 'descend' },
                  { title: '平均延迟 (ms)', dataIndex: 'avgLatency' },
                  {
                    title: '错误率',
                    dataIndex: 'errorRate',
                    render: (v: number) => v > 5 ? <Tag color="red">{v}%</Tag> : <Tag color="green">{v}%</Tag>,
                  },
                ]}
                pagination={false}
                size="middle"
              />
            )}
          </Card>

          <Card title="按端点统计" style={{ marginTop: 16 }}>
            {Object.keys(data.byEndpoint || {}).length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无端点数据</div>
            ) : (
              <Table
                dataSource={Object.entries(data.byEndpoint).map(([path, calls]) => ({ path, calls, key: path }))}
                columns={[
                  { title: '端点路径', dataIndex: 'path' },
                  { title: '调用次数', dataIndex: 'calls', sorter: (a, b) => a.calls - b.calls, defaultSortOrder: 'descend' },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </>
      ) : null}
    </div>
  )
}

interface BarChartCardProps {
  title: string
  data: Array<{ name: string; value: number }>
  empty: boolean
}

function BarChartCard({ title, data, empty }: BarChartCardProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (empty || !chartRef.current) return
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark')
    }
    chartInstance.current.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: 120, right: 60, top: 16, bottom: 16 },
      xAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: 'rgba(59,130,246,0.3)' } },
        splitLine: { lineStyle: { color: 'rgba(59,130,246,0.1)' } },
      },
      yAxis: {
        type: 'category',
        data: data.map((d) => d.name),
        axisLine: { lineStyle: { color: 'rgba(59,130,246,0.3)' } },
        axisLabel: { color: '#9ca3af', fontSize: 12 },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d, i) => ({
            value: d.value,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 1, y2: 0,
                colorStops: [
                  { offset: 0, color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5] + '99' },
                  { offset: 1, color: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'][i % 5] },
                ],
              },
              borderRadius: [0, 4, 4, 0],
            },
          })),
          barWidth: 16,
          label: { show: true, position: 'right', color: '#e5e7eb', fontSize: 11 },
        },
      ],
    })
    const onResize = () => chartInstance.current?.resize()
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [data, empty])

  useEffect(() => {
    return () => {
      chartInstance.current?.dispose()
      chartInstance.current = null
    }
  }, [])

  if (empty) {
    return (
      <Card title={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>暂无数据</div>
      </Card>
    )
  }

  return (
    <Card title={title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div ref={chartRef} style={{ width: '100%', height: Math.max(180, data.length * 32) }} />
    </Card>
  )
}
