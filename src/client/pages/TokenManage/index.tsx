import { Table, Button, Space, Tag, message, Form, Input, Select, Popconfirm, Modal, DatePicker } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { DataState } from '../../components/DataState'
import { SectionTag, PulseDot, Highlight } from '../../components/ai'
import { useTokenStore } from '../../stores/useTokenStore'
import { useEffect, useState } from 'react'
import { adminApi, KMToken } from '../../services/admin'

export function TokenManage() {
  const { tokens, loading, setTokens, setLoading } = useTokenStore()
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()
  const [editVisible, setEditVisible] = useState(false)
  const [editingToken, setEditingToken] = useState<KMToken | null>(null)

  useEffect(() => {
    loadTokens()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 组件挂载时拉取一次；loadTokens 引用 zustand setLoading 稳定方法
  }, [])

  const loadTokens = () => {
    setLoading(true)
    adminApi.listTokens()
      .then((res) => {
        if (res.success && res.data) {
          setTokens(res.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  const handleRevoke = async (id: string) => {
    try {
      await adminApi.revokeToken(id)
      message.success('撤销成功')
      loadTokens()
    } catch (err) {
      message.error((err as Error).message || '撤销失败')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminApi.deleteToken(id)
      message.success('删除成功')
      loadTokens()
    } catch (err) {
      message.error((err as Error).message || '删除失败')
    }
  }

  const handleAdd = async () => {
    try {
      const values = await form.validateFields()
      await adminApi.createToken({
        kb_id: Number(values.kb_id),
        kb_name: values.kb_name,
        token: values.token,
        owner: values.owner,
        permission: values.permission || 'read',
        expiresAt: values.expiresAt ? values.expiresAt.toISOString() : undefined,
      })
      message.success('添加成功')
      form.resetFields()
      loadTokens()
    } catch (err) {
      message.error((err as Error).message || '添加失败')
    }
  }

  const handleEdit = (record: KMToken) => {
    setEditingToken(record)
    editForm.setFieldsValue({
      name: record.kb_name,
      kbId: record.kb_id,
      kbName: record.kb_name,
      status: record.status,
    })
    setEditVisible(true)
  }

  const handleEditSave = async () => {
    try {
      const values = await editForm.validateFields()
      if (!editingToken) return
      await adminApi.updateToken(editingToken.id, {
        kb_name: values.name,
        kb_id: Number(values.kbId),
        status: values.status,
      })
      message.success('更新成功')
      setEditVisible(false)
      loadTokens()
    } catch (err) {
      message.error((err as Error).message || '更新失败')
    }
  }

  const columns = [
    { title: '知识库', dataIndex: 'kb_name', key: 'kb_name' },
    { title: 'KB ID', dataIndex: 'kb_id', key: 'kb_id' },
    { title: '所有者', dataIndex: 'owner', key: 'owner' },
    {
      title: '权限',
      dataIndex: 'permission',
      key: 'permission',
      render: (perm: string) => (
        <Tag color={perm === 'write' ? 'blue' : 'green'}>
          {perm === 'write' ? '编辑' : '查询'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '有效' : '已撤销'}
        </Tag>
      ),
    },
    {
      title: '过期时间',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: unknown, record: KMToken) => (
        <Space>
          <Button size="small" onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' && (
            <Popconfirm
              title="确定撤销此 Token？"
              onConfirm={() => handleRevoke(record.id)}
            >
              <Button size="small" danger>撤销</Button>
            </Popconfirm>
          )}
          <Popconfirm
            title="确定删除此 Token？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" type="link" danger>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Token 管理" subTitle="管理知识库访问凭证 · 凭据健康度实时监控" />

      {/* 凭据健康度仪表 */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: 16,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        <SectionTag index={1} label="凭据健康度" englishLabel="Credential Health" />
        <Space size="large">
          <span>
            <PulseDot color="green" label={`有效 ${tokens.filter(t => t.status === 'active').length}`} />
          </span>
          <span>
            <PulseDot color="red" label={`已撤销 ${tokens.filter(t => t.status === 'revoked').length}`} />
          </span>
          <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            <Highlight color="blue">总 {tokens.length}</Highlight> 条记录
          </span>
        </Space>
      </div>

      <div style={{ marginBottom: 16 }}>
        <Button type="primary" onClick={() => form.submit()}>添加 Token</Button>
      </div>
      <Form form={form} layout="inline" onFinish={handleAdd} style={{ marginBottom: 16 }}>
        <Form.Item name="kb_name" label="知识库名称" rules={[{ required: true }]}>
          <Input placeholder="知识库名称" />
        </Form.Item>
        <Form.Item name="kb_id" label="KB ID" rules={[{
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
          <Input type="number" placeholder="KB ID" />
        </Form.Item>
        <Form.Item name="token" label="Token" rules={[{ required: true }]}>
          <Input placeholder="KM Token" />
        </Form.Item>
        <Form.Item name="owner" label="所有者" rules={[{ required: true }]}>
          <Input placeholder="工号" />
        </Form.Item>
        <Form.Item name="permission" label="权限" initialValue="read">
          <Select style={{ width: 120 }}>
            <Select.Option value="read">查询</Select.Option>
            <Select.Option value="write">编辑</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name="expiresAt" label="过期时间">
          <DatePicker
            showTime
            placeholder="选择过期时间"
            style={{ width: 240 }}
          />
        </Form.Item>
      </Form>
      <DataState loading={loading} empty={tokens.length === 0} emptyText="暂无 Token">
        <Table columns={columns} dataSource={tokens} rowKey="id" />
      </DataState>

      <Modal
        title="编辑 Token"
        open={editVisible}
        onOk={handleEditSave}
        onCancel={() => setEditVisible(false)}
      >
        <Form form={editForm} layout="vertical">
          <Form.Item name="name" label="知识库名称" rules={[{ required: true }]}>
            <Input placeholder="知识库名称" />
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
            <Input type="number" placeholder="KB ID" />
          </Form.Item>
          <Form.Item name="status" label="状态" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="active">有效</Select.Option>
              <Select.Option value="revoked">已撤销</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}