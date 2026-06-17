# AM Talks AI协同分享 HTML生成 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成18页精炼金句版HTML幻灯片，展示AI协同数据治理方法论

**Architecture:** 基于现有generate_am_talks.py框架，重写SLIDES数组内容，保留CSS/JS引擎，新增痛点故事/金句/心法模块

**Tech Stack:** Python脚本生成 + 纯HTML+CSS+JS（无外部依赖）

---

## 文件结构

```
AM_Talks_调研报告/
├── generate_am_talks_v2.py    # 新建：生成v2版本HTML的Python脚本
├── am_talks_data_governance_v2.html  # 输出：18页精炼金句版幻灯片
├── docs/superpowers/specs/
│   └── 2026-06-17-am-talks-ai-collaboration-design.md  # 设计文档（已批准）
└── docs/superpowers/plans/
    └── 2026-06-17-am-talks-html-plan.md  # 本计划
```

---

## 任务分解

### Task 1: 创建Python生成脚本框架

**Files:**
- Create: `generate_am_talks_v2.py`

- [ ] **Step 1: 创建Python脚本文件**

创建脚本框架，包含：
- UTF-8编码声明
- 输出路径常量（指向`am_talks_data_governance_v2.html`）
- 保留现有CSS样式（科技蓝渐变风格）
- 保留现有JS引擎（键盘翻页+导航控制）
- 新增SLIDES_V2数组（18页内容）

- [ ] **Step 2: 提交脚本框架**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: create generate_am_talks_v2.py framework"
```

---

### Task 2: 生成封面与目录（Slide 1-2）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[0:2]

- [ ] **Step 1: 添加封面Slide 1**

```python
# Slide 1: 封面
"""
<div class="cover-slide">
    <div class="series-tag">AM TALKS - 006</div>
    <h1 class="main-title">
        从 <span class="highlight">34%</span> 到 <span class="highlight">100%</span><br>
        352条指标的命名规范治理之路
    </h1>
    <p class="subtitle">AI协同方法论实践</p>
    <p class="author">刘荣新</p>
    <p class="date">2026年6月</p>
</div>
""",
```

- [ ] **Step 2: 添加目录Slide 2**

四大章节：
1. 问题背景：5个真实痛点
2. AI协同五式：盘/定/查/当/陪
3. 核心心法：3条可迁移经验
4. 迁移行动：今天就能做的3件事

- [ ] **Step 3: 运行脚本验证封面和目录**

```bash
python generate_am_talks_v2.py
```
检查输出文件是否存在，验证前2页内容

- [ ] **Step 4: 提交**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: add slides 1-2 cover and TOC"
```

---

### Task 3: 生成痛点开场与认知重构（Slide 3-4）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[2:4]

- [ ] **Step 1: 添加痛点开场Slide 3**

情感共鸣式呈现，5个真实痛点故事：

| 痛点 | 场景描述 |
|------|----------|
| 痛点1 | 测试同学问我"上周Bug率多少"，我翻了3天才找到 |
| 痛点2 | 同一指标在不同人嘴里是不同含义 |
| 痛点3 | 想用AI分析数据，结果AI也看不懂我们的指标 |
| 痛点4 | 47人天/年人工维护，老板问值不值 |
| 痛点5 | 每当我们要复盘，第一个动作就是：先盘数 |

关键数据卡片：352条指标 | 34%违规率 | 47人天/年 | AI能力为0

- [ ] **Step 2: 添加认知重构Slide 4**

核心观点：AI不是工具，是协作者

- 传统认知：AI = 工具（你下达指令，AI执行）
- 正确认知：AI = 协作者（你引导方向，AI探索；你提反例，AI修正）

金句：让AI先看，别让它先答

- [ ] **Step 3: 运行脚本验证**

```bash
python generate_am_talks_v2.py
```

- [ ] **Step 4: 提交**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: add slides 3-4 pain points and AI cognition"
```

---

### Task 4: 生成AI场景1-2（Slide 5-8）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[4:8]

- [ ] **Step 1: 添加金句1 - AI盘家底Slide 5**

金句："让AI先看看你有什么"

震撼数据：
- 460+ 数据库表 → AI扫描
- 352条 指标 → AI提取
- 11个 二级分类 → AI识别
- 34% 命名违规 → AI发现

- [ ] **Step 2: 添加盘点三步法Slide 6**

方法要点：
```
第一步：问AI从哪些维度盘点
第二步：让AI跑，自动生成字段字典
第三步：人机校对，人对"为何这样分类"做最终判断
```

- [ ] **Step 3: 添加金句2 - AI定规矩Slide 7**

金句："规则不是AI定的，是AI和你吵出来的"

人机对话循环：AI起草→人类给反例→AI改稿→人类确认

关键数据：8条命名规范，背后是20轮人机对话

- [ ] **Step 4: 添加规则迭代三阶段Slide 8**

| 阶段 | AI角色 | 人类角色 |
|------|--------|----------|
| 阶段1 | 出初稿 | 提需求 |
| 阶段2 | 改稿 | 给反例 |
| 阶段3 | 归纳普适规则 | 最终确认 |

- [ ] **Step 5: 运行脚本验证**

```bash
python generate_am_talks_v2.py
```

- [ ] **Step 6: 提交**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: add slides 5-8 AI scenarios 1-2"
```

---

### Task 5: 生成AI场景3-4（Slide 9-12）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[8:12]

- [ ] **Step 1: 添加金句3 - AI查问题Slide 9**

金句："AI守住最后一道防线：分子大于分母就是事故"

DQE稽核流程：
```
提交数据 → AI自动稽核 → 问题告警/阻断上线
```

关键洞察：分子 > 分母 = 必有Bug（AI自动拦截）

- [ ] **Step 2: 添加5类自动检查Slide 10**

| 检查类型 | 检查内容 | 示例 |
|----------|----------|------|
| 字段完整性 | 必填字段是否缺失 | 发现时间必须100%存在 |
| 数值合理性 | 分子≤分母 | 投诉量≤用户量 |
| 单位一致性 | 同类指标单位统一 | ppm vs % 不混用 |
| 命名规范性 | R01-R08规范检查 | 动宾结构/无连字符 |
| 分类正确性 | 决策树验证 | FL vs ST 边界 |

- [ ] **Step 3: 添加金句4 - AI当专家Slide 11**

金句："你不是缺SQA，你是缺6个不同视角的AI"

6视角专家协同模型：
| 专家视角 | AI检查重点 |
|----------|------------|
| 数据专家 | 数据模型合理性、字段规范、血缘完整性 |
| 质量专家 | 功能覆盖度、验收用例完整性、边界条件 |
| 开发专家 | API设计合理性、技术可行性、错误处理 |
| 文档专家 | 文档结构规范、命名一致性、格式统一 |
| 治理专家 | 规则体系一致性、分类合理性、治理覆盖 |
| 运营专家 | 使用体验、流程合理性、可操作性 |

关键数据：1次产出，6倍质量

- [ ] **Step 4: 添加AI角色化复用Slide 12**

方法要点：
```
同一个AI，6套人设提示词
    ↓
每个角色独立审视
    ↓
AI汇总冲突点
    ↓
人类最终裁决
```

- [ ] **Step 5: 运行脚本验证**

```bash
python generate_am_talks_v2.py
```

- [ ] **Step 6: 提交**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: add slides 9-12 AI scenarios 3-4"
```

---

### Task 6: 生成AI场景5与升华（Slide 13-17）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[12:17]

- [ ] **Step 1: 添加金句5 - AI陪迭代Slide 13**

金句："AI不是你的工具，是陪你从v1到v6的搭子"

v1→v6版本演进时间线：
| 版本 | 时间 | AI承担的角色 |
|------|------|--------------|
| v1.0 | 2026-05初 | 打字员（照单全收） |
| v2.0 | 2026-05中 | 助手（起草+改稿） |
| v3.0 | 2026-05中 | 协作者（建议+人裁决） |
| v4.0 | 2026-05下 | 吵架伙伴（反例+修正） |
| v5.0 | 2026-06初 | 搭子（共创规则） |
| v6.0 | 2026-06中 | 决策顾问（辅助决策） |

- [ ] **Step 2: 添加人机协奏成熟度模型Slide 14**

| 成熟度 | AI角色 | 特征 |
|--------|--------|------|
| L1 | 打字员 | 照单全收 |
| L2 | 助手 | 起草+改稿 |
| L3 | 协作者 | 建议+人裁决 |
| L4 | 吵架伙伴 | 反例+修正 |
| L5 | 搭子 | 共创规则 |
| L6 | 决策顾问 | 辅助决策 |

- [ ] **Step 3: 添加核心心法Slide 15**

3条可迁移心法：
| 心法 | 内容 | 核心洞察 |
|------|------|----------|
| 心法1 | 让AI先看，别让它先答 | 盘点资产→发现规律→提出建议→人裁决 |
| 心法2 | AI的价值不在聪明，在稳定 | 100次跑、100次一样（稽核/检查/模板生成） |
| 心法3 | AI不是替代SQA，是放大SQA | 1个SQA × AI = 6倍覆盖度 |

- [ ] **Step 4: 添加迁移行动Slide 16**

3个今天就能做的小动作：
| 行动 | 操作 | 工具 |
|------|------|------|
| 行动1 | 把团队指标名/字段名丢给AI，让它找违规 | BlueCode CLI |
| 行动2 | 把常见报表SQL丢给AI，让它写稽核脚本 | BlueCode CLI |
| 行动3 | 把文档丢给AI，让它扮演5个角色挑刺 | BlueCode Skill |

- [ ] **Step 5: 添加升华结尾Slide 17**

核心金句：
> **测试人 + AI = 一支军队**
>
> 不是AI替你干活，是你带着AI组成了一支你以前组不起的团队。

- [ ] **Step 6: 运行脚本验证**

```bash
python generate_am_talks_v2.py
```

- [ ] **Step 7: 提交**

```bash
git add generate_am_talks_v2.py
git commit -m "feat: add slides 13-17 AI scenario 5 and summary"
```

---

### Task 7: 生成Q&A与最终验证（Slide 18）

**Files:**
- Modify: `generate_am_talks_v2.py` - SLIDES_V2[17]

- [ ] **Step 1: 添加Q&A Slide 18**

- 感谢聆听
- Q&A环节
- 联系信息：AM Talks - 006 | 刘荣新 | 2026年6月

- [ ] **Step 2: 运行最终脚本生成**

```bash
python generate_am_talks_v2.py
```

- [ ] **Step 3: 验证HTML文件**

检查项：
- [ ] 18页幻灯片全部生成
- [ ] 5个核心金句全部呈现
- [ ] 3条心法清晰可迁移
- [ ] 3个行动具体可执行
- [ ] 科技蓝风格视觉统一
- [ ] 键盘翻页+导航控制正常
- [ ] 浏览器打开无报错

- [ ] **Step 4: 提交最终版本**

```bash
git add generate_am_talks_v2.py am_talks_data_governance_v2.html
git commit -m "feat: complete AM Talks v2 HTML generation - 18 slides with AI collaboration themes"
```

---

## 验收清单

- [ ] 18页幻灯片全部生成
- [ ] 5个核心金句全部呈现（盘/定/查/当/陪）
- [ ] 3条心法清晰可迁移
- [ ] 3个行动具体可执行
- [ ] 科技蓝风格视觉统一
- [ ] 键盘翻页+导航控制正常
- [ ] 浏览器打开无报错
- [ ] Git提交完成

---

## 执行选项

**Plan complete and saved to `docs/superpowers/plans/2026-06-17-am-talks-html-plan.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**