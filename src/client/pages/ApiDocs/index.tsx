import { Card, Tabs, Space, Tag, Button, message } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { SectionTag, CodeBlock, Highlight } from '../../components/ai'
import { CopyOutlined } from '@ant-design/icons'

const apiExamples = {
  'kb-info': {
    title: '获取知识库信息',
    method: 'POST',
    endpoint: '/api/kb/info',
    request: `{
  "kbId": "13469"
}`,
    response: `{
  "code": 1,
  "msg": "success",
  "data": [...]
}`,
  },
  'kb-tree': {
    title: '获取目录树',
    method: 'POST',
    endpoint: '/api/kb/tree',
    request: `{
  "kbId": "13469",
  "parentId": 0
}`,
    response: `{
  "code": 1,
  "msg": "success",
  "data": [...]
}`,
  },
  'kb-content': {
    title: '获取文档内容',
    method: 'POST',
    endpoint: '/api/kb/content',
    request: `{
  "kbId": "13469",
  "contentIds": [1, 2, 3],
  "contentType": "markdown"
}`,
    response: `{
  "code": 1,
  "msg": "success",
  "data": {
    "type": "markdown",
    "content": [...]
  }
}`,
  },
}

export function ApiDocs() {
  const items = Object.entries(apiExamples).map(([key, api]) => ({
    key,
    label: api.title,
    children: (
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card
          title={
            <Space>
              <span>请求信息</span>
              <Tag color="blue">{api.method}</Tag>
              <code style={{ color: 'var(--accent-green)' }}>{api.endpoint}</code>
            </Space>
          }
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <p style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>Headers:</strong>
          </p>
          <CodeBlock
            language="headers"
            code={`X-API-Key: your-api-key\nX-KB-ID: 13469\nContent-Type: application/json`}
          />
        </Card>

        <Card
          title={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>请求示例</span>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(api.request)
                  message.success('已复制请求示例')
                }}
              >
                复制
              </Button>
            </Space>
          }
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <CodeBlock language="request · json" code={api.request} />
        </Card>

        <Card
          title={
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <span>响应示例</span>
              <Button
                size="small"
                icon={<CopyOutlined />}
                onClick={() => {
                  navigator.clipboard.writeText(api.response)
                  message.success('已复制响应示例')
                }}
              >
                复制
              </Button>
            </Space>
          }
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <CodeBlock language="response · json" code={api.response} />
          <div style={{ marginTop: 12 }}>
            <Highlight color="blue">Tip:</Highlight>{' '}
            <span style={{ color: 'var(--text-secondary)' }}>
              所有响应均包含 code/msg/data 三段，code=1 表示成功
            </span>
          </div>
        </Card>
      </Space>
    ),
  }))

  return (
    <div>
      <PageHeader title="API 文档" subTitle="KM-Portal API 调用文档 · 深色代码块 + 一键复制" />
      <div style={{ marginBottom: 12 }}>
        <SectionTag index="01" label="接口列表" englishLabel="API Reference" />
      </div>
      <Tabs defaultActiveKey="kb-info" items={items} />
    </div>
  )
}
