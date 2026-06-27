# KM-Portal 设计文档

> 日期：2026-06-26
> 版本：v1.0.0
> 状态：草稿

## 一、项目概述

### 1.1 项目背景

当前知识库运营存在以下问题：
1. **P0 Bug**：KM-API 中 `t.kb_id === String(kbId)` 导致类型不匹配（数字 vs 字符串）
2. **能力分散**：km-operation-builder（Skill 生成）和 KM-API（API 封装）各自独立，维护成本高
3. **无可视化**：缺少统一的 Web 管理界面
4. **无统计**：API 调用情况不透明

### 1.2 项目目标

构建 **KM-Portal** —— 知识库运营一站式平台，实现：
- API 网关：封装 KM API，生成固定端点供 V消息、Agent 等调用
- Web 管理：可视化 Token 管理、知识库浏览、文档编辑
- Skill 生成：完整迁移 km-operation-builder 能力
- 调用统计：API 调用次数/趋势可视化

### 1.3 定位

| 系统 | 职责 | 特点 |
|------|------|------|
| KM-API | 数据层 | Token 管理、Wiki API 调用、审计日志（稳定底座） |
| KM-Portal | 应用层 | API 网关、Web UI、Skill 生成、统计（快速迭代） |

---

## 二、架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     KM-Portal (新系统)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Web UI     │  │  API 网关   │  │ Skill 生成  │         │
│  │  (React)    │  │  (Express)  │  │  (Python)   │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│         └────────────────┼────────────────┘                 │
│                          │                                  │
│                   ┌──────▼──────┐                           │
│                   │   统计层    │                           │
│                   │  (调用记录) │                           │
│                   └──────┬──────┘                           │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                     KM-API (现有系统)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │ Token 管理  │  │ Wiki API    │  │ 审计日志    │         │
│  │             │  │ 调用封装    │  │             │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端 | React 18 + TypeScript | 组件化开发，类型安全 |
| UI 框架 | Ant Design 5 | 企业级组件库 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 后端 | Node.js + Express | 与 KM-API 技术栈一致 |
| Python 桥接 | child_process | 执行 Python Skill 生成脚本 |
| 数据存储 | JSON 文件 | 与 KM-API 共用 data 目录 |

### 2.3 目录结构

```
KM-Portal/
├── docs/                          # 文档
│   └── superpowers/specs/         # 设计文档
├── src/
│   ├── client/                    # React 前端
│   │   ├── components/            # 公共组件
│   │   ├── pages/                 # 页面
│   │   │   ├── Dashboard/         # 仪表盘
│   │   │   ├── TokenManage/       # Token 管理
│   │   │   ├── KBBrowser/         # 知识库浏览器
│   │   │   ├── DocEditor/         # 文档编辑器
│   │   │   ├── SkillGen/          # Skill 生成
│   │   │   └── ApiDocs/           # API 文档
│   │   ├── services/              # API 调用
│   │   ├── stores/                # 状态管理
│   │   └── App.tsx
│   ├── server/                    # Express 后端
│   │   ├── routes/                # 路由
│   │   ├── middleware/            # 中间件
│   │   ├── services/              # 业务逻辑
│   │   └── index.ts
│   └── python/                    # Python Skill 生成
│       ├── scripts/               # 从 km-operation-builder 迁移
│       └── runner.ts              # Python 桥接
├── public/                        # 静态资源
├── package.json
└── README.md
```

---

## 三、功能模块设计

### 3.1 Token 管理

**功能**：
- 上传 Token（kb_name, kb_id, token, owner, env）
- 查看 Token 列表（脱敏显示）
- 撤销/删除 Token
- Token 状态监控

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/admin/tokens/list | 列出所有 Token |
| POST | /api/admin/tokens/upload | 上传新 Token |
| POST | /api/admin/tokens/revoke | 撤销 Token |
| POST | /api/admin/tokens/delete | 删除 Token |

**调用流程**：
```
用户上传 Token → KM-Portal → KM-API → Wiki API 验证 → 存储
```

### 3.2 API 网关

**功能**：
- 统一入口，外部调用方只需一个 API Key
- 按 KB 级别权限控制
- 请求路由到 KM-API

**认证机制**：
```
外部请求 → API Key 验证 → KB 权限校验 → KM-API 调用 → 统计记录 → 返回
```

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/health | 健康检查 |
| POST | /api/kb/info | 获取知识库信息 |
| POST | /api/kb/tree | 获取目录树 |
| POST | /api/kb/content | 获取文档内容 |
| POST | /api/kb/contents/create | 创建文档 |
| POST | /api/kb/contents/update | 更新文档 |

**请求头**：
```
X-API-Key: <api_key>
X-KB-ID: <kb_id>
```

### 3.3 调用统计

**功能**：
- 各 KB 的 API 调用次数统计
- 调用趋势图（日/周/月）
- Top 调用方排行
- 错误率统计

**数据来源**：
- KM-API 的 audit-log.json
- KM-Portal 额外记录的网关日志

**展示**：
- 仪表盘首页概览
- 详细统计页面

### 3.4 知识库浏览器

**功能**：
- 树形展示知识库目录结构
- 点击目录展开子节点
- 点击文档预览内容（Markdown 渲染）
- 支持搜索定位

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/kb/tree | 获取目录树 |
| POST | /api/kb/content | 获取文档内容 |

### 3.5 文档编辑器

**功能**：
- Markdown 编辑器
- 实时预览
- 保存/发布到知识库

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/kb/contents/create | 创建文档 |
| POST | /api/kb/contents/update | 更新文档 |

### 3.6 Skill 生成

**功能**（完整迁移 km-operation-builder）：
- 配置向导（kb_name, kb_id, token, owner）
- 模板选择（operation, analysis, distribution）
- 自动生成 Skill 项目
- 一键安装到 ~/.config/bluecode/skills/
- 打包下载

**Python 桥接**：
```typescript
// runner.ts
import { spawn } from 'child_process';

async function runPythonScript(script: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn('python', [script, ...args]);
    let stdout = '', stderr = '';
    proc.stdout.on('data', (d) => stdout += d);
    proc.stderr.on('data', (d) => stderr += d);
    proc.on('close', (code) => {
      if (code === 0) resolve(stdout);
      else reject(new Error(stderr));
    });
  });
}
```

**API 端点**：
| 方法 | 路径 | 说明 |
|------|------|------|
| POST | /api/skill/create | 创建 Skill |
| GET | /api/skill/list | 列出已生成的 Skill |
| GET | /api/skill/download/:name | 下载 Skill 包 |

### 3.7 API 文档

**功能**：
- 自动生成 OpenAPI 3.0 文档
- 在线调试工具
- 代码示例（curl, Python, JavaScript）

---

## 四、数据流设计

### 4.1 Token 上传流程

```
1. 用户在 Web 界面填写 Token 信息
2. KM-Portal 调用 KM-API /api/admin/tokens/upload
3. KM-API 验证 Token 有效性
4. KM-API 从 Wiki API 获取真实 kb_name
5. KM-API 存储到 data/token-store.json
6. 返回结果给 KM-Portal
7. Web 界面刷新 Token 列表
```

### 4.2 API 调用流程

```
1. 外部调用方携带 X-API-Key 和 X-KB-ID 请求
2. KM-Portal 验证 API Key
3. KM-Portal 查询 KB 权限（从 KM-API 获取）
4. KM-Portal 调用 KM-API 对应端点
5. KM-Portal 记录调用统计
6. 返回结果给调用方
```

### 4.3 Skill 生成流程

```
1. 用户在 Web 界面填写知识库信息
2. KM-Portal 调用 Python 脚本
3. Python 脚本执行 builder_entry.py
4. 生成 Skill 项目到临时目录
5. 打包为 zip 文件
6. 返回下载链接
```

---

## 五、安全设计

### 5.1 API Key 管理

- API Key 生成：UUID v4
- 存储：加密存储在配置文件
- 有效期：可配置（默认永不过期）
- 权限：可按 KB 分配访问权限

### 5.2 KB 级别权限

- 每个 API Key 可绑定多个 KB
- 每个 KB 可设置不同权限（只读/编辑）
- 权限校验在网关层完成

### 5.3 审计日志

- 记录所有 API 调用
- 记录内容包括：时间、调用方、KB、端点、状态码、耗时
- 日志保留 30 天

---

## 六、部署设计

### 6.1 部署架构

```
                    ┌─────────────┐
                    │   Nginx     │
                    │  (反向代理)  │
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
    ┌──────▼──────┐ ┌──────▼──────┐ ┌──────▼──────┐
    │  KM-Portal  │ │   KM-API    │ │  静态资源   │
    │   :5053     │ │   :5052     │ │   :5054     │
    └─────────────┘ └─────────────┘ └─────────────┘
```

### 6.2 端口分配

| 服务 | 端口 | 说明 |
|------|------|------|
| KM-API | 5052 | 数据层（现有） |
| KM-Portal | 5053 | 应用层（新增） |
| 静态资源 | 5054 | 可选，用于 CDN |

### 6.3 部署命令

```bash
# 1. 拉取代码
cd /data/KM-Portal && git pull

# 2. 安装依赖
npm install

# 3. 编译前端
npm run build

# 4. 编译后端
npm run build:server

# 5. 重启服务
kill $(pgrep -f "node.*dist/server.js") 2>/dev/null
sleep 2 && nohup /usr/local/bin/node dist/server.js > server.log 2>&1 &

# 6. 验证
curl -s http://localhost:5053/api/health
```

---

## 七、迭代计划

### Phase 1：基础框架（P0）

| 任务 | 工期 | 优先级 |
|------|------|--------|
| 项目脚手架搭建 | 0.5天 | P0 |
| React 前端基础架构 |  1天 | P0 |
| Express 后端基础架构 | 1天 | P0 |
| Token 管理功能 | 1天 | P0 |
| **修复 P0 Bug（类型不匹配）** | 0.5天 | P0 |

### Phase 2：核心功能（P1）

| 任务 | 工期 | 优先级 |
|------|------|--------|
| API 网关实现 | 2天 | P1 |
| 调用统计功能 | 2天 | P1 |
| 知识库浏览器 | 1.5天 | P1 |
| 文档编辑器 | 1.5天 | P1 |

### Phase 3：高级功能（P2）

| 任务 | 工期 | 优先级 |
|------|------|--------|
| Skill 生成迁移 | 2天 | P2 |
| API 文档自动生成 | 1天 | P2 |
| 仪表盘优化 | 1天 | P2 |

---

## 八、验收标准

### 8.1 功能验收

- [ ] Token 上传/查看/撤销/删除正常
- [ ] API 网关可正常调用 Wiki API
- [ ] 调用统计准确显示
- [ ] 知识库目录树正常加载
- [ ] 文档可正常创建/编辑
- [ ] Skill 可正常生成和下载

### 8.2 性能验收

- [ ] 页面加载 < 2秒
- [ ] API 响应 < 500ms
- [ ] 支持 100 并发

### 8.3 安全验收

- [ ] API Key 认证有效
- [ ] KB 权限控制生效
- [ ] 敏感信息脱敏显示

---

## 九、附录

### 9.1 参考资料

- [km-operation-builder 源码](../km-operation-builder/)
- [KM-API 源码](../KM-API/)
- [知识库开放接口文档](../KM_API_docs/)

### 9.2 术语表

| 术语 | 说明 |
|------|------|
| KB | Knowledge Base，知识库 |
| Token | Wiki API 访问凭证 |
| API Key | KM-Portal 外部调用凭证 |
| Skill | BlueCode 技能扩展 |