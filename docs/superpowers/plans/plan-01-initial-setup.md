# Plan 01: 项目脚手架搭建

**Goal:** 初始化 KM-Portal 项目结构，安装依赖，配置 TypeScript、ESLint、Prettier

**Architecture:** Monorepo 结构，前端 React + 后端 Express 共用配置

**Tech Stack:** React 18, TypeScript, Vite, Express, Ant Design 5

---

## 文件结构

```
KM-Portal/
├── package.json              # 根目录 package.json
├── tsconfig.json             # TypeScript 配置
├── tsconfig.node.json        # Node.js TypeScript 配置
├── vite.config.ts            # Vite 配置
├── .eslintrc.cjs             # ESLint 配置
├── .prettierrc               # Prettier 配置
├── src/
│   ├── client/               # React 前端
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── server/               # Express 后端
│       └── index.ts
└── data/                     # 数据目录（与 KM-API 共用）
```

---

## 任务清单

### Task 1: 创建 package.json

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\package.json`

- [ ] **Step 1: 创建 package.json**

```json
{
  "name": "km-portal",
  "version": "1.0.0",
  "description": "知识库运营一站式平台",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"npm run dev:client\" \"npm run dev:server\"",
    "dev:client": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "npm run build:client && npm run build:server",
    "build:client": "vite build",
    "build:server": "tsc -p tsconfig.server.json",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx}\""
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.0",
    "antd": "^5.14.0",
    "@ant-design/icons": "^5.2.6",
    "zustand": "^4.5.0",
    "axios": "^1.6.7",
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "uuid": "^9.0.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^9.0.8",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.0",
    "tsx": "^4.7.1",
    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0",
    "@typescript-eslint/parser": "^7.0.0",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "prettier": "^3.2.5",
    "concurrently": "^8.2.2"
  }
}
```

- [ ] **Step 2: 安装依赖**

Run: `cd "D:\Users\11033406\【01】Projects\KM-Portal" && npm install`

---

### Task 2: 创建 TypeScript 配置

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\tsconfig.json`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\tsconfig.node.json`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\tsconfig.server.json`

- [ ] **Step 1: 创建 tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/client"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 2: 创建 tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: 创建 tsconfig.server.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020"],
    "outDir": "dist/server",
    "rootDir": "src/server",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/server/**/*"],
  "exclude": ["node_modules"]
}
```

---

### Task 3: 创建 Vite 配置

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\vite.config.ts`

- [ ] **Step 1: 创建 vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5053',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist/client',
    sourcemap: false,
  },
})
```

---

### Task 4: 创建 ESLint 和 Prettier 配置

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\.eslintrc.cjs`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\.prettierrc`

- [ ] **Step 1: 创建 .eslintrc.cjs**

```javascript
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  },
}
```

- [ ] **Step 2: 创建 .prettierrc**

```json
{
  "semi": false,
  "singleQuote": true,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

---

### Task 5: 创建前端入口文件

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\index.html`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\main.tsx`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\App.tsx`

- [ ] **Step 1: 创建 index.html**

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>KM-Portal - 知识库运营平台</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/client/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 2: 创建 src/client/main.tsx**

```typescript
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={zhCN}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
```

- [ ] **Step 3: 创建 src/client/App.tsx**

```typescript
import { Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components/Layout'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<div>仪表盘</div>} />
        <Route path="tokens" element={<div>Token 管理</div>} />
        <Route path="browser" element={<div>知识库浏览器</div>} />
        <Route path="editor" element={<div>文档编辑器</div>} />
        <Route path="skill-gen" element={<div>Skill 生成</div>} />
        <Route path="api-docs" element={<div>API 文档</div>} />
      </Route>
    </Routes>
  )
}

export default App
```

- [ ] **Step 4: 创建 src/client/index.css**

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}
```

---

### Task 6: 创建 Layout 组件

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\client\components\Layout.tsx`

- [ ] **Step 1: 创建 Layout 组件**

```typescript
import { useState } from 'react'
import { Outlet } from 'react-router-dom'
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
  { key: 'dashboard', icon: <DashboardOutlined />, label: '仪表盘' },
  { key: 'tokens', icon: <KeyOutlined />, label: 'Token 管理' },
  { key: 'browser', icon: <FolderOpenOutlined />, label: '知识库浏览器' },
  { key: 'editor', icon: <EditOutlined />, label: '文档编辑器' },
  { key: 'skill-gen', icon: <ThunderboltOutlined />, label: 'Skill 生成' },
  { key: 'api-docs', icon: <ApiOutlined />, label: 'API 文档' },
]

export function Layout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <AntLayout.Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        theme="dark"
      >
        <div style={{ height: 32, margin: 16, background: 'rgba(255,255,255,0.2)', borderRadius: 6 }} />
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['dashboard']} items={menuItems} />
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

### Task 7: 创建后端入口文件

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\index.ts`

- [ ] **Step 1: 创建后端入口**

```typescript
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 5053

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KM-Portal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

app.listen(PORT, () => {
  console.log(`KM-Portal server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})
```

---

### Task 8: 验证项目启动

**Files:**
- Modify: `D:\Users\11033406\【01】Projects\KM-Portal\package.json` (添加启动验证脚本)

- [ ] **Step 1: 验证后端启动**

Run: `cd "D:\Users\11033406\【01】Projects\KM-Portal" && npx tsx src/server/index.ts &`
Run: `sleep 3 && curl -s http://localhost:5053/api/health`
Expected: `{"status":"ok","service":"KM-Portal","version":"1.0.0",...}`

- [ ] **Step 2: 验证前端构建**

Run: `cd "D:\Users\11033406\【01】Projects\KM-Portal" && npx vite build`
Expected: 构建成功，生成 dist/client 目录

- [ ] **Step 3: 提交代码**

```bash
cd "D:\Users\11033406\【01】Projects\KM-Portal"
git init
git add .
git commit -m "feat: initial project setup with React + Express"
```