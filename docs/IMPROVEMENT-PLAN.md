# KM-Portal 改进计划

> 生成时间: 2026-06-29
> 问题总数: 61 个
> 预计工作量: P0(2h) + P1(8h) + P2(12h) = 22h

---

## 改进阶段划分

| 阶段 | 问题数 | 预计时间 | 目标 |
|------|--------|----------|------|
| 阶段一 | P0 (7个) | 2 小时 | 修复核心功能阻断问题 |
| 阶段二 | P1 (18个) | 8 小时 | 提升稳定性和用户体验 |
| 阶段三 | P2 (36个) | 12 小时 | 优化代码质量和性能 |

---

## 阶段一: P0 问题修复

### 目标
修复核心功能阻断问题，恢复系统基本可用性。

### 问题清单

| ID | 问题 | 位置 | 修复方案 | 工作量 |
|----|------|------|----------|--------|
| BE-011 | 数据文件名不统一 | stats.ts:7 | 统一使用 api-logs.json | 15min |
| BE-020 | 数据文件名不统一 | logger.ts:17 | 统一使用 api-logs.json | 15min |
| BE-024 | 数据文件名不统一 | statsStore.ts:6 | 统一使用 api-logs.json | 15min |
| FE-001 | res.code === 1 错误 | KBBrowser/index.tsx:19 | 改为 res.success | 5min |
| FE-002 | res.code === 1 错误 | KBBrowser/index.tsx:73 | 改为 res.success | 5min |
| FE-003 | res.code === 1 错误 | DocEditor/index.tsx:23 | 改为 res.success | 5min |
| FE-004 | StatsData 类型不存在 | useStatsStore.ts:2 | 改为 StatsOverview | 5min |

### 修复步骤

#### 步骤 1: 统一数据文件名

```typescript
// src/server/middleware/logger.ts:17
// 修改前
const statsFile = path.join(dataDir, 'api-stats.json');

// 修改后
const statsFile = path.join(dataDir, 'api-logs.json');

// src/server/services/statsStore.ts:6
// 修改前
const statsFile = path.join(dataDir, 'api-stats.json');

// 修改后
const statsFile = path.join(dataDir, 'api-logs.json');
```

#### 步骤 2: 修复 API 响应判断

```typescript
// src/client/pages/KBBrowser/index.tsx:19
// 修改前
if (res.code === 1) {

// 修改后
if (res.success) {

// 同样修改第 73 行
```

#### 步骤 3: 修复类型导入

```typescript
// src/client/stores/useStatsStore.ts:2
// 修改前
import type { StatsData } from '../services/stats';

// 修改后
import type { StatsOverview } from '../services/stats';
```

### 验证方法

1. 构建项目: `npm run build:all`
2. 启动服务: `npm start`
3. 访问仪表盘，验证统计数据正常显示
4. 访问 KB Browser，验证目录树正常加载

---

## 阶段二: P1 问题修复

### 目标
提升系统稳定性和用户体验。

### 问题清单

| ID | 问题 | 位置 | 修复方案 | 工作量 |
|----|------|------|----------|--------|
| FE-005 | number 类型校验冲突 | TokenManage/index.tsx:131 | 移除 type: 'number' | 10min |
| FE-006 | number 类型校验冲突 | SkillGen/index.tsx:142 | 移除 type: 'number' | 10min |
| FE-007 | 缺少 catch 块 | Dashboard/index.tsx:14 | 添加错误处理 | 10min |
| FE-008 | 统计数据硬编码 | Dashboard/index.tsx:16 | 分别调用 API | 15min |
| FE-009 | 导出未使用 API 数据 | SkillGen/index.tsx:74 | 使用 res.data | 15min |
| BE-004 | verifyToken 使用 any | kb.ts:6 | 使用正确类型 | 15min |
| BE-005 | kbId 未验证 | kb.ts:7 | 添加参数验证 | 15min |
| BE-006 | 文档操作未实现 | kb.ts:45 | 调用 kmApiClient | 1h |
| BE-008 | 并发竞态条件 | skill.ts:123 | 添加文件锁 | 30min |
| BE-016 | auth 中间件未使用 | auth.ts:1 | 应用到路由 | 15min |
| BE-018 | 所有错误返回 500 | errorHandler.ts:10 | 分类处理 | 30min |
| BE-019 | 错误信息泄露 | errorHandler.ts:10 | 生产环境隐藏详情 | 15min |
| BE-022 | 并发竞态条件 | tokenStore.ts:41 | 添加文件锁 | 30min |
| BE-026 | API Key 内存存储 | apiKeyStore.ts:4 | 持久化到文件 | 30min |
| BE-028 | 错误处理简单 | kmApiClient.ts:20 | 详细错误分类 | 30min |
| BE-031 | import 位置不当 | utils/index.ts:20 | 移动到顶部 | 5min |
| BE-033 | 静态文件顺序 | index.ts:38 | 调整顺序 | 10min |

### 修复步骤

#### 步骤 1: 修复 KB ID 表单校验

```typescript
// src/client/pages/TokenManage/index.tsx:131
// 修改前
{
  required: true,
  type: 'number',
  message: 'KB ID 不能为空',
},

// 修改后
{
  required: true,
  validator: (_, value) => {
    if (!value) return Promise.reject('KB ID 不能为空');
    const num = Number(value);
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      return Promise.reject('KB ID 必须是正整数');
    }
    return Promise.resolve();
  },
},
```

#### 步骤 2: 修复 Dashboard 错误处理

```typescript
// src/client/pages/Dashboard/index.tsx
// 修改前
statsApi.getOverview().then((res) => {
  if (res.success) {
    setOverview(res.data);
  }
});

// 修改后
statsApi.getOverview()
  .then((res) => {
    if (res.success) {
      setOverview(res.data);
    }
  })
  .catch((err) => {
    message.error(`加载失败: ${err.message}`);
  });
```

#### 步骤 3: 修复统计数据获取

```typescript
// src/client/pages/Dashboard/index.tsx:16
// 修改前
const last7Days = statsApi.getDaily(7);
const last30Days = statsApi.getDaily(30);

// 修改后
const [last7Days, last30Days] = await Promise.all([
  statsApi.getDaily(7),
  statsApi.getDaily(30),
]);
```

#### 步骤 4: 统一错误响应格式

```typescript
// src/server/middleware/errorHandler.ts
// 修改前
res.status(500).json({ error: err.message });

// 修改后
const statusCode = err.statusCode || 500;
const message = process.env.NODE_ENV === 'production'
  ? 'Internal server error'
  : err.message;
res.status(statusCode).json({ success: false, error: message });
```

### 验证方法

1. 重新构建: `npm run build:all`
2. 测试 KB ID 表单输入
3. 测试错误场景
4. 检查服务器日志无敏感信息泄露

---

## 阶段三: P2 问题修复

### 目标
优化代码质量和性能。

### 问题清单

| 类别 | 问题数 | 主要工作 |
|------|--------|----------|
| 错误处理 | 18 | 统一 catch 块错误提示 |
| 类型安全 | 8 | 移除 any，使用具体类型 |
| 参数验证 | 5 | 完善输入验证 |
| 代码质量 | 5 | 统一命名、清理冗余 |

### 修复步骤

#### 步骤 1: 统一错误处理模式

所有 catch 块统一格式:

```typescript
// 修改前
.catch(() => {
  message.error('操作失败');
});

// 修改后
.catch((err) => {
  message.error(err.response?.data?.error || err.message || '操作失败');
});
```

#### 步骤 2: 移除 any 类型

```typescript
// 修改前
const handleSubmit = (values: any) => {};

// 修改后
interface FormValues {
  kbId: number;
  name: string;
  token: string;
  owner: string;
}
const handleSubmit = (values: FormValues) => {};
```

#### 步骤 3: 完善参数验证

```typescript
// src/server/routes/admin.ts
// 添加 token 格式验证
const validateToken = (token: string): boolean => {
  return typeof token === 'string' && token.length >= 10;
};
```

### 验证方法

1. 运行 TypeScript 检查: `npx tsc --noEmit`
2. 运行 ESLint: `npm run lint`
3. 检查无 any 类型残留

---

## 依赖关系

```
阶段一 (P0)
├── BE-011/BE-020/BE-024 (数据文件统一)
│   └── 依赖: 无
├── FE-001/FE-002/FE-003 (API 响应判断)
│   └── 依赖: 无
└── FE-004 (类型导入)
    └── 依赖: 无

阶段二 (P1)
├── FE-005/FE-006 (表单校验)
│   └── 依赖: 阶段一完成后
├── FE-007/FE-008 (Dashboard)
│   └── 依赖: 阶段一完成后
├── BE-018/BE-019 (错误处理)
│   └── 依赖: 阶段一完成后
└── BE-006 (文档操作)
    └── 依赖: BE-028 完成

阶段三 (P2)
├── 统一错误处理
│   └── 依赖: 阶段二 BE-018 完成
└── 类型安全
    └── 依赖: 无
```

---

## 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 数据文件迁移丢失历史数据 | 高 | 备份现有数据文件 |
| 修改路由顺序影响现有功能 | 中 | 充分测试 SPA 路由 |
| 并发修复引入新问题 | 中 | 使用成熟的文件锁库 |
| 类型修改导致编译错误 | 低 | 逐步修改，充分测试 |

---

## 资源需求

| 资源 | 数量 | 说明 |
|------|------|------|
| 开发人员 | 1 | 全栈开发 |
| 测试环境 | 1 | 本地 + 服务器 |
| 测试时间 | 4h | 场景测试 |

---

## 里程碑

| 里程碑 | 目标日期 | 完成标准 |
|--------|----------|----------|
| M1: P0 修复完成 | 第 1 天 | 7 个 P0 问题全部修复 |
| M2: P1 修复完成 | 第 3 天 | 18 个 P1 问题全部修复 |
| M3: P2 修复完成 | 第 5 天 | 36 个 P2 问题全部修复 |
| M4: 全面测试通过 | 第 6 天 | 35 个测试用例全部通过 |
| M5: 部署上线 | 第 7 天 | 服务器部署验证 |

---

## 附录: 问题分类索引

### 按优先级

| 优先级 | 问题数 | 文档位置 |
|--------|--------|----------|
| P0 | 7 | PROBLEM-AUDIT.md#P0-严重问题 |
| P1 | 18 | PROBLEM-AUDIT.md#P1-中等问题 |
| P2 | 36 | PROBLEM-AUDIT.md#P2-改进问题 |

### 按功能模块

| 模块 | 问题数 | 主要问题 |
|------|--------|----------|
| Token 管理 | 6 | 表单校验、错误处理 |
| Skill 生成 | 6 | 表单校验、导出逻辑 |
| 知识库浏览 | 4 | API 判断、错误处理 |
| 文档编辑 | 2 | API 判断、错误处理 |
| 仪表盘 | 2 | 错误处理、数据准确性 |
| 统计功能 | 3 | 数据不一致 |
| 认证授权 | 2 | 中间件未使用 |
| 错误处理 | 21 | 格式不统一 |
| 数据存储 | 10 | 并发、持久化 |
| 类型安全 | 6 | any 类型 |