import { useState, useEffect } from 'react'
import { Card, Input, Button, message, Form, Select, Space, Table, Modal, Popconfirm } from 'antd'
import { PageHeader } from '../../components/PageHeader'
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
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }

  const handleCreate = async () => {
    try {
      const values = await form.validateFields()
      setGenerating(true)
      const res = await skillApi.create({
        name: values.name,
        description: values.description,
        kbId: Number(values.kbId),
        kbName: values.kbName,
        permission: values.permission,
      })
      if (res.success && res.data) {
        setGeneratedSkill(res.data)
        message.success('Skill 生成成功')
        setModalVisible(false)
        form.resetFields()
        loadSkills()
      }
    } catch {
      message.error('生成失败')
    } finally {
      setGenerating(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await skillApi.delete(id)
      message.success('删除成功')
      loadSkills()
    } catch {
      message.error('删除失败')
    }
  }

  const handleExport = async (skill: GeneratedSkill) => {
    try {
      const res = await skillApi.export(skill.id)
      const blob = new Blob([skill.content], { type: 'text/markdown' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${skill.name.replace(/[^a-z0-9]/gi, '_')}.md`
      a.click()
      URL.revokeObjectURL(url)
      message.success('导出成功')
    } catch {
      message.error('导出失败')
    }
  }

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '知识库', dataIndex: 'kbName', key: 'kbName' },
    { title: 'KB ID', dataIndex: 'kbId', key: 'kbId', render: (id: number) => id },
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
      render: (_: any, record: GeneratedSkill) => (
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
      <Table columns={columns} dataSource={skills} rowKey="id" loading={loading} />

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
          <Form.Item name="kbId" label="KB ID" rules={[{ required: true, type: 'number' }]}>
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