# KM-Portal AGENTS.md

> 本文件是 KM-Portal 项目的 Agent 工作规范。

## 项目概述

KM-Portal 是一个知识库运营管理平台，提供 Token 管理、知识库浏览、文档编辑、Skill 生成和 API 统计等功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Ant Design + Zustand
- **后端**: Express + TypeScript
- **数据存储**: JSON 文件 (data/tokens.json, data/skills.json)

## 项目结构

```
KM-Portal/
├── src/
│   ├── client/                    # React 前端
│   │   ├── services/              # API 服务层
│   │   │   ├── api.ts             # Axios 基础配置
│   │   │   ├── admin.ts           # Token 管理 API
│   │   │   ├── kb.ts              # 知识库 API
│   │   │   ├── stats.ts           # 统计 API
│   │   │   └── skill.ts           # Skill 生成 API
│   │   ├── stores/                # Zustand 状态管理
│   │   │   └── useTokenStore.ts   # Token 状态
│   │   ├── components/            # 公共组件
│   │   │   ├── PageHeader.tsx
│   │   │   └── Loading.tsx
│   │   └── pages/                 # 页面组件
│   │       ├── Dashboard/         # 仪表盘
│   │       ├── TokenManage/       # Token 管理
│   │       ├── KBBrowser/         # 知识库浏览
│   │       ├── DocEditor/         # 文档编辑
│   │       ├── SkillGen/          # Skill 生成
│   │       └── ApiDocs/           # API 文档
│   └── server/                    # Express 后端
│       ├── routes/                # 路由
│       │   ├── index.ts           # 路由汇总
│       │   ├── admin.ts           # Token CRUD
│       │   ├── kb.ts              # 知识库操作
│       │   ├── stats.ts           # 统计接口
│       │   ├── skill.ts           # Skill 生成
│       │   └── diag.ts            # 诊断接口
│       ├── services/              # 服务层
│       │   └── tokenStore.ts      # Token 存储
│       ├── middleware/            # 中间件
│       └── types/                 # 类型定义
├── data/                          # 数据存储目录
│   ├── tokens.json
│   ├── skills.json
│   └── api-logs.json
└── package.json
```

## API 路由

### Admin Routes (/api/admin)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /tokens | 列出所有 Token |
| POST | /tokens | 创建 Token |
| PUT | /tokens/:id | 更新 Token |
| POST | /tokens/:id/revoke | 撤销 Token |
| DELETE | /tokens/:id | 删除 Token |

### KB Routes (/api/kb)

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | /:kbId | 验证 KB 访问 | read |
| GET | /:kbId/documents | 列出文档 | read |
| POST | /:kbId/documents | 创建文档 | write |
| PUT | /:kbId/documents/:docId | 更新文档 | write |
| DELETE | /:kbId/documents/:docId | 删除文档 | write |

### Stats Routes (/api/stats)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /overview | 统计概览 |
| GET | /daily | 每日统计 |
| GET | /endpoints | 端点统计 |

### Skill Routes (/api/skill)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | / | 列出所有 Skill |
| GET | /:id | 获取 Skill 详情 |
| POST | / | 创建 Skill |
| PUT | /:id | 更新 Skill |
| DELETE | /:id | 删除 Skill |
| GET | /:id/export | 导出 Skill |

### Diag Routes (/api/diag)

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /health | 健康检查 |
| GET | /token/:kbId | Token 诊断 |
| POST | /verify | Token 验证 |

## 权限控制

Token 支持两种权限级别：
- **read**: 查询权限 - 只读访问知识库
- **write**: 编辑权限 - 可创建、更新、删除文档

## 数据模型

### KMToken

```typescript
interface KMToken {
  id: string
  kb_id: number
  kb_name: string
  token: string
  owner: string
  permission: 'read' | 'write'
  status: 'active' | 'revoked'
  expiresAt: string
  createdAt: string
  updatedAt: string
}
```

### GeneratedSkill

```typescript
interface GeneratedSkill {
  id: string
  name: string
  description: string
  kbId: number
  kbName: string
  permission: 'read' | 'write'
  content: string
  createdAt: string
  updatedAt: string
}
```

## 开发命令

```bash
# 开发模式
npm run dev          # 前后端同时启动
npm run dev:client   # 仅前端
npm run dev:server   # 仅后端

# 构建
npm run build        # 生产构建
npm run lint         # 代码检查
```

## 类型安全规则

- 禁止使用 `as any`
- 禁止使用 `@ts-ignore`
- 所有 API 响应必须定义接口
- 组件 Props 必须定义类型

## 提交规范

```
feat: 新功能
fix: Bug 修复
docs: 文档更新
style: 代码格式
refactor: 重构
perf: 性能优化
test: 测试
chore: 构建/工具
```