import { useState, useEffect } from 'react'
import { Input, Button, message, Form, Select, Space, Table, Modal, Popconfirm } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { DataState } from '../../components/DataState'
import { skillApi, GeneratedSkill } from '../../services/skill'

const { TextArea } = Input

export function SkillGen() {
  const [skills, setSkills] = useState<GeneratedSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [generating, setGenerating] = useState(false)
  const [generatedSkill, setGeneratedSkill] = useState<GeneratedSkill | null>(null)

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = () => {
    setLoading(true)
    skillApi.list()
      .then((res) => {
        if (res.success && res.data) {
          setSkills(res.data)
        } else {
          message.error(res.error || res.message || '加载失败')
        }
      })
      .catch((err: Error) => {
        console.error('[SkillGen] loadSkills error:', err)
        message.error(`加载失败: ${err.message}`)
      })
      .finally(() => setLoading(false))
  }

  const handleCreate = async () => {
    let translateHide: (() => void) | null = null
    try {
      const values = await form.validateFields()
      setGenerating(true)
      translateHide = message.loading('正在翻译知识库名...', 0)
      const res = await skillApi.create({
        name: values.name,
        description: values.description,
        kbId: Number(values.kbId),
        kbName: values.kbName,
        permission: values.permission,
      })
      if (res.success && res.data) {
        setGeneratedSkill(res.data)
        message.success(`Skill 生成成功：${res.data.name}`)
        setModalVisible(false)
        form.resetFields()
        loadSkills()
      }
    } catch (err) {
      message.error((err as Error).message || '生成失败')
    } finally {
      if (translateHide) translateHide()
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await skillApi.delete(id)
      message.success('删除成功')
      loadSkills()
    } catch (err) {
      message.error((err as Error).message || '删除失败')
    }
  }

  const handleExport = async (skill: GeneratedSkill) => {
    try {
      const res = await skillApi.export(skill.id)
      const blob = new Blob([res.data], { type: 'application/zip' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kb-${skill.name.toLowerCase().replace(/\s+/g, '-')}-v1.0.0.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      message.success('Skill 安装包已导出')
    } catch (err) {
      message.error((err as Error).message || '导出失败')
    }
  }

  const columns = [
    { title: '英文名', dataIndex: 'name', key: 'name' },
    { title: '原始名称', dataIndex: 'nameOriginal', key: 'nameOriginal', render: (v: string) => v || '-' },
    { title: '知识库', dataIndex: 'kbName', key: 'kbName' },
    { title: 'KB ID', dataIndex: 'kbId', key: 'kbId' },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      render: (perm: string) => (
        <span style={{ color: perm === 'write' ? '#1890ff' : '#52c41a' }}>
          {perm === 'write' ? '编辑' : '查询'}
        </span>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: GeneratedSkill) => (
        <Space>
          <Button size="small" onClick={() => setGeneratedSkill(record)}>查看</Button>
          <Button size="small" onClick={() => handleExport(record)}>导出</Button>
          <Popconfirm title="确定删除？" onConfirm={() => handleDelete(record.id)}>
            <Button size="small" danger type="link">删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Skill 生成" subTitle="生成知识库运营助手" />
      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => setModalVisible(true)}>生成新 Skill</Button>
      </div>
      <DataState loading={loading} empty={skills.length === 0} emptyText="暂无 Skill">
        <Table columns={columns} dataSource={skills} rowKey="id" />
      </DataState>

      <Modal
        title="生成新 Skill"
        open={modalVisible}
        onOk={handleCreate}
        onCancel={() => setModalVisible(false)}
        confirmLoading={generating}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="Skill 名称" rules={[{ required: true }]}>
            <Input placeholder="输入 Skill 名称" />
          </Form.Item>
          <Form.Item name="kbId" label="KB ID" rules={[{
            required: true,
            validator: (_: unknown, value: string) => {
              if (!value) return Promise.reject('KB ID 不能为空');
              const num = Number(value);
              if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
                return Promise.reject('KB ID 必须是正整数');
              }
              return Promise.resolve();
            },
            trigger: 'blur',
          }]}>
            <Input type="number" placeholder="输入 KB ID" />
          </Form.Item>
          <Form.Item name="kbName" label="知识库名称" rules={[{ required: true }]}>
            <Input placeholder="输入知识库名称" />
          </Form.Item>
          <Form.Item name="permission" label="权限" initialValue="read">
            <Select>
              <Select.Option value="read">查询权限</Select.Option>
              <Select.Option value="write">编辑权限</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="输入 Skill 描述" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={generatedSkill?.name || 'Skill 内容'}
        open={!!generatedSkill}
        onCancel={() => setGeneratedSkill(null)}
        footer={[
          <Button key="copy" onClick={() => {
            navigator.clipboard.writeText(generatedSkill?.content || '')
            message.success('已复制')
          }}>复制</Button>,
          <Button key="close" type="primary" onClick={() => setGeneratedSkill(null)}>关闭</Button>,
        ]}
        width={800}
      >
        <pre style={{ background: '#f5f5f5', padding: 16, overflow: 'auto', maxHeight: 500 }}>
          {generatedSkill?.content}
        </pre>
      </Modal>
    </div>
  )
}