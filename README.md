# KM-Portal

> 知识库运营管理平台 — Token 管理、知识库浏览、文档编辑、Skill 生成、API 统计一体化。

![GitHub](https://img.shields.io/badge/license-MIT-green) ![Node](https://img.shields.io/badge/node-%3E%3D18-blue) ![React](https://img.shields.io/badge/react-18-61dafb) ![TypeScript](https://img.shields.io/badge/typescript-5-3178c6)

## 特性

- **Token 管理**：CRUD + 撤销 + 编辑 Modal，JSON 文件持久化
- **知识库浏览**：后端代理上游 `wiki.vivo.xyz`，支持树形结构懒加载、文档预览/编辑
- **文档编辑**：基于 KM API 的 create / update / delete
- **Skill 生成**：集成九问翻译服务自动翻译中文名→英文，导出 zip 安装包（含 `SKILL.md` + `README.md` + `requirements.txt` + `kb_client.py` + `config/user.json`）
- **API 统计**：调用日志、每日统计、端点统计
- **静态打包**：`pkg` 打包成 47MB Linux x64 单文件可执行，兼容 GLIBC 2.17 (CentOS 7)
- **端到端验证**：`scripts/e2e-verify.ps1` + `tests/e2e/*.spec.ts` (Playwright)

## 架构

```
┌──────────────────┐      HTTP      ┌──────────────────┐
│  React + Vite    │ ─────────────► │  Express Server  │
│  (dist/client)   │                │  (dist/server)   │
└──────────────────┘                └──────────────────┘
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                    ┌──────────┐     ┌──────────┐      ┌──────────┐
                    │ data/    │     │ KM API   │      │ 九问 LLM │
                    │ *.json   │     │ upstream │      │ (translate)│
                    └──────────┘     └──────────┘      └──────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite 5 + Ant Design 5 + Zustand + Axios |
| 后端 | Express 4 + TypeScript |
| 存储 | JSON 文件 + 内存文件锁 |
| 打包 | esbuild (CJS) + pkg (Linux x64 单文件) |
| 测试 | Vitest (单元) + Playwright (E2E) + PowerShell (环境验证) |
| CI | GitHub Actions |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，至少配置 LLM_API_KEY（用于 Skill 名称翻译）

# 3. 开发模式
npm run dev
# 前端: http://localhost:5173
# 后端: http://localhost:5053

# 4. 生产构建
npm run build:all          # 前端 + 后端编译 + esbuild 打包
npm run pkg:linux          # 生成 dist/km-portal-linux (47MB)
```

## 部署

```bash
# 服务器 (CentOS 7, GLIBC 2.17)
cd /data/KM-Portal
git pull origin main
chmod +x dist/km-portal-linux
pkill -f km-portal-linux || true
PORT=5053 nohup ./dist/km-portal-linux > server.log 2>&1 &
```

详见 [docs/DEPLOY-SERVER.md](docs/DEPLOY-SERVER.md)

## API 路由

| 路径 | 描述 |
|------|------|
| `GET /api/health` | 健康检查 |
| `/api/admin/tokens` | Token CRUD |
| `/api/kb/:kbId/*` | 知识库代理 (树/信息/内容/创建/更新) |
| `/api/skill/*` | Skill 生成 + 翻译 + zip 导出 |
| `/api/stats/*` | 统计概览/每日/端点 |
| `/api/diag/*` | 健康诊断 + Token 验证 |

详见 [docs/RELEASE-NOTES.md](docs/RELEASE-NOTES.md)

## 项目结构

```
src/
├── client/                  # React 前端
│   ├── components/          # Layout, PageHeader, DataState, Loading
│   ├── pages/               # Dashboard / TokenManage / KBBrowser / DocEditor / SkillGen / ApiDocs
│   ├── services/            # api.ts (axios) + 业务 API 封装
│   └── stores/              # Zustand (useAuthStore / useTokenStore / useStatsStore)
├── server/                  # Express 后端
│   ├── routes/              # admin / kb / skill / stats / diag
│   ├── services/            # tokenStore / skillStore / translator / skillPackage / kmApiClient
│   ├── middleware/          # errorHandler / logger
│   ├── types/               # ApiKey / KBDocument / Skill
│   └── utils/               # generateId / maskToken / getClientIp
tests/
├── unit/                    # Vitest 单元测试
└── e2e/                     # Playwright E2E
data/                        # 运行时数据 (tokens.json / skills.json / api-logs.json / api-keys.json)
dist/                        # 构建产物 (含 km-portal-linux 47MB 单文件)
docs/                        # DEPLOY / RELEASE / IMPROVEMENT / PROBLEM-AUDIT / TEST-SCENARIOS
scripts/                     # build-server.cjs / e2e-verify.ps1
.github/workflows/           # CI
```

## 测试

```bash
npm run test:unit           # Vitest 单元测试
npm run test:e2e            # Playwright E2E
npm run test:ps1            # PowerShell 端到端验证（需服务运行）
npm run lint                # ESLint
npm run typecheck           # tsc --noEmit
```

## 安全声明

`.env.example` 是模板文件，**不包含真实密钥**。所有真实凭据应放在 `.env`（已加入 `.gitignore`）。如发现密钥泄漏，请立即在对应平台**轮换**。

## 贡献

1. Fork & Pull Request
2. 提交前 `npm run lint && npm run typecheck && npm run test:unit` 须全绿
3. 遵循 AGENTS.md 中的提交规范 (`feat:` / `fix:` / `docs:` / `chore:` / `build:`)

## 许可证

[MIT](LICENSE)
