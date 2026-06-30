import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout as AntLayout, Menu, Typography, theme } from 'antd'
import {
  DashboardOutlined,
  KeyOutlined,
  FolderOpenOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  RocketOutlined,
} from '@ant-design/icons'

const { Sider, Content } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tokens', icon: <KeyOutlined />, label: 'Token 管理' },
  { key: '/browser', icon: <FolderOpenOutlined />, label: '知识库浏览器' },
  { key: '/editor', icon: <EditOutlined />, label: '文档编辑器' },
  { key: '/skill-gen', icon: <ThunderboltOutlined />, label: 'Skill 生成' },
  { key: '/api-docs', icon: <ApiOutlined />, label: 'API 文档' },
  { key: '/wizard', icon: <RocketOutlined />, label: '向导' },
]

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken()

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: 'white', margin: 0 }}>
            {collapsed ? 'KM' : '知识库平台'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <AntLayout.Header style={{ padding: '0 24px', background: colorBgContainer }}>
          <Typography.Title level={4} style={{ margin: 0, lineHeight: '64px' }}>
            知识库运营一站式平台
          </Typography.Title>
        </AntLayout.Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}