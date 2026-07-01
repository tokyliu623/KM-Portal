import { useEffect, useState } from 'react'
import { Input, Button, Card, message, Select, Form, Space, Radio } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { DataState } from '../../components/DataState'
import { SectionTag, Highlight, PulseDot } from '../../components/ai'
import { kbApi, KBDocument } from '../../services/kb'
import { adminApi, KMToken } from '../../services/admin'

const { TextArea } = Input

type Mode = 'create' | 'edit'

export function DocEditor() {
  const [mode, setMode] = useState<Mode>('create')
  const [tokens, setTokens] = useState<KMToken[]>([])
  const [kbId, setKbId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('markdown')
  const [parentId, setParentId] = useState<number | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [docs, setDocs] = useState<KBDocument[]>([])
  const [selectedDocId, setSelectedDocId] = useState<string | undefined>(undefined)
  const [editingDoc, setEditingDoc] = useState<KBDocument | null>(null)
  const [docsLoading, setDocsLoading] = useState(false)

  useEffect(() => {
    adminApi.listTokens().then((res) => {
      if (res.success && res.data) setTokens(res.data)
    })
  }, [])

  useEffect(() => {
    if (mode !== 'edit' || !kbId) {
      setDocs([])
      setSelectedDocId(undefined)
      setEditingDoc(null)
      return
    }
    setDocsLoading(true)
    kbApi.listDocuments(kbId)
      .then((res) => {
        if (res.success && res.data) setDocs(res.data.documents || [])
      })
      .catch(() => setDocs([]))
      .finally(() => setDocsLoading(false))
  }, [mode, kbId])

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId)
    const doc = docs.find((d) => d.id === docId) || null
    setEditingDoc(doc)
    if (doc) {
      setTitle(doc.title)
      setContent(doc.content)
    }
  }

  const resetForm = () => {
    setTitle('')
    setContent('')
    setSelectedDocId(undefined)
    setEditingDoc(null)
    setParentId(undefined)
  }

  const handlePublish = async () => {
    if (!kbId) {
      message.warning('请选择知识库')
      return
    }
    if (!title || !content) {
      message.warning('请填写完整信息')
      return
    }
    setLoading(true)
    try {
      if (mode === 'create') {
        const res = await kbApi.createContent(kbId, title, contentType, content, parentId)
        if (res.success) {
          message.success('发布成功')
          resetForm()
        } else {
          message.error(res.msg || '发布失败')
        }
      } else {
        if (!editingDoc) {
          message.warning('请先选择要编辑的文档')
          setLoading(false)
          return
        }
        const res = await kbApi.updateContent(kbId, Number(editingDoc.id), title, contentType, content)
        if (res.success) {
          message.success('更新成功')
          if (kbId) {
            const refreshed = await kbApi.listDocuments(kbId)
            if (refreshed.success && refreshed.data) setDocs(refreshed.data.documents || [])
          }
        } else {
          message.error(res.msg || '更新失败')
        }
      }
    } catch (err) {
      message.error((err as Error).message || (mode === 'create' ? '发布失败' : '更新失败'))
    } finally {
      setLoading(false)
    }
  }

  const kbOptions = tokens.map((t) => ({
    label: `${t.kb_name} (KB ${t.kb_id})`,
    value: String(t.kb_id),
  }))

  return (
    <div>
      <PageHeader title="文档编辑器" subTitle="新建或编辑知识库文档 · AI 助手驱动" />
      <div style={{ marginBottom: 12 }}>
        <SectionTag index="01" label="文档编辑" englishLabel="Doc Editor" />
        <span style={{ marginLeft: 12 }}>
          <Highlight color="purple">AI 助手</Highlight>
        </span>
        <span style={{ marginLeft: 12 }}>
          <PulseDot color="green" label="在线" />
        </span>
      </div>
      <Card style={{ marginBottom: 16 }}>
        <Radio.Group
          value={mode}
          onChange={(e) => {
            setMode(e.target.value)
            resetForm()
          }}
          style={{ marginBottom: 16 }}
        >
          <Radio.Button value="create">新建文档</Radio.Button>
          <Radio.Button value="edit">编辑已有文档</Radio.Button>
        </Radio.Group>

        <Form layout="vertical">
          <Form.Item label="知识库" required>
            <Select
              placeholder="选择知识库（来自您有写权限的 Token）"
              value={kbId || undefined}
              onChange={(v) => {
                setKbId(v)
                resetForm()
              }}
              options={kbOptions}
              showSearch
              optionFilterProp="label"
              style={{ maxWidth: 400 }}
            />
          </Form.Item>

          {mode === 'edit' && (
            <Form.Item label="选择文档" required>
              <DataState loading={docsLoading} empty={!docsLoading && docs.length === 0} emptyText="该知识库暂无文档">
                <Select
                  placeholder="选择要编辑的文档"
                  value={selectedDocId}
                  onChange={handleSelectDoc}
                  options={docs.map((d) => ({ label: d.title, value: d.id }))}
                  showSearch
                  optionFilterProp="label"
                  style={{ maxWidth: 400 }}
                />
              </DataState>
            </Form.Item>
          )}

          {mode === 'create' && (
            <Form.Item label="父文档 ID（可选）">
              <Input
                type="number"
                placeholder="留空表示根目录"
                value={parentId ?? ''}
                onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : undefined)}
                style={{ maxWidth: 300 }}
              />
            </Form.Item>
          )}

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
          <Space>
            <Button type="primary" onClick={handlePublish} loading={loading}>
              {mode === 'create' ? '发布文档' : '保存修改'}
            </Button>
            <Button onClick={resetForm}>重置</Button>
          </Space>
        </Form>
      </Card>
    </div>
  )
}
