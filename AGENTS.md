# KM-Portal AGENTS.md

> 本文件是 KM-Portal 项目的 Agent 工作规范。
> 最后更新: 2026-06-27

## 项目概述

KM-Portal 是一个知识库运营管理平台，提供 Token 管理、知识库浏览、文档编辑、Skill 生成和 API 统计等功能。

**GitHub**: https://github.com/tokyliu623/KM-Portal

**相关项目**: KM-API (https://github.com/tokyliu623/KM-API)

## 技术栈

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| UI 组件库 | Ant Design 5 |
| 状态管理 | Zustand |
| HTTP 客户端 | Axios |
| 后端框架 | Express 4 + TypeScript |
| 数据存储 | JSON 文件 |

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
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useStatsStore.ts
│   │   │   └── useTokenStore.ts
│   │   ├── components/            # 公共组件
│   │   │   ├── Layout.tsx
│   │   │   ├── Loading.tsx
│   │   │   └── PageHeader.tsx
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
│       │   ├── tokenStore.ts      # Token 存储
│       │   ├── statsStore.ts      # 统计存储
│       │   ├── apiKeyStore.ts     # API Key 存储
│       │   └── kmApiClient.ts     # KM API 客户端
│       ├── middleware/            # 中间件
│       │   ├── auth.ts            # 认证中间件
│       │   ├── errorHandler.ts    # 错误处理
│       │   └── logger.ts          # 日志中间件
│       ├── types/                 # 类型定义
│       └── utils/                 # 工具函数
├── dist/                          # 预编译产物（已提交 git）
│   ├── client/                    # 前端构建产物
│   └── server/                    # 后端编译产物
├── data/                          # 数据存储目录
│   ├── tokens.json
│   ├── skills.json
│   └── api-logs.json
├── docs/                          # 文档目录
│   ├── DEPLOY-SERVER.md           # 服务器部署指南
│   └── RELEASE-NOTES.md           # 版本记录
├── package.json
├── tsconfig.json
├── tsconfig.server.json
├── vite.config.ts
├── deploy.sh                      # 传统部署脚本
├── deploy-server.sh               # 服务器部署脚本
├── deploy-docker.sh               # Docker 部署脚本
├── nginx.conf.example             # Nginx 配置模板
└── .env.example                   # 环境变量模板
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
npm run dev:client   # 仅前端 (Vite)
npm run dev:server   # 仅后端 (tsx watch)

# 构建
npm run build        # 生产构建（前端 + 后端）
npm run build:client # 仅前端
npm run build:server # 仅后端

# 启动
npm start            # 启动后端服务
npm run serve        # 构建 + 启动

# 代码质量
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 服务器部署

### 部署方式

采用**本地预编译 + 服务器运行**模式：
- 本地编译后，`dist/` 目录提交到 git
- 服务器直接运行预编译代码，无需编译

### 部署命令

```bash
cd /data/KM-Portal
git pull origin master
npm install --production
PORT=5053 nohup npm start > server.log 2>&1 &
sleep 3
curl http://localhost:5053/api/health
```

### 一键部署脚本

```bash
chmod +x deploy-server.sh && ./deploy-server.sh
```

## 运维信息

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 5053 | Express 服务 |
| 前端 | 静态托管 | 通过 Nginx |

### 数据文件

```
data/
├── tokens.json      # Token 存储
├── skills.json      # Skill 存储
└── api-logs.json    # API 调用日志
```

### 日志文件

```
server.log           # 服务运行日志
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

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.4.0 | 2026-06-27 | 新增服务器部署脚本 |
| 1.3.0 | 2026-06-27 | 修复 GLIBC 兼容性问题，添加 dist/ 到 git |
| 1.2.0 | 2026-06-27 | 添加 Docker 部署支持 |
| 1.1.0 | 2026-06-27 | 添加部署配置和脚本 |
| 1.0.0 | 2026-06-27 | 项目初始化，完成核心功能 |

## 已知问题

1. **服务器 GLIBC 版本限制**: 当前服务器 GLIBC 版本过低（< 2.25），无法运行标准 Node.js 二进制文件。解决方案是使用本地预编译 + 服务器运行模式。

## 待办事项

- [ ] 服务器部署验证
- [ ] 权限控制完善
- [ ] Skill 生成器优化
- [ ] 单元测试添加
- [ ] E2E 测试添加