# KM-Portal 知识运营一站式平台 · 整体方案设计

> 版本: v1.0
> 日期: 2026-06-30
> 状态: 草案 (Draft)
> 作者: BlueCode Agent

---

## 0. 背景与目标

### 0.1 背景

KM-Portal 是基于 vivo 内部 KM 平台构建的运营管理工具，已经具备 Token 管理、知识库浏览、文档编辑、Skill 工厂、API 统计等基础能力。后端工程化已达 80 分（pkg 静态打包生产验证），但前端产品化、AI 化、生态化均处早期。

### 0.2 目标

将 KM-Portal 打造为 **AI 原生 + 一站式 + 生态化** 的知识运营平台：

- **一站式**：覆盖知识生产 / 组织 / 消费 / 运营全链路
- **AI 化**：全局 Copilot + RAG 问答 + 智能摘要 / 打标 / 推荐
- **生态化**：对接 mitc-buddy（AI 助手统一入口）和 v消息（IM 机器人）
- **包装底层 KM 能力**：在 KM 官方基础能力上构建差异化体验

### 0.3 用户角色

| 角色 | 占比 | 核心诉求 |
|------|------|---------|
| **知识运营者** | 5% | 数据大盘、统计、运营策略 |
| **知识生产者** | 15% | 编辑器体验、AI 辅助、模板 |
| **知识消费者** | 70% | 搜索、推荐、Copilot、IM 触达 |
| **管理员** | 10% | Token、权限、审计、生态配置 |

---

## 1. 现状评估

### 1.1 已有能力

| 维度 | 已有 |
|------|------|
| 后端路由 | admin / kb / skill / stats / diag |
| 核心功能 | Token 管理、KB 浏览、文档 CRUD、Skill 工厂、统计 |
| 部署 | pkg 静态打包（47MB 单文件）已生产验证 |
| 技术栈 | React 18 + TS + Vite 5 + Ant Design 5 + Zustand |
| 工程化 | 文档体系完整（spec/plan/audit）、ESLint + Prettier |

### 1.2 核心短板

| 短板 | 影响 |
|------|------|
| 零数据可视化 | 运营无感、缺数据驱动 |
| 零 AI 视觉 | 无法体现"AI 原生"定位 |
| 无用户态 | 无法支撑 RBAC / 审计 |
| 无搜索 / 推荐 | 知识消费体验差 |
| 单一上游对接 | 生态几乎为零 |
| 无协作（评论/版本） | 知识生产闭环缺失 |
| 无通知 / 订阅 | 知识触达无通道 |

---

## 2. 行业对标

### 2.1 国际产品

- **Confluence + Rovo**：知识图谱 + AI 助手侧边栏 + 多源聚合
- **Microsoft Viva / Copilot**：嵌入式 AI + 上下文感知
- **GitBook / Mintlify**：MDX + AI 问答 + API 同步
- **Notion AI**：极简 + AI 命令面板 + 数据库思维

### 2.2 国内产品

- **飞书知识库**：IM + 文档一体化、知识卡片嵌入消息流
- **语雀**：组织级 + 个人空间双层、知识仪表盘
- **钉钉文档**：企业协同 + AI 助手

### 2.3 关键范式

1. **AI Copilot 必备**：顶部入口 + 右侧抽屉 + 上下文感知
2. **数据可视化驱动**：仪表盘 + 健康度 + 排行榜
3. **RAG 优先架构**：知识库即第二大脑
4. **多模态融合**：文档 / 表格 / 流程图 / 视频一体
5. **暗色 + 渐变玻璃**：现代 AI 工具标配
6. **IM 双向打通**：推送 + 反向写知识库

---

## 3. 整体架构

```
┌──────────────────────────────────────────────────────────┐
│                  KM-Portal 一站式平台                      │
├──────────────────────────────────────────────────────────┤
│  ┌─① 知识运营 Dashboard─┐  ┌─② 知识生产─编辑器+AI辅助─┐ │
│  │  数据大盘 / 活动图谱   │  │  MDX 编辑器 / 模板 / 摘要  │ │
│  └─────────────────────┘  └──────────────────────────┘ │
│  ┌─③ 知识组织───────────┐  ┌─④ 知识消费─────────────┐ │
│  │  树形 / 标签 / 智能分类 │  │  搜索 / Copilot / 推荐     │ │
│  └─────────────────────┘  └──────────────────────────┘ │
│  ┌─⑤ 生态对接───────────┐  ┌─⑥ AI 引擎层────────────┐ │
│  │  mitc-buddy / v消息 / SSO │  │  RAG / 摘要 / 打标 / 翻译 │ │
│  └─────────────────────┘  └──────────────────────────┘ │
├──────────────────────────────────────────────────────────┤
│  后端（Express + TypeScript）                            │
│  · KM-API 代理 · Token 管理 · Skill 工厂 · 统计          │
│  · 新增：AI 路由 / 生态路由 / 用户态 / 审计               │
├──────────────────────────────────────────────────────────┤
│  底层：vivo 内部 KM 平台（只读 + 写回）                  │
└──────────────────────────────────────────────────────────┘
```

---

## 4. 信息架构

### 4.1 顶部全局栏

- Logo
- 全局搜索（⌘K）
- Copilot 入口
- 通知中心
- 用户菜单

### 4.2 左侧主导航

```
📊 运营看板
📚 知识库
   ├ 我的 KB
   ├ 全部 KB
   └ 收藏
✏️ 文档生产
   ├ 编辑器
   ├ 模板
   └ 草稿
🏷️ 标签与图谱
   ├ 标签管理
   └ 知识图谱
🧩 Skill 工厂
   ├ 我的 Skill
   ├ 全部
   └ 生成器
🤖 AI Copilot
   ├ 对话历史
   ├ 知识问答
   └ Agent
🔌 生态对接
   ├ mitc-buddy
   ├ v消息机器人
   ├ SSO
   └ Webhook
📈 统计
   ├ API 调用
   ├ 知识消费
   └ 用户活跃
⚙️ 系统管理
   ├ Token
   ├ 用户
   ├ 审计
   └ 设置
```

### 4.3 右侧 AI 抽屉（任意页面可唤起）

- 上下文感知问答
- 当前文档摘要 / 翻译 / 打标
- 推荐相关知识

---

## 5. 视觉设计系统

### 5.1 色彩

| 用途 | 颜色 |
|------|------|
| 主背景 | 深空黑 `#0B0E14` |
| 次背景 | 深灰 `#11151C` |
| 卡片背景 | 玻璃白 `rgba(255,255,255,0.04)` |
| 边框 | 玻璃边 `rgba(255,255,255,0.08)` |
| 主色 | 渐变紫蓝 `#7C3AED → #2563EB` |
| 强调色 | 霓虹紫 `#A78BFA` |
| 文字主 | 亮白 `#E6E8EB` |
| 文字次 | 灰白 `#9CA3AF` |
| 成功 | 翠绿 `#10B981` |
| 警告 | 琥珀 `#F59E0B` |
| 错误 | 玫红 `#EF4444` |

### 5.2 排版

- 字体：Inter / 思源黑体 / JetBrains Mono
- 标题：48/36/28/22/18
- 正文：14/15/16
- 圆角：12px 卡片 / 8px 按钮 / 16px 大模块
- 阴影：弱光晕 + 紫色边缘光

### 5.3 动效

- 时长：200-300ms
- 缓动：cubic-bezier(0.16, 1, 0.3, 1)
- hover 微光、loading 渐变扫描、AI 思考流式

### 5.4 核心组件

- `<GlassCard>` 玻璃拟态卡片
- `<GradientText>` 渐变文字
- `<CopilotDrawer>` AI 抽屉
- `<KBCard>` 知识卡片（hover 预览）
- `<MetricCard>` 数据指标卡（含趋势 mini chart）
- `<HeatMapChart>` 知识活跃度热力图
- `<KnowledgeGraph>` 知识图谱组件
- `<StreamingText>` AI 流式输出
- `<CommandPalette>` ⌘K 全局命令面板

---

## 6. 核心页面设计

### 6.1 运营看板 Dashboard

**布局**：4 指标条 + 4 图表（2x2） + 1 全宽

**指标条**（4 卡）：
- 知识总数 + 趋势
- 本月新增 + 趋势
- 活跃用户 + 趋势
- 今日搜索 + 趋势

**图表 2x2**：
- 左上：知识活跃度热力图（12 周 × 7 天）
- 右上：贡献者排行榜 TOP 10
- 左下：知识消费趋势（30 天 3 条折线）
- 右下：热门知识 TOP 10

**全宽**：
- 知识健康度雷达图（6 维度）+ AI 自动洞察滚动

### 6.2 知识库浏览

**布局**：左 3 + 中 7 + 右 4（AI 抽屉）

- **左侧**：KB 树形导航
- **中部**：KB 卡片瀑布流 + 筛选 / 标签 / 排序
- **右侧**：Copilot 抽屉（智能问答 + 推荐）

**交互**：
- 卡片 hover → 浮层预览（前 200 字 + 标签 + 时间）
- 点击 → 详情页或编辑器

### 6.3 文档编辑器（AI 增强）

**布局**：左 2（树形/大纲） + 中 7（编辑区） + 右 3（AI 抽屉）

- **顶部工具栏**：B I U 📷 🔗 代码 表格 / 保存 / 发布 / 更多
- **编辑区**：MDX Editor，支持代码高亮、数学公式、表格
- **选中文字 → 浮动 AI 工具条**：改写 / 扩写 / 翻译 / 总结
- **`/` 命令**：AI 续写 / 插入模板 / 插入图表
- **右侧 AI 抽屉**：自动摘要 / 智能打标 / 知识关联 / SEO 检查

### 6.4 知识图谱

**布局**：中央画布 + 右侧统计 + 顶部工具栏

- **节点**：大小 = 浏览量，颜色 = 时效性
- **边**：粗细 = 关联强度
- **布局**：力导向 / 环形 / 树形
- **交互**：hover 摘要、拖拽布局、右键菜单
- **侧栏**：节点数 / 边数 / 聚类数 / 中心度 TOP

### 6.5 生态对接

**布局**：左侧对接平台列表 + 中间配置 + 右侧实时状态

- mitc-buddy：MCP Server 配置 + 能力测试
- v消息：Webhook + 签名 + 关键词触发
- SSO：OAuth 配置 + 用户同步
- Webhook：URL + 事件订阅 + 投递历史

---

## 7. AI 能力设计

### 7.1 能力矩阵

| 能力 | 入口 | 实现 |
|------|------|------|
| 全局 Copilot | 顶部 ⌘K + 任意页面 AI 按钮 | LLM 流式问答 + RAG |
| 文档摘要 | 文档详情 / 编辑器右侧 | LLM 摘要 |
| 智能打标 | 文档保存时 | LLM 关键词提取 |
| AI 续写 | 编辑器 `/` 命令 | LLM 流式补全 |
| 智能翻译 | 编辑器选中文字 | LLM 翻译 |
| 知识推荐 | 文档详情 / Copilot | 向量相似度 + LLM 排序 |
| 知识问答 | Copilot 抽屉 | RAG：检索增强生成 |
| 知识图谱构建 | 后台定时任务 | 实体识别 + 关系抽取 |
| 知识健康检查 | Dashboard | 规则 + LLM 评估 |

### 7.2 RAG 架构

```
用户提问
   ↓
Query 改写 (LLM)
   ↓
混合检索：向量检索 (Embedding) + 关键词 (BM25)
   ↓
重排序 (Rerank)
   ↓
Top-K 文档片段
   ↓
Prompt 拼接 + LLM
   ↓
流式回答 + 引用
```

### 7.3 AI 视觉元素

- AI 思考时显示"流式光点"动效
- 回答含引用卡片（点击跳转原文）
- 置信度可视化（半透明遮罩）
- 反馈按钮（👍 / 👎 + 原因标签）

---

## 8. 生态对接设计

### 8.1 mitc-buddy（MCP Server）

**协议**：MCP 1.0（Model Context Protocol）

**暴露能力**：
- `km_search(query)` — 知识搜索
- `km_get_doc(id)` — 获取文档
- `km_create_doc(...)` — 创建文档
- `km_update_doc(...)` — 更新文档
- `km_get_skill(name)` — 获取 Skill
- `km_run_skill(...)` — 运行 Skill

**认证**：Token + MCP 协议签名

**实现**：
- 后端新增 `/api/mcp/*` 路由
- 协议遵循 MCP 1.0 规范
- 配置页：mitc-buddy 连接配置 + 测试连接

### 8.2 v消息机器人

**双向能力**：
- **推送**：知识更新 / 知识推荐 / 任务提醒
- **接收**：用户问询 → 调用 KM 搜索 → 回复

**实现**：
- 后端新增 `/api/bot/vmsg/*` 路由
- 签名验证（v消息官方协议）
- 消息模板系统
- 机器人配置页：Webhook URL / 关键词触发 / 权限控制

### 8.3 SSO（vivo 内部账号）

- 接入 vivo 内部 SSO（OAuth 2.0）
- 统一用户态
- 审计日志

### 8.4 Webhook

- 文档变更 → 通知外部系统
- 知识订阅
- 事件类型：doc.created / doc.updated / doc.deleted / kb.created

---

## 9. 数据可视化

| 图表 | 用途 | 库 |
|------|------|------|
| 知识活跃度热力图 | Dashboard | ECharts |
| 知识消费趋势（折线 + 面积） | Dashboard | ECharts |
| 贡献者排行榜 | Dashboard | ECharts |
| 知识覆盖度雷达 | Dashboard | ECharts |
| 知识健康仪表盘 | Dashboard | ECharts |
| 知识图谱 | 知识图谱页 | AntV G6 |
| 标签云 | 标签管理页 | ECharts wordCloud |
| API 调用统计 | 统计页 | ECharts |
| 用户活跃趋势 | 统计页 | ECharts |
| KB 分布饼图 | Dashboard | ECharts |

**设计原则**：
- 深色主题统一
- 渐变填充 + 发光描边
- hover 联动
- 关键数字大字号 + 渐变字
- 实时数据小指示灯

---

## 10. 技术选型

### 10.1 新增前端依赖

| 类别 | 选型 | 理由 |
|------|------|------|
| 可视化 | ECharts 5 + echarts-for-react | 工业级图表库 |
| 图谱 | AntV G6 | 阿里开源，知识图谱首选 |
| Markdown | MDX Editor / bytemd | 富文本 + 代码高亮 |
| 代码高亮 | Shiki / Prism | 主题适配深色 |
| 动画 | Framer Motion | 流畅过渡 |
| 命令面板 | cmdk | ⌘K 必备 |
| 图标 | Phosphor Icons | 现代感强 |
| 拖拽 | dnd-kit | 卡片拖拽 |

### 10.2 后端新增

| 类别 | 选型 |
|------|------|
| AI 网关 | 自建 `/api/ai/*` 路由，封装 LLM 调用 + RAG |
| Bot 网关 | 自建 `/api/bot/*` 路由 |
| MCP Server | 自建 `/api/mcp/*` 路由 |
| Webhook | 事件总线 + 回调注册表 |
| 审计 | 中间件 + 异步落库 |
| 向量存储 | 本地 hnswjs + 持久化到 `data/vectors/` |

### 10.3 不引入

- Next.js（保持 Vite，避免引入 SSR 复杂度）
- 微前端（当前体量无需）
- Docker（pkg 已够用）
- 数据库（保持 JSON + 加索引机制）

---

## 11. 数据模型

### 11.1 数据文件

```
data/
├── tokens.json          ← 已有
├── skills.json          ← 已有
├── api-logs.json        ← 已有
├── users.json           ← 新增
├── audit-logs.json      ← 新增
├── bot-configs.json     ← 新增
├── webhooks.json        ← 新增
├── ai-cache.json        ← 新增
├── vectors/             ← 新增
│   ├── hnsw.index
│   └── meta.json
├── doc-versions.json    ← 新增
├── doc-comments.json    ← 新增
├── subscriptions.json   ← 新增
└── tags.json            ← 新增
```

### 11.2 关键类型

```typescript
interface User {
  id: string
  ssoId?: string
  name: string
  avatar?: string
  role: 'admin' | 'editor' | 'reader'
  permissions: string[]
  createdAt: string
  lastLoginAt?: string
}

interface AuditLog {
  id: string
  userId: string
  action: string
  resource: string
  metadata: Record<string, any>
  ip: string
  ua: string
  timestamp: string
}

interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  createdAt: string
}

interface BotConfig {
  id: string
  platform: 'vmsg' | 'mitc-buddy' | 'feishu' | 'wecom'
  enabled: boolean
  webhookUrl?: string
  config: Record<string, any>
  triggers?: Array<{ keyword: string; template: string }>
}

interface DocVersion {
  id: string
  docId: string
  content: string
  author: string
  comment?: string
  createdAt: string
}

interface Comment {
  id: string
  docId: string
  userId: string
  content: string
  parentId?: string
  createdAt: string
}
```

---

## 12. 实施路线

### 第一期：基础体验升级（第 1-3 周）

- 1.1 设计系统：深色主题、渐变变量、玻璃组件（3 天）
- 1.2 全局布局：顶部栏 + 左侧导航 + 右侧 AI 抽屉（3 天）
- 1.3 Dashboard 重做：6 个核心图表 + 渐变指标卡（1 周）
- 1.4 知识库浏览重做：卡片瀑布流 + hover 预览（1 周）
- 1.5 文档编辑器升级：MDX Editor 集成 + 浮动 AI 工具条（1 周）
- 1.6 ⌘K 命令面板（3 天）

### 第二期：AI 能力接入（第 4-7 周）

- 2.1 AI 网关后端（3 天）
- 2.2 全局 Copilot 入口 + 抽屉（1 周）
- 2.3 RAG 检索（向量 + BM25 重排）（1 周）
- 2.4 AI 摘要 / 打标 / 翻译 / 续写（1 周）
- 2.5 知识推荐（1 周）
- 2.6 AI 反馈闭环（3 天）

### 第三期：生态对接（第 8-11 周）

- 3.1 MCP Server 实现（1 周）
- 3.2 mitc-buddy 配置 + 测试（3 天）
- 3.3 v消息机器人（1 周）
- 3.4 SSO 接入（1 周）
- 3.5 Webhook 事件总线（1 周）
- 3.6 生态对接 Dashboard（3 天）

### 第四期：高级能力 + 打磨（第 12-16 周）

- 4.1 知识图谱页（AntV G6）（1 周）
- 4.2 标签管理 + 智能分类（1 周）
- 4.3 文档版本管理（3 天）
- 4.4 评论与协作（1 周）
- 4.5 订阅与通知中心（1 周）
- 4.6 用户与 RBAC（1 周）
- 4.7 审计与统计（3 天）
- 4.8 性能优化 + 验收（1 周）

---

## 13. 风险与挑战

| 风险 | 等级 | 应对 |
|------|------|------|
| LLM 成本不可控 | 中 | 缓存 + 限流 + 降级到小模型 |
| mitc-buddy MCP 协议不稳定 | 中 | 抽象适配层 + 版本兼容 |
| v消息签名变更 | 低 | 配置化签名 + 测试覆盖 |
| 知识图谱性能 | 中 | 后台预计算 + 增量更新 |
| 深色 UI 长时间疲劳 | 低 | 提供"自动"模式跟随系统 |
| 权限模型复杂 | 中 | 先做粗粒度（admin/editor/reader），再细化 |

---

## 14. 验收标准

### 第一期验收
- [ ] 6 个页面全部深色化，统一玻璃拟态
- [ ] Dashboard 6 个图表正常渲染
- [ ] 知识库卡片瀑布流 + hover 预览
- [ ] 编辑器 MDX + 浮动 AI 工具条
- [ ] ⌘K 全局命令面板
- [ ] Lint + Build 通过

### 第二期验收
- [ ] Copilot 抽屉全局可用
- [ ] RAG 检索准确率 > 80%（自建 50 条测试集）
- [ ] 6 大 AI 能力全部演示通过
- [ ] AI 反馈闭环可用

### 第三期验收
- [ ] mitc-buddy 真实连接成功 + 调用 KM 搜索返回结果
- [ ] v消息机器人能推送 / 接收消息
- [ ] SSO 登录可用
- [ ] Webhook 推送可用

### 第四期验收
- [ ] 知识图谱可交互（> 100 节点测试）
- [ ] 文档版本回滚可用
- [ ] 评论 / 订阅 / 通知可用
- [ ] 审计日志可查询
- [ ] 性能：首屏 < 2s，Dashboard < 3s

---

## 15. 后续规划（v2.0 远景）

- 移动端 H5 / 飞书小程序
- 语音 / 视频转写知识
- 知识订阅 + 个性化推荐
- 团队空间 + 跨组织协作
- AI Agent 工作流（多步骤任务）
- 知识市场（跨组织知识交易）

---

> 文档结束
