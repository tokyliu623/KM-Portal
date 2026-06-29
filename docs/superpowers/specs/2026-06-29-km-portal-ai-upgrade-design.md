# KM-Portal 智能化升级方案（双任务并行）

> 日期：2026-06-29
> 作者：BlueCode Agent
> 状态：待用户审批

---

## 一、参考文件核心思想提炼

从 3 份参考材料中提取的 AI 化设计 DNA：

| 来源 | 核心思想 | 对后台的映射 |
|------|----------|--------------|
| **002 王哲 · Token优化** | 「导航地图 > 百科全书」：按需加载、智能裁剪、4KB 对齐契合 Prompt Cache | 后台不应堆砌所有数据卡片，而是根据用户意图**按场景装配视图** |
| **002 · 意图路由** | fix/refactor/general/analyze 场景差异化配置 | 仪表盘应能识别**角色意图**（运营/管理/审计/排障）并切换 UI |
| **002 · 跨插件共享** | `globalThis` 共享状态 + 统一裁剪 | 后台需要一个**全局智能层**（如 Copilot Sidebar）跨页共享上下文 |
| **004 王俊杰 · Agent 交付** | 从一次需求到生产可用的**流程化**实践：评审→灰度→监控→回滚 | 后台应嵌入**AI 助理**，把"创建/编辑/发布"封装成 Agent 工作流（输入意图→AI 生成→人工复核→落地） |
| **bluecode_vapd_presentation** | vivo 内部 VAPD 演示风格（已下载待解析） | 大概率包含 vivo 现有 AI 后台的设计范式：对话式交互、卡片+流式输出、状态机可视化 |

> 注：`bluecode_vapd_presentation.html`（463KB）是关键视觉参考，建议下一步用 `webfetch` 拉取解析后纳入设计语言基线（需用户授权联网）。

---

## 二、当前产品现状 vs AI 化目标差距

| 页面 | 当前形态 | 主要问题 | AI 化目标 |
|------|----------|----------|----------|
| **Dashboard** (`Dashboard/index.tsx`) | 4 个 antd `<Card>` + `<Statistic>` 数字孤岛 | 数据静态、无叙事、无上下文、avgLatency 硬编码为 0 | AI 摘要卡 + 异常巡检报告 + 自然语言查询 |
| **TokenManage** | antd Table + inline Form 录入 | 表单塞在 Table 上方，编辑态缺失（PUT 实现但无入口），撤销/删除为危险操作无二次确认后无影响预览 | Token 健康度雷达图 + 权限影响预演 + 智能续期 |
| **KBBrowser** | 输入 KB ID → 树形展开 | 必须先知道 ID、Tree 无搜索、节点点击无内容预览 | 知识库自然语言检索 + RAG 问答面板 |
| **DocEditor** | 简单 Input + TextArea 提交 | 无模板、无协作、无 AI 辅助写作 | AI 续写/改写/翻译 + 模板库 + 草稿自动保存 |
| **SkillGen** | Modal 录入 → 生成 | 生成内容仅可查看/复制/导出，无版本、无对比、无迭代 | Skill 工坊：多版本对比 + AI 自动优化提示词 |
| **ApiDocs** | Tabs + JSON 字面量 | 静态文档，无 Try It、无鉴权测试、无 Schema 校验 | AI 助手解读 + 在线试调 + 智能代码片段生成 |
| **Layout** | 左侧 Sider + 顶部 Title | 无全局搜索、无 AI 入口、无通知中心、无角色切换 | **全局 Copilot Sidebar**（AI 化核心入口） |

---

## 三、任务 1：功能层修复方案（保障所有功能可用）

**目标**：让 6 个页面 + 1 个 Layout 的**所有已有功能可点可用**；测试驱动修复；不引入新功能。

### 1.1 已识别缺陷清单（Phase 1 根因已查实）

| # | 缺陷 | 根因 | 修复点 | 风险 |
|---|------|------|--------|------|
| F1 | `useStatsStore` 的 `setStats` 强制要求两条同形数据，但 `getOverview` 只返回单条 `totalCalls` | 状态模型与后端契约不一致 | 重塑为 `StatsOverview` 单一对象，store 改为 `setOverview` | 低 |
| F2 | `Dashboard` `avgLatency` 写死为 0 | 后端 `/stats/overview` 未提供该字段 | 后端补 `avgLatency` 计算；前端改为 `res.data.avgLatency ?? 0` | 中 |
| F3 | `TokenManage` 编辑功能缺失 | 路由/UI 未暴露 PUT `/tokens/:id` | 表格行加 "编辑" 按钮，弹 Modal 复用 Form | 低 |
| F4 | `KBBrowser` 节点点击无内容预览 | Tree 缺 `onSelect` 回调 | 选中后右侧 `<Card>` 渲染内容（`getContent`） | 中 |
| F5 | `KBBrowser` `renderTreeNodes` 中 `children` 永远 `undefined`，导致 `loadData` 必走 | 误用 Tree API | 改为 `children: undefined` 配合 `loadData`（已部分实现），需验证后端返回结构一致 | 中 |
| F6 | `DocEditor` 无草稿持久化 | 无 localStorage/sessionStorage | 引入 `useDraft(key)` Hook | 低 |
| F7 | `SkillGen` `handleExport` 取 `skill.content` 而非 `res.data` | 变量作用域错位 | 改为读取 `res.data` 或前端 state | 低 |
| F8 | `ApiDocs` 使用废弃 `Tabs.tabPane` 而非 `items` API | antd v5 已弃用 `TabPane` | 改为 `<Tabs items={...} />` | 低 |
| F9 | 全局 axios 拦截器无 401 跳登录 | `services/api.ts` 缺拦截逻辑 | 增加 `response.use` 拦截，统一 toast 401/403/500 | 中 |
| F10 | 6 个页面均缺统一 Loading/Empty/Error 兜底 | 各自写 `<Loading/>` 但无错误态 | 抽取 `<DataState loading empty error>` 组件 | 低 |
| F11 | 路由未配置 `/` 重定向到 `/dashboard` | 首次进入白屏 | `Router` 加 `<Route path="/" element={<Navigate to="/dashboard" />}> ` | 低 |
| F12 | `useTokenStore` 未确认存在 | 文件 `stores/useTokenStore.ts` 是否实现需查 | 验证存在，否则补充 | 中 |

### 1.2 测试驱动实施顺序

```
RED → GREEN → REFACTOR，每个任务 5-15 分钟
```

| 步骤 | 子任务 | 验证标准 |
|------|--------|----------|
| T1 | 创建 `__tests__/services/stats.test.ts` mock axios，验证 `getOverview` 返回结构 | vitest pass |
| T2 | 修复 F1+F2，重构 `useStatsStore` 为 `setOverview` | 类型+单测通过 |
| T3 | 修复 F3，TokenManage 加编辑 Modal | 手动点开/保存/列表更新 |
| T4 | 修复 F4+F5，KBBrowser 选中预览 | 节点点击→内容卡渲染 |
| T5 | 修复 F6+F7+F8 | 各页无控制台报错 |
| T6 | 修复 F9+F10+F11+F12 | 路由跳转/错误态正常 |
| T7 | 跑 `npm run build:all` + `pkg:linux` 验证产物 | 退出码 0，二进制 47MB±1MB |
| T8 | 部署脚本 `deploy-server.sh` 演练 | curl `/api/health` 200 |

### 1.3 验收清单

- [ ] 6 个页面所有按钮、表单、表格行操作可点击且行为符合预期
- [ ] 网络异常时显示友好错误（区分 401/403/404/500）
- [ ] 控制台 0 error、0 warning
- [ ] `npm run lint` 通过
- [ ] `npm run build:all` 退出码 0
- [ ] `npm run pkg:linux` 生成可执行文件
- [ ] 服务器 `curl http://127.0.0.1:5053/api/health` 返回 200
- [ ] 同步修复 + 验收报告写入 `AGENTS.md` 的"问题排查记录"章节

---

## 四、任务 2：AI 化设计方案（设计稿交付，不实现）

**目标**：把"传统后台"重构为"AI 时代产品"。**本任务仅交付设计文档**，包含：信息架构、组件库、交互模型、视觉语言、状态机。

### 2.1 设计哲学：从 CMS 到 Copilot OS

```
旧范式（CMS 思维）：用户去每个页面完成操作
  Sidebar → Page → Form → Submit → Toast

新范式（Copilot OS 思维）：AI 主动协同，用户做决策
  Copilot Sidebar 全程在场
  ├─ 感知上下文（当前页/角色/历史/数据）
  ├─ 主动建议（异常检测/智能续期/内容推荐）
  ├─ 任务代办（一句话完成多步流程）
  └─ 流式呈现（打字机/卡片堆叠/可视化）
```

### 2.2 信息架构重构

| 原模块 | AI 化升级 | 关键变化 |
|--------|-----------|----------|
| **全局 Copilot Sidebar**（新增） | 常驻右侧 360px，可折叠 | 自然语言入口、智能建议流、任务历史 |
| **Dashboard** | 改为「**今日工作台**」 | AI 早报 + 待办任务 + 异常告警 + 数据叙事卡 |
| **TokenManage** | 改为「**Token 健康中心**」 | 权限矩阵 + 风险评分 + 智能续期建议 |
| **KBBrowser** | 改为「**知识探索**」 | RAG 检索 + 相似文档 + AI 问答 |
| **DocEditor** | 改为「**AI 文档工坊**」 | 模板/续写/翻译/校对/发布一体化 |
| **SkillGen** | 改为「**Skill 工坊**」 | 多版本对比 + AI 自动优化 + 一键部署 |
| **ApiDocs** | 改为「**API 实验室**」 | 在线试调 + AI 解读 + 代码生成 |

### 2.3 视觉语言

| 维度 | 旧 | 新（AI 化） |
|------|-----|-------------|
| 配色 | antd 默认蓝 (#1890ff) | **深空灰 + AI 紫渐变**（#0B0D17 → #6366F1 → #A855F7） |
| 字体 | 系统默认 | 思源黑体 + JetBrains Mono（数字/代码） |
| 圆角 | 6px | 12px（更柔和） |
| 阴影 | 0 2px 8px | **多层柔光**（0 0 0 1px rgba, 0 8px 24px -8px） |
| 动效 | 闪现 | **流式打字机**、卡片堆叠、骨架屏 |
| 密度 | 中等 | **宽松**（呼吸感） |
| 状态 | Tag/徽标 | **状态机可视化**（节点+连线+流转方向） |

> 配色参考 vivo 蓝紫渐变体系（#4158D0 → #C850C0 → #FFCC70），呼应品牌色。

### 2.4 核心组件库设计（新增 12 个）

| 组件 | 用途 | 关键交互 |
|------|------|----------|
| `<CopilotSidebar>` | AI 入口 | 浮动按钮 → 360px 抽屉；流式输出 |
| `<AIBubble>` | 对话气泡 | typing 动效、Markdown 渲染、代码高亮 |
| `<IntentCard>` | 主动建议 | 卡片+接受/拒绝/稍后 |
| `<StreamingChart>` | 实时数据 | ECharts 流式追加、骨架占位 |
| `<DiffViewer>` | 文档对比 | 单词级 diff、左右同步滚动 |
| `<WorkflowTimeline>` | 流程可视化 | 节点+状态+耗时+责任人 |
| `<AIDraftEditor>` | AI 辅助写作 | 选区续写/改写/翻译/校对 |
| `<KnowledgeRAGPanel>` | RAG 检索 | 来源可点击、相似度评分 |
| `<TokenRadar>` | 权限健康度 | 5 维雷达图、风险评分 |
| `<EmptyStateAI>` | 空态 | AI 引导文案 + 一键示例 |
| `<SkeletonFlow>` | 加载态 | 流式骨架，对应 Copilot |
| `<ActionConfirm>` | 危险操作 | 二次确认 + 影响预览 + 撤销倒计时 |

### 2.5 交互模型：四类核心场景

| 场景 | 用户行为 | AI 协作 |
|------|----------|---------|
| **被动浏览** | 看 Dashboard | AI 推送异常、推荐行动 |
| **主动查询** | "上周 API 调用量最高的 KB？" | NL2SQL 解析 → 流式结果 → 可下钻 |
| **流程代办** | 创建一个新 KB | 收集参数（对话式）→ 编排多步 API → 状态可视化 |
| **辅助创作** | 编辑 Skill Prompt | 选区续写/优化/翻译 + 实时 diff |

### 2.6 技术栈增量

| 类别 | 选型 | 理由 |
|------|------|------|
| 动画 | `framer-motion` | 流式、骨架、转场 |
| 图表 | `@ant-design/charts` 升级或 ECharts | 流式、关系图 |
| Markdown | `@uiw/react-md-editor` | 文档/Skill 编辑 |
| Diff | `react-diff-viewer-continued` | 多版本对比 |
| AI 流式 | `EventSource` + SSE | 后端推送 token 流 |
| 状态 | 现有 zustand + 新增 `useCopilotStore` | 跨页上下文 |
| 主题 | antd `ConfigProvider` + CSS Variables | 暗色模式预留 |

### 2.7 后端增量（支撑 AI 化）

| 端点 | 方法 | 用途 |
|------|------|------|
| `/api/ai/chat` | POST SSE | Copilot 对话流 |
| `/api/ai/summary` | POST | 仪表盘早报生成 |
| `/api/ai/continue` | POST | 文档续写 |
| `/api/ai/optimize` | POST | Skill 提示词优化 |
| `/api/ai/rag` | POST | 知识库语义检索 |
| `/api/workflow/:type` | POST | 多步流程编排 |

### 2.8 验收标准（设计稿层面）

- [ ] 信息架构图（IA Diagram）
- [ ] 6+1 页面线框图（Lo-fi Wireframe）
- [ ] 高保真视觉稿（Hi-fi Mockup，1-2 个关键页）
- [ ] Copilot Sidebar 交互流程图
- [ ] 组件库 Storybook 列表
- [ ] 状态机图（Token 生命周期 / Skill 版本 / 文档发布）
- [ ] 动效规范文档
- [ ] 配色 / 字体 / 间距 Token 表
- [ ] 风险与权衡说明（AI 幻觉、成本、延迟）

### 2.9 实施路线图

| 阶段 | 周期 | 内容 |
|------|------|------|
| **Phase 0：地基** | 1 周 | 主题系统、字体、布局容器、Copilot Sidebar 骨架 |
| **Phase 1：仪表盘** | 1 周 | 早报 + 待办 + 异常 |
| **Phase 2：知识/文档** | 2 周 | RAG + AI 写作 |
| **Phase 3：Token/Skill** | 1.5 周 | 雷达 + Skill 工坊 |
| **Phase 4：API 实验室** | 1 周 | 在线试调 + AI 解读 |
| **Phase 5：打磨** | 1 周 | 动效、空态、错误态 |

---

## 五、并行执行计划（dispatching-parallel-agents）

**两个任务互不依赖，可并行启动**：

| Agent | 任务 | 模型 | 输入 | 输出 | 上下文隔离 |
|-------|------|------|------|------|-----------|
| **A1**（Task: build） | 任务1：功能修复 + 测试 | 快速 | 当前代码全量 | 修复 PR + 测试报告 | 独立 git worktree |
| **A2**（Task: general） | 任务2：AI 化设计稿 | 标准 | 参考文件 + 当前 IA | 设计 spec（不写代码） | 只读，不动文件 |

**汇合点**：两 agent 完成后，主会话拉起 `verification-before-completion` + `requesting-code-review` 双审查，整理后交付用户最终验收。

---

## 六、待用户决策的关键问题

请回答以下 1-2 个最关键问题，我再继续细化（其他可默认按"推荐方案"）：

1. **设计参考基线**：`bluecode_vapd_presentation.html`（463KB）是否需要我用 webfetch 解析后纳入视觉规范？这是最接近 vivo 内部 AI 后台真实风格的资料。

2. **Copilot Sidebar 的 AI 后端**：当前 KM-Portal 没有 LLM 集成。AI 化设计中涉及 5 个 AI 端点，**是否已有可用的 LLM 服务**（内部/vivo 内部/外网）？还是先做 UI、留 mock 接口？

3. **任务1修复的"已开发功能"边界**：当前 AGENTS.md 列了 6 个页面、5 套 API。是否以**这 6 个页面 + 既有 5 套 API 全部可点可用**为标准？还是只修用户已点过的 tab？

4. **实施模式**：默认我会**先两个 agent 并行跑**，再统一 review。如果你想**先单独完成任务1验收后再启动任务2**，请告诉我。

---

## 七、Change Manifest

```json
{
  "plan_id": "plan_20260629_180000",
  "task_type": "refactor+feature",
  "priority": "high",
  "steps": [
    {
      "step_id": 1,
      "sub_agent": "build",
      "target_file": "src/client/stores/useStatsStore.ts",
      "target_symbol": "setStats",
      "change_intent": "重塑 store 为 setOverview 单一对象",
      "priority": "high"
    },
    {
      "step_id": 2,
      "sub_agent": "build",
      "target_file": "src/client/pages/Dashboard/index.tsx",
      "target_symbol": "Dashboard",
      "change_intent": "修复 avgLatency 写死为 0，绑定 store 新契约",
      "priority": "high"
    },
    {
      "step_id": 3,
      "sub_agent": "build",
      "target_file": "src/client/pages/TokenManage/index.tsx",
      "target_symbol": "TokenManage",
      "change_intent": "新增编辑 Modal 入口，复用 Form 走 PUT /tokens/:id",
      "priority": "high"
    },
    {
      "step_id": 4,
      "sub_agent": "build",
      "target_file": "src/client/pages/KBBrowser/index.tsx",
      "target_symbol": "KBBrowser",
      "change_intent": "Tree 节点 onSelect → 右侧内容预览卡片",
      "priority": "high"
    },
    {
      "step_id": 5,
      "sub_agent": "build",
      "target_file": "src/client/pages/DocEditor/index.tsx",
      "target_symbol": "DocEditor",
      "change_intent": "引入 useDraft 草稿持久化",
      "priority": "medium"
    },
    {
      "step_id": 6,
      "sub_agent": "build",
      "target_file": "src/client/pages/SkillGen/index.tsx",
      "target_symbol": "handleExport",
      "change_intent": "修复 skill.content 变量作用域错位",
      "priority": "medium"
    },
    {
      "step_id": 7,
      "sub_agent": "build",
      "target_file": "src/client/pages/ApiDocs/index.tsx",
      "target_symbol": "ApiDocs",
      "change_intent": "TabPane 替换为 items API",
      "priority": "medium"
    },
    {
      "step_id": 8,
      "sub_agent": "build",
      "target_file": "src/client/services/api.ts",
      "target_symbol": "axios.interceptors.response",
      "change_intent": "增加 401/403/404/500 统一拦截与 toast",
      "priority": "high"
    },
    {
      "step_id": 9,
      "sub_agent": "build",
      "target_file": "src/client/router.tsx",
      "target_symbol": "Router",
      "change_intent": "新增 / 重定向到 /dashboard",
      "priority": "low"
    },
    {
      "step_id": 10,
      "sub_agent": "build",
      "target_file": "src/client/components/DataState.tsx",
      "target_symbol": "DataState",
      "change_intent": "新增统一 Loading/Empty/Error 兜底组件",
      "priority": "medium"
    },
    {
      "step_id": 11,
      "sub_agent": "general",
      "target_file": "docs/superpowers/specs/2026-06-29-ai-ui-upgrade-design.md",
      "target_symbol": "DesignSpec",
      "change_intent": "交付 AI 化 UI/UX 设计稿（IA + 视觉语言 + 组件库 + 状态机 + 路线图）",
      "priority": "high"
    }
  ],
  "summary": "双任务并行：任务1功能修复（A1 build agent，12 缺陷项），任务2 AI 化设计交付（A2 general agent，输出设计 spec 不写代码）。"
}
```

---

**当前状态**：本 spec 已写入。**未对源码做修改**。

如确认上述方向，下一步：
- 启动 `dispatching-parallel-agents` 派发 A1（功能修复）+ A2（设计细化）双分身并行执行
- 你回答上面 4 个问题后，方案可进一步收敛
