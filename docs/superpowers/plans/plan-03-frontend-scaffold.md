# Plan 03: React 前端脚手架

**Goal:** 构建 React 前端基础架构：路由配置、状态管理、API 服务层、基础组件

**Architecture:** 组件化 + 状态集中管理 + API 服务封装

**Tech Stack:** React 18, React Router 6, Zustand, Axios, Ant Design 5

---

## 文件结构

```
src/client/
├── main.tsx                 # 入口
├── App.tsx                  # 根组件
├── index.css                # 全局样式
├── router.tsx               # 路由配置
├── stores/                  # 状态管理
│   ├── useAuthStore.ts      # 认证状态
│   ├── useTokenStore.ts     # Token 状态
│   └── useStatsStore.ts     # 统计状态
├── services/                # API 服务
│   ├── api.ts               # Axios 实例
│   ├── admin.ts             # Admin API
│   ├── kb.ts                # KB API
│   └── stats.ts             # Stats API
├── components/              # 公共组件
│   ├── Layout.tsx           # 布局组件
│   ├── PageHeader.tsx       # 页面标题
│   └── Loading.tsx          # 加载状态
└── pages/                   # 页面组件
    ├── Dashboard/           # 仪表盘
    ├── TokenManage/         # Token 管理
    ├── KBBrowser/           # 知识库浏览器
    ├── DocEditor/           # 文档编辑器
    ├── SkillGen/            # Skill 生成
    └── ApiDocs/             # API 文档
```

---

## 任务清单

### Task 1: 创建 API 服务层

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\services\api.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\services\admin.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\services\kb.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\services\stats.ts`

- [ ] **Step 1: 创建 Axios 实例**

```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.msg || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default api
```

- [ ] **Step 2: 创建 Admin API 服务**

```typescript
import api from './api'

export interface ApiKeyRecord {
  id: string
  key: string
  name: string
  owner: string
  kbPermissions: { kbId: string; kbName: string; permission: string }[]
  status: string
  createdAt: string
}

export interface TokenRecord {
  id: string
  kb_name: string
  kb_id: string
  owner: string
  token: string
  env: string
  status: string
  created_at: string
}

export const adminApi = {
  listApiKeys: () => api.get<{ code: number; data: ApiKeyRecord[] }>('/admin/api-keys'),
  createApiKey: (data: { name: string; owner: string; kbPermissions?: any[] }) =>
    api.post<{ code: number; data: ApiKeyRecord }>('/admin/api-keys', data),
  revokeApiKey: (id: string) => api.post('/admin/api-keys/revoke', { id }),
  listTokens: () => api.get<{ code: number; data: { tokens: TokenRecord[] } }>('/admin/tokens'),
  uploadToken: (data: { kb_name: string; kb_id: string; token: string; owner: string; env: string }) =>
    api.post('/admin/tokens/upload', data),
  revokeToken: (id: string) => api.post('/admin/tokens/revoke', { id }),
}
```

- [ ] **Step 3: 创建 KB API 服务**

```typescript
import api from './api'

export interface KbInfo {
  kbId: number
  kbName: string
  effectivePermType: string
  accessBlocked: boolean
  link: string
}

export interface TreeNode {
  id: number
  spaceId: number
  kbId: number
  parentId: number | null
  title: string
  hasChild: boolean
  spaceName: string
  kbName: string
}

export interface ContentBody {
  contentId: number
  title: string
  content: string
  kbId: number
  kbName: string
  spaceId: number
  spaceName: string
  link: string
}

export const kbApi = {
  getInfo: (kbId: string) => api.post<{ code: number; data: KbInfo[] }>('/kb/info', { kb_id: kbId }),
  getTree: (kbId: string, parentId?: number) =>
    api.post<{ code: number; data: TreeNode[] }>('/kb/tree', { kb_id: kbId, parent_id: parentId }),
  getContent: (kbId: string, contentIds: number[], contentType: string) =>
    api.post<{ code: number; data: { type: string; content: ContentBody[] } }>('/kb/content', {
      kb_id: kbId,
      content_ids: contentIds,
      content_type: contentType,
    }),
  createContent: (kbId: string, title: string, contentType: string, content: string, parentId?: number) =>
    api.post('/kb/contents/create', { kb_id: kbId, title, content_type: contentType, content, parent_id: parentId }),
  updateContent: (kbId: string, contentId: number, title: string, contentType: string, content: string) =>
    api.post('/kb/contents/update', { kb_id: kbId, content_id: contentId, title, content_type: contentType, content }),
}
```

- [ ] **Step 4: 创建 Stats API 服务**

```typescript
import api from './api'

export interface StatsData {
  total: number
  byDay: Record<string, number>
  byEndpoint: Record<string, number>
  avgLatency: number
}

export const statsApi = {
  getStats: (kbId?: string, days?: number) =>
    api.get<{ code: number; data: StatsData }>('/stats', { params: { kb_id: kbId, days } }),
  getSummary: () =>
    api.get<{ code: number; data: { last7Days: StatsData; last30Days: StatsData } }>('/stats/summary'),
}
```

---

### Task 2: 创建状态管理

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\stores\useAuthStore.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\stores\useTokenStore.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\stores\useStatsStore.ts`

- [ ] **Step 1: 创建认证状态**

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  apiKey: string
  setApiKey: (key: string) => void
  clearApiKey: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      apiKey: '',
      setApiKey: (key) => set({ apiKey: key }),
      clearApiKey: () => set({ apiKey: '' }),
    }),
    { name: 'km-portal-auth' }
  )
)
```

- [ ] **Step 2: 创建 Token 状态**

```typescript
import { create } from 'zustand'
import type { TokenRecord } from '../services/admin'

interface TokenState {
  tokens: TokenRecord[]
  loading: boolean
  setTokens: (tokens: TokenRecord[]) => void
  setLoading: (loading: boolean) => void
  addToken: (token: TokenRecord) => void
  removeToken: (id: string) => void
}

export const useTokenStore = create<TokenState>((set) => ({
  tokens: [],
  loading: false,
  setTokens: (tokens) => set({ tokens }),
  setLoading: (loading) => set({ loading }),
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
  removeToken: (id) => set((state) => ({ tokens: state.tokens.filter((t) => t.id !== id) })),
}))
```

- [ ] **Step 3: 创建统计状态**

```typescript
import { create } from 'zustand'
import type { StatsData } from '../services/stats'

interface StatsState {
  last7Days: StatsData | null
  last30Days: StatsData | null
  loading: boolean
  setStats: (last7Days: StatsData, last30Days: StatsData) => void
  setLoading: (loading: boolean) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  last7Days: null,
  last30Days: null,
  loading: false,
  setStats: (last7Days, last30Days) => set({ last7Days, last30Days }),
  setLoading: (loading) => set({ loading }),
}))
```

---

### Task 3: 创建路由配置

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\router.tsx`

- [ ] **Step 1: 创建路由配置**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { TokenManage } from './pages/TokenManage'
import { KBBrowser } from './pages/KBBrowser'
import { DocEditor } from './pages/DocEditor'
import { SkillGen } from './pages/SkillGen'
import { ApiDocs } from './pages/ApiDocs'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="tokens" element={<TokenManage />} />
        <Route path="browser" element={<KBBrowser />} />
        <Route path="editor" element={<DocEditor />} />
        <Route path="skill-gen" element={<SkillGen />} />
        <Route path="api-docs" element={<ApiDocs />} />
      </Route>
    </Routes>
  )
}
```

---

### Task 4: 更新 App.tsx

**Files:**
- Modify: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\App.tsx`

- [ ] **Step 1: 更新 App.tsx**

```typescript
import { AppRouter } from './router'

function App() {
  return <AppRouter />
}

export default App
```

---

### Task 5: 创建公共组件

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\components\PageHeader.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\components\Loading.tsx`

- [ ] **Step 1: 创建 PageHeader 组件**

```typescript
import { Typography } from 'antd'

const { Title } = Typography

interface PageHeaderProps {
  title: string
  subTitle?: string
}

export function PageHeader({ title, subTitle }: PageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <Title level={3} style={{ marginBottom: 4 }}>{title}</Title>
      {subTitle && <Typography.Text type="secondary">{subTitle}</Typography.Text>}
    </div>
  )
}
```

- [ ] **Step 2: 创建 Loading 组件**

```typescript
import { Spin } from 'antd'

export function Loading() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
      <Spin size="large" />
    </div>
  )
}
```

---

### Task 6: 创建页面占位组件

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\Dashboard\index.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\TokenManage\index.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\KBBrowser\index.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\DocEditor\index.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\SkillGen\index.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\pages\ApiDocs\index.tsx`

- [ ] **Step 1: 创建 Dashboard 页面**

```typescript
import { Card, Row, Col, Statistic } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { useStatsStore } from '../../stores/useStatsStore'
import { useEffect } from 'react'
import { statsApi } from '../../services/stats'

export function Dashboard() {
  const { last7Days, last30Days, loading, setStats, setLoading } = useStatsStore()

  useEffect(() => {
    setLoading(true)
    statsApi.getSummary()
      .then((res) => {
        if (res.code === 1) {
          setStats(res.data.last7Days, res.data.last30Days)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Loading />

  return (
    <div>
      <PageHeader title="仪表盘" subTitle="知识库运营概览" />
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="近7天调用次数" value={last7Days?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="近30天调用次数" value={last30Days?.total || 0} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="7天平均延迟" value={last7Days?.avgLatency || 0} suffix="ms" />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="7天日均调用" value={Math.round((last7Days?.total || 0) / 7)} />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
```

- [ ] **Step 2: 创建 TokenManage 页面**

```typescript
import { Table, Button, Space, Tag, message } from 'antd'
import { PageHeader } from '../../components/PageHeader'
import { Loading } from '../../components/Loading'
import { useTokenStore } from '../../stores/useTokenStore'
import { useEffect } from 'react'
import { adminApi } from '../../services/admin'

export function TokenManage() {
  const { tokens, loading, setTokens, setLoading } = useTokenStore()

  useEffect(() => {
    loadTokens()
  }, [])

  const loadTokens = () => {
    setLoading(true)
    adminApi.listTokens()
      .then((res) => {
        if (res.code === 1) {
          setTokens(res.data.tokens)
        }
      })
      .catch(() => message.error('加载失败'))
      .finally(() => setLoading(false))
  }

  const handleRevoke = async (id: string) => {
    try {
      await adminApi.revokeToken(id)
      message.success('撤销成功')
      loadTokens()
    } catch {
      message.error('撤销失败')
    }
  }

  const columns = [
    { title: '知识库', dataIndex: 'kb_name', key: 'kb_name' },
    { title: 'KB ID', dataIndex: 'kb_id', key: 'kb_id' },
    { title: '所有者', dataIndex: 'owner', key: 'owner' },
    { title: '环境', dataIndex: 'env', key: 'env' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>{status}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" danger onClick={() => handleRevoke(record.id)}>
            撤销
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <PageHeader title="Token 管理" subTitle="管理知识库访问凭证" />
      <Table columns={columns} dataSource={tokens} rowKey="id" loading={loading} />
    </div>
  )
}
```

- [ ] **Step 3-6: 创建其他页面（占位）**

```typescript
import { PageHeader } from '../../components/PageHeader'

export function KBBrowser() {
  return (
    <div>
      <PageHeader title="知识库浏览器" subTitle="浏览知识库目录和内容" />
      <p>知识库浏览器功能开发中...</p>
    </div>
  )
}

export function DocEditor() {
  return (
    <div>
      <PageHeader title="文档编辑器" subTitle="编辑和发布文档" />
      <p>文档编辑器功能开发中...</p>
    </div>
  )
}

export function SkillGen() {
  return (
    <div>
      <PageHeader title="Skill 生成" subTitle="生成知识库运营助手" />
      <p>Skill 生成功能开发中...</p>
    </div>
  )
}

export function ApiDocs() {
  return (
    <div>
      <PageHeader title="API 文档" subTitle="API 调用文档和示例" />
      <p>API 文档功能开发中...</p>
    </div>
  )
}
```

---

### Task 7: 更新 Layout 组件

**Files:**
- Modify: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\components\Layout.tsx`

- [ ] **Step 1: 更新 Layout 组件**

```typescript
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Menu, Layout as AntLayout } from 'antd'
import {
  DashboardOutlined,
  KeyOutlined,
  FolderOpenOutlined,
  EditOutlined,
  ThunderboltOutlined,
  ApiOutlined,
} from '@ant-design/icons'

const { Sider, Content } = AntLayout

const menuItems = [
  { key: '/dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: '/tokens', icon: <KeyOutlined />, label: 'Token 管理' },
  { key: '/browser', icon: <FolderOpenOutlined />, label: '知识库浏览器' },
  { key: '/editor', icon: <EditOutlined />, label: '文档编辑器' },
  { key: '/skill-gen', icon: <ThunderboltOutlined />, label: 'Skill 生成' },
  { key: '/api-docs', icon: <ApiOutlined />, label: 'API 文档' },
]

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = '/' + location.pathname.split('/')[1]

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <AntLayout.Sider collapsible collapsed={collapsed} onCollapse={setCollapsed} theme="dark">
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </AntLayout.Sider>
      <AntLayout>
        <AntLayout.Header style={{ background: '#fff', padding: '0 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>KM-Portal 知识库运营平台</div>
        </AntLayout.Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 8 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  )
}
```

---

### Task 8: 验证前端构建

**Files:**
- Modify: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\App.tsx` (确认导出)

- [ ] **Step 1: 验证前端构建**

Run: `cd "D:\Users\11033406\【01】Projects\KM-Portal" && npx vite build`
Expected: 构建成功

- [ ] **Step 2: 提交代码**

```bash
cd "D:\Users\11033406\【01】Projects\KM-Portal"
git add .
git commit -m "feat: add React frontend scaffold with routing and state management"
```

---

## 验收标准

- [ ] 前端可正常启动
- [ ] 路由跳转正常
- [ ] 状态管理正常工作
- [ ] API 服务层正常调用
- [ ] 页面可正常渲染