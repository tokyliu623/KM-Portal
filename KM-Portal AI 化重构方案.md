KM-Portal AI 化重构方案
> Plan Mode 生效中，只读不写。以下为基于参考文件与现有代码的方案。
---
一、方案总览
维度	任务 1：功能修复	任务 2：AI 化设计
范围	保障已开发功能 100% 可用	UI/UX 全面重塑为 AI 时代产品
性质	修 bug + 补测试 + 验收	仅出设计方案，不实施
优先级	P0 - 先做	P1 - 后做
预计工时	1-2 人日	设计 1 人日 + 后续实施
---
二、任务 1：功能修复方案
1.1 排查发现的问题（基于代码阅读）
#	页面	问题
F1	Dashboard	useEffect 中 setStats(a, b) / setStats(last7Days, daily30Res.data) 第 2 次调用不传 daily7Res 结果 → last7Days 与 last30Days 实际存的是同一个对象
F2	Dashboard	4 个 Statistic 标题都是中文但用 AntD 默认宽度 → 拥挤；缺 Loading 占位
F3	TokenManage	创建后没刷新就 form.resetFields() 但 Modal 没关（不像 SkillGen）
F4	TokenManage	expiresAt 字段没在 Form 中暴露，但 createToken payload 含此字段 → 必传但无输入
F5	KBBrowser	setSelectedNode({ ..., type: 'doc' }) 永远写死为 'doc'，未区分 kb/doc
F6	KBBrowser	getContent(kbId, [nodeId], 'doc') 第三个参数 'doc' 是写死的，看不到调用端类型定义（已读取 kb.ts 未含此签名）→ 可能后端不识别
F7	DocEditor	没有"编辑已有文档"功能，只有创建 → 命名误导
F8	DocEditor	没有选择 KB 的下拉（只手动输入 KB ID）
F9	SkillGen	"生成" loading 用 message.loading(..., 0) 不会自动关 → 必须配 translateHide() 兜底；translateHide 可能在 await form.validateFields() 抛错时是 null
F10	SkillGen	"查看" 按钮 setGeneratedSkill(record) 后 Modal 显示 record.content，但 GeneratedSkill 类型未必有 content 字段
F11	Stats	4 卡片/BarChartCard/2 Table 在同 Card 中堆叠，缺空态统一处理
F12	ApiDocs	TabPane 在 AntD v5 已弃用 → 控制台 warning（v1.7.1 老问题清单未列）
F13	KMStudio	useEffect 依赖 [polling, message] 但内部用了 useWizardStore.getState() → 闭包可能拿到旧 jobId
F14	全局	4 个页面（Dashboard/TokenManage/SkillGen/Stats）useEffect(() => { ... }, []) 缺依赖警告被 // eslint-disable-next-line 强压 → 需补依赖
1.2 修复计划（按页面）
📋 任务 F-Dashboard
修复点 F1: setStats 调用链修复
位置: src/client/pages/Dashboard/index.tsx:24-34
现状:
  setStats({total, avgLatency:0}, {total, avgLatency:0})   ← 两次都传 overview
  setStats(daily7Res.data, last30Days)
  setStats(last7Days, daily30Res.data)
问题: 3 次 setStats 互相覆盖，最终 last7Days=last30Days=overview
修复: 用临时变量保存上一次结果，按顺序串行
```ts
let l7 = last7Days, l30 = last30Days
if (overviewRes.data) { l7 = { total: overviewRes.data.totalCalls, avgLatency: 0 } }
if (daily7Res.data)  { l7 = daily7Res.data }
if (daily30Res.data) { l30 = daily30Res.data }
setStats(l7, l30)
📋 任务 F-TokenManage
修复点 F3 + F4
F3: 创建成功后 form.resetFields + loadTokens 即可，移除冗余操作
F4: expiresAt 改用 DatePicker，并在 createToken 中按 ISO 传
位置: src/client/pages/TokenManage/index.tsx:55-62, 184-189
📋 任务 F-KBBrowser
修复点 F5 + F6
F5: SelectedNode.type 改为根据 hasChild 推断 'kb'|'doc'，或由 API 返回字段
F6: getContent 第三参数在 services/kb.ts 改为 'doc' | 'folder' 联合类型 + 默认 'doc'
位置: src/client/pages/KBBrowser/index.tsx:62-67
📋 任务 F-DocEditor
修复点 F7 + F8
F7: 重命名为"新建/编辑文档"，增加 KB 文档列表选择
F8: KB ID 改用下拉，从 /api/admin/tokens 拉取当前用户有写权限的 KB
📋 任务 F-SkillGen
修复点 F9 + F10
F9: try/catch 内 setGenerating + translateHide 顺序调整；form.validateFields 抛错时不要 setGenerating
F10: GeneratedSkill 类型增加 optional content 字段
📋 任务 F-Stats
修复点 F11
统一空态：使用 DataState 组件替代散落的"暂无数据"div
📋 任务 F-ApiDocs
修复点 F12
TabPane → antd v5 items API
位置: src/client/pages/ApiDocs/index.tsx:4, 58-83
📋 任务 F-KMStudio
修复点 F13
useEffect 中只在 polling=true 时启动 setInterval
interval 回调中重新读 getState() 而非依赖闭包变量
📋 任务 F-Global
修复点 F14
每个 useEffect 的依赖补全；或显式 eslint-disable + 注释说明原因
新增 vscode .eslintrc 规则: react-hooks/exhaustive-deps: 'warn'
1.3 测试用例（Vitest + React Testing Library）
ID	套件	验证点
T-D01	Dashboard.test.tsx	模拟 getOverview/daily7/daily30 返回不同 total，断言 4 个 Statistic value 正确
T-D02	Dashboard.test.tsx	API 失败时 message.error 触发，loading 复位
T-T01	TokenManage.test.tsx	创建/编辑/撤销/删除 4 个 happy path
T-T02	TokenManage.test.tsx	KB ID 输入非正整数 → 校验失败
T-T03	TokenManage.test.tsx	expiresAt DatePicker 选中后 payload ISO 正确
T-K01	KBBrowser.test.tsx	搜索 KB ID → 树渲染 → 选中节点 → 右侧内容显示
T-K02	KBBrowser.test.tsx	getContent 失败 → Empty 显示 + message.error
T-E01	DocEditor.test.tsx	KB ID 改为下拉后渲染所有 token 中的 KB
T-S01	SkillGen.test.tsx	翻译 loading + 成功后 Modal 自动关闭
T-S02	SkillGen.test.tsx	表单校验失败不触发 API
T-S03	SkillGen.test.tsx	"查看"按钮打开内容 Modal
T-ST01	Stats.test.tsx	4 卡片数字正确，BarChart 渲染柱状条
T-A01	ApiDocs.test.tsx	Tabs items 切换正常
T-W01	KMStudio.test.tsx	init → tree → generate → products 4 tab 流程
1.4 验收清单
acceptance_v1.9.2:
  1. 158/158 单元测试仍通过
  2. 新增 13 个测试套件全绿
  3. 8 个页面手动 smoke test 通过（每个页面走完 happy path）
  4. dev server 启动无 React key warning
  5. dev server 启动无 AntD deprecated API warning
  6. dev server 启动无 react-hooks/exhaustive-deps 警告
  7. 服务端 routes/skill.ts 字段兼容 e2e (scripts/verify-skill-e2e.sh) 通过
1.5 实施顺序（双 agent 并行）
Agent-1 (功能修复)
  Step 1: 跑 npm run lint / tsc / vitest 记录基线
  Step 2: 按 F1-F14 顺序修复
  Step 3: 补 13 个测试套件
  Step 4: 全量测试 → lint → tsc → esbuild
  Step 5: 跑 verify-skill-e2e.sh
  Step 6: 手动 smoke test 8 页面
  Step 7: 输出修复报告 + VCS diff
---
三、任务 2：AI 化设计方案
2.1 设计思想（从参考文件提取）
思想来源	提炼的核心原则	落地到 KM-Portal
vapd HTML 演示	深色主题 + 流程图驱动 + Agent 双层架构	Layout/Sider 深色重做、首页加 Agent 流程图
AM_Talks_002	导航地图模式：告诉模型/用户"去哪找"	顶部全局搜索 + 知识图谱导航
AM_Talks_002	Token 预算：核心信息优先	Dashboard 改"3 张主卡片 + 1 条时间线"，砍掉数字堆砌
AM_Talks_002	模型感知分级	移动端/桌面端不同布局
AM_Talks_004	Agent 生产化路径：诊断→生成→运营	KM Studio 4 Tab 重做，加状态机可视化
2.2 视觉系统（设计 token）
:root {
  /* 主色板 - 取自 vapd 演示 */
  --bg-primary: #0a0e1a;      /* 主背景：深蓝黑 */
  --bg-card: #111827;          /* 卡片背景 */
  --bg-card-alt: #1a2332;      /* 卡片悬浮 */
  --bg-surface: #0d1117;       /* 流程图/代码块 */
  
  /* 强调色 - 5 色语义系统 */
  --accent-blue: #3b82f6;      /* 主操作/链接/流程主线 */
  --accent-green: #10b981;     /* 成功/已就绪/Sub Agent */
  --accent-orange: #f59e0b;    /* 警告/生成中/策略闸门 */
  --accent-purple: #8b5cf6;    /* AI/Skill/MCP/共建 */
  --accent-red: #ef4444;       /* 错误/撤销/局限 */
  
  /* 文字色 - 3 级 */
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --text-muted: #6b7280;
  
  /* 边框 - 半透明 */
  --border: rgba(59, 130, 246, 0.15);
  --border-hover: rgba(59, 130, 246, 0.3);
  
  /* 字体 */
  --font-main: 'PingFang SC', 'Segoe UI', system-ui, sans-serif;
  --font-mono: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  
  /* 圆角 - 略大 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
}
2.3 布局系统
当前问题：AntD Sider 经典后台布局 → 互联网感浓
新布局：
┌─────────────────────────────────────────────────────┐
│  [KM·Portal Logo]  [🔍 全局搜索 KB/Skill/Token...]  [👤 主题][⚙]│  ← 顶栏 64px
├──────┬──────────────────────────────────────────────┤
│      │                                              │
│  📊  │   页面内容区（带渐变背景 + 网格底纹）         │
│  🔑  │                                              │
│  🌳  │   三段式标题区：                              │
│  ✏  │   ┌─ 01 概览 ─────────────────┐              │
│  ⚡  │   │  仪表盘                   │              │
│  📡  │   │  Knowledge Operations Hub  │              │
│  🚀  │   └───────────────────────────┘              │
│  🧪  │                                              │
│      │   内容卡片区（带 fadeInUp 动画）              │
│ 72px │                                              │
│      │                                              │
└──────┴──────────────────────────────────────────────┘
关键变化：
- 侧边栏由文字菜单 → 纯图标（hover 展开 tooltip）
- 顶栏新增全局搜索框（v2 实施）
- 顶栏主题切换：深色/浅色（v2 实施）
- 顶栏右侧 AI 状态指示灯（脉冲动画）
2.4 各页面重设计要点
📊 Dashboard（核心改造）
当前：4 个白底 Statistic 卡片横排
改造后：
┌─────────────────────────────────────────────────────┐
│ ┌─ 01 仪表盘 ─────────────────────────────────────┐ │
│ │  知识库运营中心                                  │ │
│ │  Knowledge Operations Hub                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                     │
│ ┌─总调用─────────┐ ┌─活跃KB─────────┐ ┌─Token消耗─┐│
│ │  📈 12,345      │ │  🟢 8 / 12     │ │  ¥128.50  ││
│ │  ↑ 23% (7d)    │ │  3 离线         │ │  ↓ 15%    ││
│ └────────────────┘ └─────────────────┘ └────────────┘│
│                                                     │
│ ┌─ Agent 调用流（流程图）──────────────────────┐    │
│ │  [用户] → [KM-Portal] → [Agent调度]         │    │
│ │              ↓                ↓              │    │
│ │          [KB检索]      [Skill加载]            │    │
│ │              └──── 产物生成 ────┘             │    │
│ └──────────────────────────────────────────────┘    │
│                                                     │
│ ┌─ 时间线（近 7 天）────────────────────────────┐    │
│ │  02-23 ▁▂▃▄▅▆▇  12,345 次                     │    │
│ │  02-22 ▇▆▅▄▃▂▁  10,200 次                     │    │
│ │  ...                                            │    │
│ └──────────────────────────────────────────────┘    │
│                                                     │
│ ┌─ Skill 矩阵（紫色卡片）──────────────────────┐    │
│ │  [vapd-client] [review-analyzer] [test-strategy]│    │
│ │  8 个 Skill 卡片网格，紫边 = AI 化标识         │    │
│ └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
🔑 Token 管理
- 顶部增加 "凭据健康度" 仪表（绿/黄/红灯）
- Token 列表行加 hover 高亮（蓝色边框发光）
- 新增/编辑 Modal 改为深色 Modal
🌳 KB 浏览器
- 左侧 Tree 改为深色风格 + 节点前加类型图标（📁/📄）
- 右侧内容预览用 <pre> 代码块样式（深色 + 等宽字体）
✏️ 文档编辑器
- 标题区加 "AI 助手" 标签（紫色）
- ContentType 切换按钮：Markdown / HTML（彩色块）
⚡ Skill 生成
- 翻译 loading 改为进度条（带"AI 思考中"动效）
- 列表 Skill 卡片用紫边 + 悬停上浮
- 顶部加 "🧠 AI 翻译中" 状态条
📊 统计（Stats）
- 4 卡片改为渐变背景
- BarChartCard 改为真柱状图（ECharts/D3 渐变色）
- 时间范围切换器：滑动条样式
📡 API 文档
- 3 个 Tab 改为深色 Card 网格
- 请求/响应示例用等宽字体深色代码块
- 加 "复制" 按钮
🚀 KM Studio / Wizard（重点）
4 Tab 重设计为单页流程图：
┌─ 01 KM Studio ──────────────────────────────────────┐
│  一站式知识库运营 - AI 驱动                          │
│                                                     │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌────┐│
│  │ ① 初始化 │ → │ ② 诊断  │ → │ ③ 生成  │ → │ ④运营││
│  │  KB 凭证 │   │ 目录树  │   │ 5 产物  │   │ 分析 ││
│  │  🔵 蓝   │   │  🟠 橙  │   │  🟢 绿  │   │ 🟣紫 ││
│  └─────────┘   └─────────┘   └─────────┘   └────┘│
│                                                     │
│  选中阶段 → 下方展示该阶段内容                       │
└─────────────────────────────────────────────────────┘
2.5 组件库设计
组件	用途	关键样式
<FlowNode>	流程图节点	4 色：blue/orange/green/purple；圆角 12px；半透明背景
<FlowArrow>	流程图连线	带标签的箭头组件，标签在箭头下方
<AgentCard>	Agent 卡片	main 蓝边 + sub 绿边 + 渐变标题
<SkillCard>	Skill 卡片	蓝边（基础）+ 紫边（社区）+ person-tag
<LimitationCard>	局限卡片	左侧 4px 色条 + 标题 + 描述 + 优化方向
<Highlight>	高亮文本	5 色 highlight 系统
<SectionTag>	阶段标签	渐变背景 + 蓝色文字 + 圆角
<CodeBlock>	代码块	深色 #0d1117 + 等宽字体 + 蓝色边框
<PulseDot>	状态指示灯	脉冲动画 + 颜色编码（绿/橙/红）
<KpiCard>	KPI 卡片	渐变背景 + 大数字 + 趋势箭头
2.6 动画系统
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-item { animation: fadeInUp 0.5s ease both; }
.animate-item:nth-child(n) { animation-delay: calc(n * 0.1s); }
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.6; transform: scale(1.1); }
}
.pulse-dot { animation: pulse 2s ease-in-out infinite; }
@keyframes flow {
  /* Agent 流程图节点之间的"数据流动"动效 */
  0%   { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
}
2.7 实施路径（v2.0 路线图）
阶段	周期	任务
Phase 1	T+1d	抽取 <FlowNode> <AgentCard> <SkillCard> 基础组件
Phase 2	T+2d	全局样式切换：theme/dark + 设计 token 注入
Phase 3	T+3d	Layout.tsx 深色重做 + Sider 纯图标化
Phase 4	T+4d	Dashboard 流程图版
Phase 5	T+5d	KM Studio 单页流程图版
Phase 6	T+6d	TokenManage/KBBrowser/DocEditor/SkillGen 适配深色
Phase 7	T+7d	Stats 图表库替换（BarChartCard → ECharts）+ ApiDocs 改造
Phase 8	T+8d	动画/微交互打磨 + 移动端响应式
不实施（需用户决策）：
- 主题切换器（深色/浅色）
- 全局搜索
- 多语言（i18n）
2.8 风险与依赖
风险	影响	缓解
AntD v5 dark theme 需 ConfigProvider	Layout 全部重做	用 ConfigProvider.theme.darkAlgorithm 一次注入
BarChartCard 自实现 → ECharts 替换	引入新依赖	ECharts gzipped ~150KB，按需引入
158 个测试需适配新主题	测试可能需更新 snapshot	主题色变更不影响断言，只影响视觉
端到端截图测试	Playwright baseline 需重拍	接受 1 次性重拍成本
---
四、立即可执行（最小验证）
# 验证参考文件能被静态资源加载（不需要构建）
# 把 vapd HTML 复制到 public/ 目录：
cp "D:\Users\11033406\【03】Workspace\【03】AMtalks\参考文件\bluecode_vapd_presentation.html" \
   "D:\Users\11033406\【01】Projects\KM-Portal\public\ai-demo.html"
# 浏览器打开 http://localhost:5173/ai-demo.html 可预览 AI 化设计风格
---
五、需要你确认的关键决策
#	决策点	我的建议
Q1	任务 1 与 2 是否真要分 agent 并行？任务 1 修复可能暴露 2-3 处需要"动 UI"，与任务 2 范围有重叠	建议：先串行（任务 1 → 验收 → 任务 2 设计 → 任务 2 实施），避免反复返工
Q2	ECharts 替换自实现 BarChartCard？体积+150KB	建议引入；如拒绝，可保留自实现 + 加渐变色
Q3	是否做"主题切换"（深/浅）？	v2 暂不做，全站深色单主题（与你提供的参考一致）
Q4	是否做"全局搜索"？v2 工作量+1d	暂不做，靠菜单导航；v3 再加
Q5	是否动 Wizard 4 Tab → 单页流程图？改动较大	建议做，是 AI 化差异化的关键
Q6	是否保留 AntD Sider？纯图标 + Tooltip 替代	建议保留（Sider 本身支持），只换样式
---
六、方案交付物清单
任务	产出
任务 1	14 个修复点 + 13 个测试套件 + 验收清单（本文 1.1-1.7）
任务 2	设计 token + 布局图 + 8 页面重设计 + 10 个新组件 + 8 阶段路线 + 6 个待决策项（本文 2.1-2.8）
---
请确认以下事项，我再决定是否进入实施：
1. Q1 串行 vs 并行？
2. Q2 ECharts 是否引入？
3. Q5 Wizard 是否大改？
4. 是否有 Q3/Q4/Q6 偏好？
▣  Plan · MiniMax-M3-1M(外部) · 1m 28s
1. Q1串行 2. 引入 3. 大改

Spec 已写入并提交：docs/superpowers/specs/2026-06-30-e2e-test-design.md
核心内容预览：
- 8 页面 × 5 工作流 × 4 维度，84 个测试用例
- 双层架构：Playwright UI + axios API
- 严重度：P0/P1/P2/P3 + SLA 定义
- 输出物：测试脚本 + 报告 + 问题清单 + 截图基线
请审阅，有任何修改意见随时告知。确认后我将调用 writing-plans 分解为可执行的实施任务。