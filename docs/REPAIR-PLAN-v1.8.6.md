# KM-Portal v1.8.6 一站式平台修复方案与跟踪计划

> **目标**: 一次性修复盘点中识别的全部 20 个问题,使 v1.8.5 的"一站式 KM Studio 平台"达到可生产交付状态。
> **策略**: 12 个批次顺序执行,每批解决一类问题 → 最小验证命令 → 通过后再进入下一批。
> **跟踪**: 本文件即跟踪表,每个任务有 ID + 验收标准,执行时实时更新状态。
> **创建日期**: 2026-06-30
> **基于 HEAD**: `06b552c` (v1.8.5)
> **目标版本**: v1.8.6

---

## 1. 问题总览(20 项)

| 优先级 | ID | 问题 | 涉及文件 | 类型 |
|---|---|---|---|---|
| 🔴 P0 | B1 | Wizard 状态枚举分裂(done/error vs completed/failed) | routes/wizard.ts, services/wizard.ts, useWizard.ts, KMStudioPage.tsx | 编译/运行 |
| 🔴 P0 | B2 | wizard generate 响应结构错位(无 products,字段路径错) | routes/wizard.ts, services/wizard.ts, KMStudioPage.tsx | 编译/运行 |
| 🔴 P0 | B3 | WizardPage.tsx 缺 import(Card, Steps) | WizardPage.tsx | 编译 |
| 🔴 P0 | B4 | StatsPanel 必填 props 不足(只传 kbId) | StatsPanel.tsx, KMStudioPage.tsx | 编译 |
| 🔴 P0 | B5 | product type 枚举分裂(template/structure vs ai_template/tree) | GenerateStage.tsx, ProductCard.tsx, services/wizard.ts, routes/wizard.ts | 编译/运行 |
| 🟠 P1 | B6 | TreeVisualizer 强制 children=undefined,树退化为 1 层 | TreeVisualizer.tsx, kbTreeVisualizer.ts | 运行 |
| 🟠 P1 | B7 | KMStudioPage PRODUCT_META 兜底用不存在 description 字段 | KMStudioPage.tsx, services/wizard.ts | 编译 |
| 🟠 P1 | B8 | KBCredentialForm onSubmit/onSuccess 双回调未完成 | KBCredentialForm.tsx, InitStage.tsx | 运行 |
| 🟠 P1 | B9 | routes/index.ts 死代码聚合 | routes/index.ts, server/index.ts | 维护 |
| 🟠 P1 | B10 | routes/wizard.ts ai-prompts 端点重复声明(2 处) | routes/wizard.ts | 维护 |
| 🟠 P1 | B11 | wizard.ts 未使用的 getOpenApiSpecUrl/getSwaggerUrl | services/wizard.ts | 维护 |
| 🟠 P1 | B12 | 版本号 3 处不一致 | package.json, server/index.ts, AGENTS.md | 监控 |
| 🟠 P1 | B13 | 5 步向导 vs 4 stage 文档不一致 | AGENTS.md | 文档 |
| 🟡 P2 | B14 | CI 未跑 Playwright E2E | ci.yml, e2e/api.spec.ts | 测试 |
| 🟡 P2 | B15 | e2e/api.spec.ts 覆盖薄 | tests/e2e/ | 测试 |
| 🟡 P2 | B16 | wizard generate 状态机无单元测试 | tests/unit/ | 测试 |
| 🟡 P2 | B17 | wizard 集成测试缺失 | tests/unit/ | 测试 |
| 🟡 P2 | B18 | KMStudioPage 端到端流程无保护 | tests/e2e/ | 测试 |
| 🟡 P2 | B19 | 服务端日志散落(server_err/server.err/server.log) | 根目录 .gitignore | 维护 |
| 🟡 P2 | B20 | .env.example 与 .env 文档区分不清 | README.md, DEPLOY.md | 文档 |

---

## 2. 执行原则

1. **每批一类**: 一次只解决一个 ID,验证通过才进入下一批
2. **最小验证**: 每批只跑必需的命令,避免 token 浪费
3. **先 P0 后 P1 再 P2**: 阻塞级先解决
4. **状态实时更新**: 每批完成后在 §5 更新执行结果
5. **失败熔断**: 任一批连续 3 次失败 → 暂停,回滚到 HEAD,等用户决策

---

## 3. 批次执行计划(12 批)

### 批次 0: 准备(基线与回滚点)

| 步骤 | 命令 | 产物 |
|---|---|---|
| 0.1 确认基线 | `git log -1 --oneline` | 记录当前 SHA |
| 0.2 创建修复分支 | `git checkout -b fix/v1.8.6-repair` | 独立分支隔离 |
| 0.3 跑基线构建 | `npm run build:all 2>&1 \| tail -20` | 记录基线错误数 |
| 0.4 跑基线 lint | `npm run lint 2>&1 \| tail -20` | 记录 lint 错误数 |
| 0.5 跑基线单测 | `npm run test:unit 2>&1 \| tail -20` | 记录 pass/fail 数量 |

**验收**: 基线 SHA 记录在 §5,允许有 P0 错误(已盘点)

---

### 批次 1 (B1): Wizard 状态枚举统一

**目标**: 服务端 `done/error` 与客户端 `completed/failed` 对齐,KMStudioPage 轮询正确停止

**改动**:
- `src/client/services/wizard.ts:60` 改 `'completed'\|'failed'` → `'done'\|'error'`
- `src/client/pages/Wizard/hooks/useWizard.ts:23` 删除 `completed/failed`,只保留 `done/error`
- `src/client/pages/Wizard/KMStudioPage.tsx:125` 同步改为 `done/error`
- `src/client/pages/Wizard/stages/GenerateStage.tsx` 引用状态字符串处同步
- `src/client/pages/Wizard/stages/InitStage.tsx` 同上

**验证**:
- `npx tsc -p tsconfig.server.json --noEmit` exit 0
- `npx tsc --noEmit` (前端) exit 0
- `npx vitest run tests/unit/skillRouteFieldCompat.test.ts` (回归)
- 手动 grep: `grep -rn "'completed'\|'failed'" src/` 应只出现在注释/字符串描述中

**验收**: KMStudioPage 轮询 status 命中 `done` 时 `setPolling(false)` 触发

---

### 批次 2 (B2): wizard generate 响应结构对齐

**目标**: 客户端能正确读 generate 返回的 jobId,轮询 status 正确读到 products

**改动**:
- `src/server/routes/wizard.ts:386-388` generate 返回值增加 `products: []`(初始空数组,异步填充)
- `src/server/routes/wizard.ts:459` status 响应统一 `data.products`(去掉 `result` 包裹,已无)
- `src/client/services/wizard.ts:53-55` GenerateResult 类型 `{ jobId, status, products }`
- `src/client/services/wizard.ts:60-63` JobStatus 响应也用 `products`
- `src/client/pages/Wizard/KMStudioPage.tsx:120-138` 修正读路径 `res.data.data.products`(去掉 `.result?`)

**验证**:
- tsc 前端通过
- 手工 mock: `wizardApi.generate` 返回 `{data: {jobId, status, products: []}}` 后 setState 成功
- `npx vitest run tests/unit/skillRouteFieldCompat.test.ts` 仍过

**验收**: 轮询 status 时 products 从空数组逐步填充 5 个产物

---

### 批次 3 (B3): WizardPage.tsx 补 import

**目标**: tsc 编译通过

**改动**:
- `src/client/pages/Wizard/WizardPage.tsx:1` 改 `import { PageHeader }` → `import { Card, Steps, PageHeader } from 'antd'`

**验证**:
- `npx tsc --noEmit` exit 0
- 不引入未使用的 import(`tsc` 有 noUnusedLocals 检查)

**验收**: WizardPage 编译 0 错误

---

### 批次 4 (B4): StatsPanel props 修复

**目标**: KMStudioPage 调用符合 StatsPanel 接口

**方案**: 改为可选 props + 默认值
- `src/client/pages/Wizard/components/StatsPanel.tsx:11-18` 所有 props 改为可选
- 加默认值:docCount=0, treeCount=0, recentCalls=0, avgLatency=0, kbName=''

**验证**:
- tsc 通过
- KMStudioPage.tsx:245 调用不变(只传 kbId),运行不报错

**验收**: StatsPanel 5 个 props 全可选,KMStudioPage 不改也能编译

---

### 批次 5 (B5): product type 枚举统一

**目标**: 客户端用 `ai_template/tree`,服务端一致;ProductCard 渲染不 undefined

**改动**:
- `src/client/pages/Wizard/stages/GenerateStage.tsx:23-37` 改 `'template'` → `'ai_template'`,`'structure'` → `'tree'`
- `src/client/pages/Wizard/components/ProductCard.tsx:15-37` iconMap/typeNameMap/typeColorMap 同步改名(添加 `ai_template`/`tree` 键,删 `template`/`structure`)
- `src/client/services/wizard.ts:37` ProductType 已是 `ai_template/tree`,无变化

**验证**:
- tsc 通过
- KMStudioPage 中 PRODUCT_META 查找命中(已是 5 个正确键)
- 产物卡片显示"AI 指令模板"和"目录结构"而不是"AI 模板"和"目录结构"

**验收**: 5 个 ProductType 全栈统一,无 `undefined` 兜底

---

### 批次 6 (B6): TreeVisualizer 树形结构递归

**目标**: 树形结构真正递归展示,不止 1 层

**改动**:
- `src/client/pages/Wizard/components/TreeVisualizer.tsx:21-27` 去掉 `children: undefined`,调用 kbTreeVisualizer.buildTreeFromFlat 转换
- `src/client/services/wizard.ts:19-28` TreeNode 类型加 `children?: TreeNode[]`
- `src/server/services/kbTreeVisualizer.ts` 暴露 buildTreeFromFlat 给前端(共享类型已在 shared/types/kb.ts,确认导出)

**验证**:
- tsc 通过
- 树形结构展示 depth > 1 的层级

**验收**: 树形组件支持任意深度

---

### 批次 7 (B7): KMStudioPage PRODUCT_META 类型修复

**目标**: ProductItem 类型有 description 字段,无 undefined 兜底

**改动**:
- `src/client/services/wizard.ts:39-50` ProductItem 加 `description: string`(必填,服务端 wizard 路由 generateJob 已设)
- `src/client/services/wizard.ts:42` 删除 icon(已无类型声明,但 PRODUCT_META 用 product.description 兜底需同步)
- `src/client/pages/Wizard/KMStudioPage.tsx:62` `meta.description || product.description` 改为只 `meta.description`

**验证**:
- tsc 通过
- 服务端 generateJob 中每个 products[i] 已设 `description` 字段(检查 routes/wizard.ts 各分支)

**验收**: ProductItem.description 全栈存在

---

### 批次 8 (B8): KBCredentialForm 回调一致性

**目标**: onSubmit 是主流程,onSuccess 删除,InitStage 收口

**改动**:
- `src/client/pages/Wizard/components/KBCredentialForm.tsx:7-29` 删 `onSuccess`,只保留 `onSubmit` 一个回调
- `src/client/pages/Wizard/KMStudioPage.tsx:209` 改 `onSuccess={handleInit}` → `onSubmit={handleInit}`
- `src/client/pages/Wizard/stages/InitStage.tsx:12-29` 已是 `onSubmit` 主流程,无需改

**验证**:
- tsc 通过
- InitStage 和 KMStudioPage 两条路径都不破

**验收**: 单一回调契约

---

### 批次 9 (B9-B11): 死代码与冗余清理

**目标**: 删 routes/index.ts 聚合,删 ai-prompts 重复,删未使用 API

**改动**:
- `src/server/routes/index.ts:1-16` 文件删除(或保留为 README,标明"已弃用,见 server/index.ts 直接挂载")
- `src/server/routes/wizard.ts:621-663` 删第二次 ai-prompts 实现(后注册的赢,但 402-448 那版结构更标准,保留)
- `src/client/services/wizard.ts:127-131` 保留 getOpenApiSpecUrl/getSwaggerUrl(KMStudioPage/ApiDocs 未来可用) → **撤销此改动,保留 API,加注释**
- 服务端 routes/wizard.ts:559-619 `/openapi.json` 和 `/swagger` 是核心 API,**保留**

**验证**:
- tsc 通过
- `grep -rn "wizardRouter\|adminRouter\|skillRouter" routes/index.ts` 应为空
- npm run build:all 通过

**验收**: 死代码清理,功能未破

---

### 批次 10 (B12-B13): 版本号与文档同步

**目标**: 3 处版本号一致,AGENTS.md 描述与代码一致

**改动**:
- `package.json:3` `"version": "1.7.1"` → `"1.8.6"`
- `src/server/index.ts:35` `version: '1.0.0'` → `'1.8.6'`
- `AGENTS.md:3` 最后更新日期 2026-06-30 保持,版本历史新增 v1.8.6 修复条目
- AGENTS.md 描述"5 步向导" → 改为"4 tab 一站式面板 + Wizard 4 stage 流程"或保留 5 步但 wizard generate 拆分为 2 步

**验证**:
- `curl /api/health` 返 `version: "1.8.6"`
- `npm pkg get version` 返 `1.8.6`

**验收**: 三处版本号一致

---

### 批次 11 (B14-B18): 测试补强

**目标**: 核心流程有回归保护

**新增**:
- `tests/unit/wizardRoute.test.ts` (5 测试):
  - POST /init 字段验证(kbId/token/kbName 必填)
  - POST /generate 返回 `{jobId, status, products: []}`
  - GET /status/:jobId 状态机 done/error 正确
  - POST /ai-prompts 返 5 文件
  - POST /mcp-configs 返 4 文件
- `tests/e2e/km-studio.spec.ts` (Playwright, 3 步骤):
  - 访问 /km-studio,输入凭证,断言看到 5 卡片
  - 点击生成,断言轮询后 status=done
  - 断言 5 个产品卡片有下载按钮

**CI 改造**:
- `.github/workflows/ci.yml` 增加 `npm run test:e2e` job(需先 `npx playwright install --with-deps chromium`)

**验证**:
- `npm run test` 全过
- CI lint+typecheck+unit+e2e+build 全过

**验收**: KM Studio 端到端有 Playwright 保护

---

### 批次 12 (B19-B20): 收尾

**目标**: 工作区干净,部署文档清晰

**改动**:
- `.gitignore` 添加 `server*.log` 排除(避免日志污染)
- 删根目录散落的 `server_err.log` / `server.err.log`(只保留 .gitignore 不再追踪)
- `README.md` 增加 ".env 与 .env.example 区别" 小节
- `DEPLOY.md` 增加"部署后必跑 `bash scripts/post-deploy.sh`" 步骤

**验证**:
- `git status` 干净(允许 AGENTS.md 修改 + 修复产生的文件)
- `git ls-files | grep -E "server.*\.log"` 应为空

**验收**: 工作区干净,文档清晰

---

## 4. 验证命令清单(按批次)

| 批次 | 必跑 | 可选 |
|---|---|---|
| 0 | `git log -1 --oneline` | `npm run build:all` 基线 |
| 1-5 | `npx tsc -p tsconfig.server.json --noEmit` + `npx tsc --noEmit` | `npx vitest run` |
| 6-10 | `npx tsc -p tsconfig.server.json --noEmit` + `npx tsc --noEmit` | `npm run build:all` |
| 11 | `npm run test:unit` | `npx playwright test` |
| 12 | `git status` | `git ls-files \| grep log` |

**控制 token 关键**:
- 一次只跑一组命令,失败立刻熔断
- 不用 `--watch` / `serve` / `dev` 长时间命令
- 不在循环里多次重试

---

## 5. 执行跟踪表(实时更新)

| 批次 | 状态 | 起始 SHA | 结束 SHA | 实际改动文件 | 验证结果 | 备注 |
|---|---|---|---|---|---|---|
| 0 | 待执行 | - | - | - | - | - |
| 1 | 待执行 | - | - | - | - | - |
| 2 | 待执行 | - | - | - | - | - |
| 3 | 待执行 | - | - | - | - | - |
| 4 | 待执行 | - | - | - | - | - |
| 5 | 待执行 | - | - | - | - | - |
| 6 | 待执行 | - | - | - | - | - |
| 7 | 待执行 | - | - | - | - | - |
| 8 | 待执行 | - | - | - | - | - |
| 9 | 待执行 | - | - | - | - | - |
| 10 | 待执行 | - | - | - | - | - |
| 11 | 待执行 | - | - | - | - | - |
| 12 | 待执行 | - | - | - | - | - |

---

## 6. 风险与回滚

### 风险点
- **B5 枚举改名** 影响最大,可能漏改某处 type literal
- **B2 响应结构** 改了 services/wizard.ts 类型,前端多个 .ts 引用,需全栈同步
- **B9 死代码删除** 如有遗留 import 链会编译失败

### 回滚策略
每批提交一次(只在该批完全通过验证后),如某批失败:
```bash
git revert HEAD           # 撤销该批
git checkout HEAD~1 -- .  # 恢复文件
```

### 熔断规则
- 任一批 tsc 失败 3 次 → 暂停,保留分支,等用户决策
- 任一批 vitest 失败 3 次 → 同上
- 紧急熔断命令: `git checkout main && git branch -D fix/v1.8.6-repair`

---

## 7. 交付物清单

执行完成后必须交付:
- [ ] 20 个问题全部修复(本文件 §5 状态全部 ✅)
- [ ] `npm run test:unit` 全过
- [ ] `npm run build:all` 退出码 0
- [ ] 新增测试覆盖 wizard 核心 5 端点
- [ ] 新增 Playwright e2e 保护 KMStudioPage
- [ ] 版本号 3 处一致为 1.8.6
- [ ] AGENTS.md 版本历史更新 v1.8.6 条目
- [ ] `git log --oneline -20` 显示本次修复提交
- [ ] 工作区干净(仅修复相关文件未提交)
- [ ] CI 流水线更新(加 e2e 步骤)

---

## 8. 下一步

1. **请用户确认本方案**: 检查 20 项是否完整,优先级是否合理,批次划分是否接受
2. 用户确认后 → 开始 **批次 0**(准备基线)
3. 批次 0 通过后 → 进入批次 1,每批结束更新本文件 §5
4. 全部 12 批完成 → 写最终交付报告,更新 AGENTS.md

---

> **维护说明**: 本文件是活的,每批执行后必须更新 §5。文档作为跟踪管理的核心载体。
