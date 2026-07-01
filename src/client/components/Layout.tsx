import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Typography, Tooltip, Space } from 'antd'
import {
  DashboardOutlined,
  KeyOutlined,
  FolderOpenOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  RocketOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { PulseDot } from './ai/PulseDot'

const { Sider, Content, Header } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tokens', icon: <KeyOutlined />, label: 'Token 管理' },
  { key: '/browser', icon: <FolderOpenOutlined />, label: '知识库浏览器' },
  { key: '/editor', icon: <EditOutlined />, label: '文档编辑器' },
  { key: '/skill-gen', icon: <ThunderboltOutlined />, label: 'Skill 生成' },
  { key: '/api-docs', icon: <ApiOutlined />, label: 'API 文档' },
  { key: '/wizard', icon: <RocketOutlined />, label: 'Workflow 向导' },
  { key: '/km-studio', icon: <RocketOutlined />, label: 'KM Studio' },
]

const AI_TITLE = {
  primary: 'KM Portal',
  secondary: 'Knowledge Operations Hub',
}

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <AntLayout style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
        width={220}
        collapsedWidth={72}
        style={{
          background: 'var(--bg-card)',
          borderRight: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--border)',
            padding: '8px 0',
          }}
        >
          {collapsed ? (
            <Typography.Title level={5} style={{ color: 'var(--accent-blue)', margin: 0, fontFamily: 'var(--font-mono)' }}>
              KM
            </Typography.Title>
          ) : (
            <>
              <Typography.Text style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 15 }}>
                {AI_TITLE.primary}
              </Typography.Text>
              <Typography.Text style={{ color: 'var(--text-muted)', fontSize: 10, fontFamily: 'var(--font-mono)' }}>
                {AI_TITLE.secondary}
              </Typography.Text>
            </>
          )}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
          style={{ background: 'transparent', borderRight: 0, marginTop: 8 }}
        />
      </Sider>
      <AntLayout style={{ background: 'var(--bg-primary)' }}>
        <Header
          style={{
            padding: '0 24px',
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            lineHeight: '64px',
          }}
        >
          <Space size="middle">
            <Typography.Title level={5} style={{ color: 'var(--text-primary)', margin: 0, lineHeight: '64px' }}>
              知识库运营一站式平台
            </Typography.Title>
            <PulseDot color="green" label="AI 在线" />
          </Space>
          <Space size="middle">
            <Tooltip title="设置">
              <SettingOutlined style={{ color: 'var(--text-secondary)', fontSize: 18, cursor: 'pointer' }} />
            </Tooltip>
          </Space>
        </Header>
        <Content
          style={{
            margin: 0,
            padding: 24,
            background: 'var(--bg-primary)',
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
