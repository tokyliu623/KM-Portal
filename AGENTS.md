# KM-Portal AGENTS.md

> 本文件是 KM-Portal 项目的 Agent 工作规范。
> 最后更新: 2026-06-30 (v1.8 交付计划已生成)

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
| POST | /tree | 获取 KB 树形结构（代理上游） | read |
| POST | /info | 获取 KB 信息（代理上游） | read |
| POST | /content | 获取文档内容（代理上游） | read |
| POST | /contents/create | 创建文档（代理上游） | write |
| POST | /contents/update | 更新文档（代理上游） | write |

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
| 1.7.5 | 2026-06-30 | 部署脚本 5 大漏洞修复：新增 verify-deploy.sh 预检 + 重写 deploy-server.sh + AGENTS.md 部署经验章节 |
| 1.7.4 | 2026-06-30 | Skill trigger 兜底：skillPackage.ts 新增 DEFAULT_TRIGGER_WORDS（8 个中英文+别名）；buildSkillMd/buildReadme 用 effectiveTriggers；verify-skill-e2e.sh trigger 检测接受空列表+非空列表；新增 skillPackageV174.test.ts 3 测试 |
| 1.7.3 | 2026-06-30 | Skill 路由字段兼容：抽 getField 到 src/server/utils/fieldCompat.ts；routes/skill.ts 支持 snake_case (kb_id/kb_name)；新增 skillRouteFieldCompat.test.ts 5 个测试；E2E 验证脚本 (scripts/verify-skill-e2e.sh) 8 步验收 |
| 1.7.2 | 2026-06-30 | E2E 验证脚本：scripts/verify-skill-e2e.sh 8 步端到端验收（健康/创建/下载/解压/frontmatter/结构/兼容/清理）；发现 v1.7.1 Skill 路由字段兼容遗漏 |
| 1.7.1 | 2026-06-30 | 系统性修复：抽离 src/shared/types/kb.ts 共享类型；KB API 字段名对齐（camelCase）+ 服务端兼容双字段名；翻译失败返回 warning 字段；启动凭证自检日志；新增 /api/diag/translate-health 健康检查；Skill zip 包结构规范化（YAML frontmatter / safeName 统一 / 跳过空 __init__.py）；新增 3 个 Vitest 回归测试（zip 结构/字段兼容/翻译降级）；CI 加 zip 验证步骤；部署脚本 source .env + post-deploy smoke test；AGENTS.md 老问题清单 |
| 1.7.0 | 2026-06-30 | 安全合规 + 可观测性：清理 .env.example 硬编码密钥；translator.ts 类型修复（移除 any）；删除未引用 auth 中间件；apiKeyStore 改为文件持久化 + 文件锁；axios 拦截器按 HTTP 状态码细分提示；新增 Vitest 单元测试 + Playwright E2E + GitHub Actions CI；新增 .editorconfig / LICENSE / 根目录 README.md；RELEASE-NOTES 同步 v1.6 |
| 1.6.0 | 2026-06-29 | 修复 Skill 导出仅生成 .md 问题（改为完整 zip 安装包）；修复 KBBrowser "资源不存在"（新增后端代理路由）；新增 Token 编辑 Modal；新增 axios 统一错误拦截；新增 DataState 组件；新增 KB 内容预览 |
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

- [x] 服务器部署验证 (2026-06-29)
- [ ] 权限控制完善
- [x] 单元测试添加 (2026-06-30, Vitest)
- [x] E2E 测试添加 (2026-06-30, Playwright + e2e-verify.ps1)
- [x] CI/CD (2026-06-30, GitHub Actions)
- [x] README.md 根目录入口 (2026-06-30)
- [x] LICENSE (2026-06-30, MIT)
- [x] .editorconfig (2026-06-30)
- [x] 密钥硬编码清理 (2026-06-30, 需用户在平台轮换)
- [x] v1.7.1 系统性修复 11 项 (字段对齐/翻译降级/zip 规范化/凭证自检)
- [x] 老问题清单章节（避免重复出现）
- [x] v1.7.2 E2E 验证脚本 (scripts/verify-skill-e2e.sh, 8 步验收)
- [x] v1.7.3 Skill 路由字段兼容 (snake_case kb_id/kb_name)
- [x] v1.7.4 Skill trigger 兜底 (DEFAULT_TRIGGER_WORDS)
- [x] v1.7.5 部署脚本 5 大漏洞修复 (2026-06-30)
- [ ] v1.8.0 Workflow 向导 + 目录结构可视化 (T+8d)
- [ ] v1.8.1 MCP 接入配置生成 (T+11d)
- [ ] v1.8.2 AI 指令模板生成 (T+13d)
- [ ] v1.8.3 运营效果分析（降级方案）(T+16d)
- [ ] v1.8.4 OpenAPI 规范生成 (T+18d)
- [ ] v1.9.0 前端向导完善 + 端到端联调 (T+25d)

## 老问题清单（v1.7.1 起维护，避免重复出现）

### 问题 1：KB API 字段命名不一致（v1.5.0 ~ v1.7.0）
- **症状**：KB 浏览器搜索返回 400 / Skill 创建时 KB ID 解析失败
- **根因**：客户端用 `kb_id` / `doc_id` / `parent_id`（snake_case），服务端用 `kbId` / `docId` / `parentId`（camelCase）。4 个 POST 路由（/tree, /info, /content, /contents/create, /contents/update）受影响
- **v1.7.1 解决**：
  1. 抽离 `src/shared/types/kb.ts` 共享类型
  2. 客户端 `src/client/services/kb.ts` 改用 camelCase
  3. 服务端 `src/server/routes/kb.ts` 通过 `getField(body, 'kbId', 'kb_id')` 兼容双字段名
- **预防**：
  - 未来新增 KB API **必须**用 `src/shared/types/kb.ts` 的接口
  - 任何新接口都需通过 `tests/unit/kbRouteFieldCompat.test.ts` 回归

### 问题 2：九问翻译静默降级（v1.6.0 ~ v1.7.0）
- **症状**：前端转圈后 Skill 用 ASCII 名字生成，无错误提示；用户从九问 Bot 平台看日志才发现翻译没调通
- **根因**：
  1. 翻译失败被 `routes/skill.ts:131-137` 的 try/catch 吞掉，只 `console.error`
  2. 部署脚本未注入 `.env`（`PORT=5053 nohup ... &` 没有 export 凭证）
- **v1.7.1 解决**：
  1. 翻译失败返回 `warning` 字段（前端能感知降级）
  2. `src/server/index.ts` 启动时打印 `[Boot] LLM_API_KEY: configured/MISSING` 自检日志
  3. 新增 `/api/diag/translate-health` 探针
  4. `deploy-server.sh` 启动前 `source .env`
- **预防**：
  - 服务器部署必须 `source .env`（无 .env 则翻译降级为 ASCII）
  - 任何新翻译/AI 接口必须返回降级状态（`warning` 字段）
  - 启动后跑 `scripts/post-deploy.sh` smoke test 验证

### 问题 3：Skill zip 包结构不规范（v1.6.0 ~ v1.7.0）
- **症状**：zip 能下载但 Skill 加载器无法解析（YAML frontmatter 报错 / 目录名乱码）
- **根因**：
  1. `SKILL.md` YAML frontmatter 格式错（`trigger` 是字符串不是列表、字符串无引号）
  2. zip 内部目录名 `name.toLowerCase().replace(/\s+/g, '-')` 与文件名派生规则不一致
  3. 空 `__init__.py` 被归档
  4. `generateSkillContent` 不嵌入用户 description
- **v1.7.1 解决**：
  1. `skillPackage.ts:14-24` YAML 规范化（双引号 + `trigger` 列表 + yamlEscape 转义）
  2. 抽出 `safeName()` 工具，与 `routes/skill.ts:242-247` 派生规则统一
  3. 跳过空 `__init__.py`
- **预防**：
  - CI 跑 `tests/unit/skillPackageV171.test.ts` 验证 zip 结构
  - 任何 zip 结构调整必须扩展 `skillPackageV171.test.ts`

### 问题 4：知识库浏览"资源不存在"（v1.5.0 之前）
- **症状**：KB 浏览器输入 KB ID 报"资源不存在"
- **根因**：v1.5.0 之前 `GET /:kbId` 直调上游 KM API 失败无代理
- **v1.6.0 解决**（`67efdb6`）：新增后端代理路由 `/api/kb/{tree,info,content,...}`
- **v1.7.1 强化**：字段兼容双字段名 + 共享类型
- **预防**：KB API 任何修改必须经过 `kbRouteFieldCompat.test.ts`

### 问题 5：Skill 路由字段不兼容 snake_case（v1.7.1 遗漏，v1.7.3 发现）
- **症状**：`POST /api/skill/` 用 `kb_id` / `kb_name`（snake_case）调用返回 400
- **根因**：v1.7.1 字段兼容（`getField`）只在 `routes/kb.ts` 内部实现，**`routes/skill.ts` 没引入**，仍用旧 `const { name, description, kbId, kbName, permission } = req.body` 解构
- **发现方式**：`scripts/verify-skill-e2e.sh` 端到端验证（Step 7 snake_case 兼容测试）
- **v1.7.3 解决**：
  1. 抽 `getField` 到 `src/server/utils/fieldCompat.ts` 公共工具
  2. `routes/kb.ts` 改用 `import { getField } from '../utils/fieldCompat.js'`，删除本地定义
  3. `routes/skill.ts:118-150` POST 改用 `getField(req.body, 'kbId', 'kb_id')` / `'kbName', 'kb_name'`
  4. 新增 `tests/unit/skillRouteFieldCompat.test.ts` 5 个测试（camelCase/snake_case/优先级/缺失/双字段）
- **预防**：
  - 任何新 POST 路由**必须**用 `getField` 兼容双字段名
  - CI 必跑 `kbRouteFieldCompat.test.ts` + `skillRouteFieldCompat.test.ts`
  - 服务器端真实环境验证 ≠ 本地 Vitest 单元测试（这次漏就是 v1.7.1 漏了 skill 路由字段兼容）

### 问题 6：Skill trigger 空列表语义弱（v1.7.1 以来）
- **症状**：E2E 验证脚本 Step 5 检测 trigger 报"不是列表形式"（虽然 YAML 合法，但语义空）
- **根因**：`routes/skill.ts:235-252` 的 export 路由传 `triggerWords: []` 给 `buildSkillZip`，SKILL.md 输出 `trigger: []` 空列表
- **v1.7.4 解决**：
  1. `skillPackage.ts` 新增 `DEFAULT_TRIGGER_WORDS` 常量（8 个中英文+别名兜底词）
  2. `buildSkillMd` / `buildReadme` 都用 `effectiveTriggers`（用户传值 > 默认值）
  3. `verify-skill-e2e.sh` 修 trigger 检测：列表 OR 空数组都算合法
  4. 新增 `skillPackageV174.test.ts` 3 个测试（空/有值/README）
- **预防**：
  - CI 必跑 `skillPackageV174.test.ts`
  - 未来若需修改兜底词列表，必须同步改 README 渲染逻辑

## 验证脚本（v1.7.2 起新增）

### `scripts/verify-skill-e2e.sh`
- **用途**：服务器上一键完成 Skill 包**生成 → 解析 → 复核 → 清理**端到端验证
- **覆盖验收点**（8 项）：
  1. 服务健康 + 翻译探针
  2. POST `/api/skill` 创建（触发翻译，验证 warning 字段）
  3. GET `/api/skill/:id/export` 下载 zip
  4. unzip 列出文件清单
  5. SKILL.md frontmatter 合法性（YAML 起始/闭合、trigger 列表、description 引号、Python 解析）
  6. zip 结构（无空 `__init__.py`、目录派生统一、所有必需文件存在）
  7. snake_case `kb_id` 字段兼容（模块 3）
  8. 自动 DELETE 清理测试数据
- **使用**：
  ```bash
  # 服务器一键验证(默认自动清理)
  bash scripts/verify-skill-e2e.sh

  # 保留产物排查问题
  KEEP_ARTIFACT=yes bash scripts/verify-skill-e2e.sh
  # 清理:bash /tmp/km-skill-verify-XXX/cleanup.sh

  # 自定义 KB / Token
  KB_ID=34754 TOKEN=u-xxx bash scripts/verify-skill-e2e.sh
  ```
- **预防**：
  - 任何 Skill 包结构调整（zip 内容/frontmatter/目录派生）必须先跑本脚本验证
  - 任何 KB API / Skill API 变更必须先跑本脚本验证兼容性
  - 服务器端真实环境验证 ≠ 本地 Vitest 单元测试（前者验证端到端链路）

## 服务器部署经验（v1.7.5 起维护）

### 部署 5 大漏洞（v1.7.4 验证过程发现）

| # | 问题 | 症状 | 解决方案 |
|---|------|------|----------|
| 1 | dubious ownership | `git fetch` 报 "detected dubious ownership" | `git config --global --add safe.directory /data/KM-Portal` |
| 2 | .git 写权限 | `FETCH_HEAD: Permission denied` | `chown -R sk_sudo:sk_sudo .git` |
| 3 | .env 读权限 | `source .env: Permission denied` | `chmod 644 .env` |
| 4 | 网络超时 | `Failed connect to github.com:443` | 重试 + `http.postBuffer 524288000` |
| 5 | 旧进程残留 | `curl /api/health` 返回旧版本 | `pkill -9 -f km-portal-linux` + 端口空闲检查 |

### 完整部署命令（v1.7.5+ 推荐）

```bash
# 1. 预检
git config --global --add safe.directory /data/KM-Portal
git config --global http.postBuffer 524288000
curl -fsS --max-time 5 https://github.com > /dev/null || { echo "[FAIL] 无网络"; exit 1; }

# 2. 同步
cd /data/KM-Portal
rm -f .git/index.lock FETCH_HEAD
for i in 1 2 3 4 5; do git fetch origin main && break; sleep 15; done
git reset --hard origin/main

# 3. 杀进程
pkill -9 -f km-portal-linux || true
sleep 3
lsof -i:5053 > /dev/null 2>&1 && { echo "[FATAL] 端口占用"; exit 1; }

# 4. 修权限
chmod +x dist/km-portal-linux scripts/verify-skill-e2e.sh
[ -f .env ] && chmod 644 .env

# 5. 启动
[ -f .env ] && set -a && . ./.env && set +a
PORT=5053 nohup ./dist/km-portal-linux > server.log 2>&1 &
sleep 4
curl -fsS http://127.0.0.1:5053/api/health
```

### 验证脚本

- `scripts/verify-deploy.sh`（v1.7.5 新增）：部署前 5 大漏洞预检
- `scripts/verify-skill-e2e.sh`（v1.7.2 新增）：Skill 包端到端验证

### 服务器权限模型

- sk_sudo: 受限（不能改 root: 文件/进程）
- root: 全权（必须用 root 跑部署）
- 网络: github.com:443 偶发 timeout，root + 重试能通