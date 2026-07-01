import { Card, Tabs } from 'antd'
import { PageHeader } from '../../components/PageHeader'

const apiExamples = {
  'kb-info': {
    title: '获取知识库信息',
    method: 'POST',
    endpoint: '/api/kb/info',
    request: `{
  "kb_id": "13469"
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
  "kb_id": "13469",
  "parent_id": 0
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
  "kb_id": "13469",
  "content_ids": [1, 2, 3],
  "content_type": "markdown"
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
      <>
        <Card title="请求信息" style={{ marginBottom: 16 }}>
          <p><strong>Method:</strong> {api.method}</p>
          <p><strong>Endpoint:</strong> {api.endpoint}</p>
          <p><strong>Headers:</strong></p>
          <pre style={{ background: '#f5f5f5', padding: 8 }}>
{`X-API-Key: your-api-key
X-KB-ID: 13469
Content-Type: application/json`}
          </pre>
        </Card>
        <Card title="请求示例" style={{ marginBottom: 16 }}>
          <pre style={{ background: '#f5f5f5', padding: 16 }}>
            {api.request}
          </pre>
        </Card>
        <Card title="响应示例">
          <pre style={{ background: '#f5f5f5', padding: 16 }}>
            {api.response}
          </pre>
        </Card>
      </>
    ),
  }))

  return (
    <div>
      <PageHeader title="API 文档" subTitle="KM-Portal API 调用文档" />
      <Tabs defaultActiveKey="kb-info" items={items} />
    </div>
  )
}
