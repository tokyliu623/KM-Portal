import { useState } from 'react'
import { Input, Button, Card, message, Select, Form } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { kbApi } from '../../services/kb'

const { TextArea } = Input

export function DocEditor() {
  const [kbId, setKbId] = useState('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('markdown')
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    if (!kbId || !title || !content) {
      message.warning('请填写完整信息')
      return
    }
    setLoading(true)
    try {
      const res = await kbApi.createContent(kbId, title, contentType, content)
      if (res.success) {
        message.success('发布成功')
        setTitle('')
        setContent('')
      } else {
        message.error(res.msg || '发布失败')
      }
    } catch (err) {
      message.error((err as Error).message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="文档编辑器" subTitle="编辑和发布文档" />
      <Card>
        <Form layout="vertical">
          <Form.Item label="知识库 ID" required>
            <Input
              placeholder="输入 KB ID"
              value={kbId}
              onChange={(e) => setKbId(e.target.value)}
              style={{ maxWidth: 300 }}
            />
          </Form.Item>
          <Form.Item label="文档标题" required>
            <Input
              placeholder="输入文档标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ maxWidth: 500 }}
            />
          </Form.Item>
          <Form.Item label="内容类型">
            <Select
              value={contentType}
              onChange={setContentType}
              style={{ width: 150 }}
            >
              <Select.Option value="markdown">Markdown</Select.Option>
              <Select.Option value="html">HTML</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="文档内容" required>
            <TextArea
              rows={15}
              placeholder="输入文档内容"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Form.Item>
          <Button type="primary" onClick={handlePublish} loading={loading}>
            发布文档
          </Button>
        </Form>
      </Card>
    </div>
  )
}