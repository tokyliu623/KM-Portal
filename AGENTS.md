# KM-Portal AGENTS.md

> 本文件是 KM-Portal 项目的 Agent 工作规范。
> 最后更新: 2026-06-29

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
| 静态打包 | pkg (Node.js 18 Linux x64) |

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
│       ├── routes/                # 路由（直接挂载到 app）
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
│   ├── server/                    # 后端编译产物
│   ├── server-bundle/             # esbuild 打包产物
│   └── km-portal-linux            # pkg 静态可执行文件 (47MB)
├── data/                          # 数据存储目录
│   ├── tokens.json
│   ├── skills.json
│   └── api-logs.json
├── docs/                          # 文档目录
├── scripts/                       # 构建脚本
│   └── build-server.cjs           # esbuild 打包脚本
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

## 开发命令

```bash
# 开发模式
npm run dev          # 前后端同时启动
npm run dev:client   # 仅前端 (Vite)
npm run dev:server   # 仅后端 (tsx watch)

# 构建
npm run build:client       # 前端构建
npm run build:server       # 后端 TypeScript 编译
npm run build:server:cjs   # 后端 esbuild 打包 (CJS)
npm run build:all          # 前端 + 后端编译 + esbuild 打包

# 静态打包 (pkg)
npm run pkg:linux          # 生成 Linux 可执行文件
npm run pkg:all            # 完整构建 + 打包

# 启动
npm start            # 启动后端服务
npm run serve        # 构建 + 启动

# 代码质量
npm run lint         # ESLint 检查
npm run format       # Prettier 格式化
```

## 服务器部署

### 部署架构

采用**本地预编译 + pkg 静态打包 + 服务器运行**模式：

```
本地 Windows (构建环境)
├── npm run build:all      # 构建前端 + 后端
├── npm run pkg:linux      # 生成静态可执行文件 (47MB)
└── git push origin main   # 推送到 GitHub
        ↓
服务器 CentOS 7 (GLIBC 2.17)
├── git pull origin main   # 拉取代码
└── ./dist/km-portal-linux # 直接运行，无需 Node.js
```

### 部署命令

```bash
# 一键部署
cd /data/KM-Portal && ./deploy-server.sh

# 手动部署
cd /data/KM-Portal
git pull origin main
chmod +x dist/km-portal-linux
pkill -f km-portal-linux || true
PORT=5053 nohup ./dist/km-portal-linux > server.log 2>&1 &
sleep 3
curl http://127.0.0.1:5053/api/health
```

### 部署脚本说明 (deploy-server.sh)

```bash
# 1. 清理可能的锁定文件
rm -f .git/index.lock FETCH_HEAD

# 2. 配置 Git 缓冲区（解决大文件下载超时）
git config --global http.postBuffer 524288000

# 3. 拉取代码（最多重试 3 次）
for i in 1 2 3; do
    git pull origin main && break
    sleep 10
done

# 4. 检查并启动服务
chmod +x dist/km-portal-linux
pkill -f km-portal-linux || true
PORT=5053 nohup ./dist/km-portal-linux > server.log 2>&1 &
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

## 运维信息

### 服务端口

| 服务 | 端口 | 说明 |
|------|------|------|
| 后端 API | 5053 | Express 服务 |
| 前端 | 静态托管 | 通过 Express 内置 static |

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

## 问题排查记录 (2026-06-29)

### 问题 1：ApiDocs 页面"加载失败"

**症状**：点击 API 文档 tab 报错 "加载失败"

**根因**：`src/client/pages/ApiDocs/index.tsx` 导入了不存在的 `CodeBlock` 组件

**解决方案**：移除 `CodeBlock` 导入，使用标准 HTML `<pre>` 标签

---

### 问题 2：Skill Gen 页面"加载失败"

**症状**：点击 Skill 生成 tab 报错 "加载失败"

**根因**：
1. `data/skills.json` 文件不存在
2. axios 错误拦截器显示通用错误信息

**解决方案**：
1. 创建 `data/skills.json` 文件
2. 改进 axios 错误拦截器，区分 401/403/404/500 错误

---

### 问题 3：服务器 GLIBC 版本过低

**症状**：服务器报错 `GLIBC_2.27' not found`

**服务器环境**：
- 系统：CentOS 7
- GLIBC：2.17
- 标准 Node.js 需要 GLIBC 2.25+

**解决方案**：使用 `pkg` 静态打包，生成不依赖 GLIBC 的可执行文件

```bash
# 本地构建
npm run build:all
npm run pkg:linux

# 生成的 dist/km-portal-linux 不依赖系统 GLIBC
```

---

### 问题 4：Express Router 路由匹配问题（关键）

**症状**：`/api/skill` 返回 404 "Skill not found"

**根因**：Express Router (`router.use()`) 在 pkg 静态打包后路径匹配行为异常

**问题分析**：
1. 最初使用 `app.use('/api', router)` 统一挂载
2. `router.use(skillRouter)` 挂载 skill 路由
3. kb 路由的 `/:kbId` 会匹配 `/api/skill`，导致 401
4. 调整路由顺序后（skill 在 kb 之前），返回 404 "Skill not found"
5. 原因：`/:id` 路由被匹配，而不是 `/`

**解决方案**：不使用中间 router，直接挂载路由

```typescript
// src/server/index.ts
app.use('/api/admin', adminRouter)
app.use('/api/skill', skillRouter)
app.use('/api/kb', kbRouter)
app.use('/api/stats', statsRouter)
app.use('/api/diag', diagRouter)
```

---

### 问题 5：Git 拉取失败

**症状**：`git pull origin main` 报错 `Encountered end of file`

**解决方案**：
1. 清理锁定文件：`rm -f .git/index.lock FETCH_HEAD`
2. 配置 Git 缓冲区：`git config --global http.postBuffer 524288000`
3. 使用 `git reset --hard origin/main` 强制同步

---

### 问题 6：dist/km-portal-linux 不在 git 中

**症状**：服务器 git pull 后，二进制文件仍是旧版本

**原因**：`dist/km-portal-linux` 虽然在 git 中，但有时 git reset 不会更新大文件

**解决方案**：
1. 确保每次构建后 `git add dist/km-portal-linux`
2. 服务器部署前执行 `git reset --hard origin/main`
3. 重新 chmod：`chmod +x dist/km-portal-linux`

---

### 问题 7：服务启动后立即退出

**症状**：服务启动后 curl 返回 "Connection refused"

**解决方案**：
1. 检查进程：`ps aux | grep km-portal-linux`
2. 检查日志：`cat server.log`
3. 重新 chmod：`chmod +x dist/km-portal-linux`
4. 使用 nohup 后台启动：`nohup ./dist/km-portal-linux > server.log 2>&1 &`

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
build: 构建相关（如 pkg 打包）
```

## 版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| 1.5.0 | 2026-06-29 | 修复 Express Router 路由匹配问题，使用 app.use 直接挂载路由 |
| 1.4.  | 2026-06-29 | 添加 pkg 静态打包支持，解决 GLIBC 兼容性问题 |
| 1.4.0 | 2026-06-27 | 新增服务器部署脚本 |
| 1.3.0 | 2026-06-27 | 修复 GLIBC 兼容性问题，添加 dist/ 到 git |
| 1.2.0 | 2026-06-27 | 添加 Docker 部署支持 |
| 1.1.0 | 2026-06-27 | 添加部署配置和脚本 |
| 1.0.0 | 2026-06-27 | 项目初始化，完成核心功能 |

## 服务器信息

| 项目 | 值 |
|------|-----|
| 服务器 | ipt-agent-press-10-101-10-50.v-sz-1.vivo.lan |
| 系统 | CentOS 7 (GLIBC 2.17) |
| 架构 | x86_64 |
| 端口 | 5053 |
| 部署路径 | /data/KM-Portal |
| 启动命令 | `./dist/km-portal-linux` |
| 日志文件 | `/data/KM-Portal/server.log` |

## 待办事项

- [ ] 服务器部署验证 ✅ (2026-06-29)
- [ ] 权限控制完善
- [ ] Skill 生成器优化
- [ ] 单元测试添加
- [ ] E2E 测试添加