# Plan 02: Express 后端核心

**Goal:** 构建 Express 后端核心架构：路由系统、中间件、API Key 认证、统计记录

**Architecture:** 路由模块化 + 中间件链式调用 + 服务层分离

**Tech Stack:** Express, TypeScript, JWT/UUID

---

## 文件结构

```
src/server/
├── index.ts                 # 入口
├── routes/
│   ├── index.ts             # 路由汇总
│   ├── admin.ts             # 管理端路由（Token 管理）
│   ├── kb.ts                # 知识库 API 路由
│   ├── skill.ts             # Skill 生成路由
│   └── stats.ts             # 统计路由
├── middleware/
│   ├── auth.ts              # API Key 认证
│   ├── errorHandler.ts      # 错误处理
│   └── logger.ts            # 请求日志
├── services/
│   ├── kmApiClient.ts       # KM-API 调用封装
│   ├── apiKeyStore.ts       # API Key 存储
│   └── statsStore.ts        # 统计存储
├── types/
│   └── index.ts             # 类型定义
└── utils/
    └── index.ts             # 工具函数
```

---

## 任务清单

### Task 1: 创建类型定义

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\types\index.ts`

- [ ] **Step 1: 创建类型定义**

```typescript
export interface ApiKeyRecord {
  id: string
  key: string
  name: string
  owner: string
  kbPermissions: KbPermission[]
  createdAt: string
  updatedAt: string
  status: 'active' | 'revoked'
}

export interface KbPermission {
  kbId: string
  kbName: string
  permission: 'read' | 'write'
}

export interface ApiCallRecord {
  id: string
  apiKeyId: string
  kbId: string
  endpoint: string
  method: string
  statusCode: number
  latencyMs: number
  ip: string
  userAgent: string
  createdAt: string
}

export interface ApiResponse<T = unknown> {
  code: number
  msg: string
  data?: T
}

export interface TokenRecord {
  id: string
  kb_name: string
  kb_id: string
  owner: string
  token: string
  env: string
  status: 'active' | 'revoked'
  remark?: string
  created_at: string
  updated_at: string
}
```

---

### Task 2: 创建工具函数

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\utils\index.ts`

- [ ] **Step 1: 创建工具函数**

```typescript
import { v4 as uuidv4 } from 'uuid'

export function generateId(): string {
  return uuidv4()
}

export function maskToken(token: string): string {
  if (token.length <= 8) return '****'
  return token.substring(0, 4) + '****' + token.substring(token.length - 4)
}

export function getClientIp(req: Request): string {
  return ((req.headers['x-forwarded-for'] as string) || req.ip || 'unknown')
}

export function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
}
```

---

### Task 3: 创建 API Key 存储服务

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\services\apiKeyStore.ts`

- [ ] **Step 1: 创建 API Key 存储服务**

```typescript
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { ApiKeyRecord, KbPermission } from '../types'

const DATA_DIR = path.join(process.cwd(), 'data')
const API_KEY_FILE = path.join(DATA_DIR, 'api-keys.json')

interface ApiKeyStore {
  apiKeys: ApiKeyRecord[]
}

async function readStore(): Promise<ApiKeyStore> {
  try {
    const content = await fs.readFile(API_KEY_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { apiKeys: [] }
  }
}

async function writeStore(store: ApiKeyStore): Promise<void> {
  await fs.writeFile(API_KEY_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export async function createApiKey(
  name: string,
  owner: string,
  kbPermissions: KbPermission[]
): Promise<ApiKeyRecord> {
  const store = await readStore()
  const apiKey: ApiKeyRecord = {
    id: uuidv4(),
    key: uuidv4(),
    name,
    owner,
    kbPermissions,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'active',
  }
  store.apiKeys.push(apiKey)
  await writeStore(store)
  return apiKey
}

export async function getApiKeyByKey(key: string): Promise<ApiKeyRecord | null> {
  const store = await readStore()
  return store.apiKeys.find((k) => k.key === key && k.status === 'active') || null
}

export async function listApiKeys(): Promise<ApiKeyRecord[]> {
  const store = await readStore()
  return store.apiKeys.map((k) => ({
    ...k,
    key: k.key.substring(0, 8) + '****',
  }))
}

export async function revokeApiKey(id: string): Promise<boolean> {
  const store = await readStore()
  const index = store.apiKeys.findIndex((k) => k.id === id)
  if (index === -1) return false
  store.apiKeys[index].status = 'revoked'
  store.apiKeys[index].updatedAt = new Date().toISOString()
  await writeStore(store)
  return true
}

export async function checkKbPermission(apiKeyId: string, kbId: string, required: 'read' | 'write'): Promise<boolean> {
  const store = await readStore()
  const apiKey = store.apiKeys.find((k) => k.id === apiKeyId)
  if (!apiKey || apiKey.status !== 'active') return false
  const perm = apiKey.kbPermissions.find((p) => p.kbId === kbId)
  if (!perm) return false
  if (required === 'write' && perm.permission !== 'write') return false
  return true
}
```

---

### Task 4: 创建统计存储服务

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\services\statsStore.ts`

- [ ] **Step 1: 创建统计存储服务**

```typescript
import { promises as fs } from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'
import type { ApiCallRecord } from '../types'

const DATA_DIR = path.join(process.cwd(), 'data')
const STATS_FILE = path.join(DATA_DIR, 'api-stats.json')

interface StatsStore {
  calls: ApiCallRecord[]
}

async function readStore(): Promise<StatsStore> {
  try {
    const content = await fs.readFile(STATS_FILE, 'utf-8')
    return JSON.parse(content)
  } catch {
    return { calls: [] }
  }
}

async function writeStore(store: StatsStore): Promise<void> {
  await fs.writeFile(STATS_FILE, JSON.stringify(store, null, 2), 'utf-8')
}

export async function recordCall(data: Omit<ApiCallRecord, 'id' | 'createdAt'>): Promise<void> {
  const store = await readStore()
  store.calls.push({
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  })
  if (store.calls.length > 10000) {
    store.calls = store.calls.slice(-5000)
  }
  await writeStore(store)
}

export async function getStats(kbId?: string, days: number = 7): Promise<{
  total: number
  byDay: Record<string, number>
  byEndpoint: Record<string, number>
  avgLatency: number
}> {
  const store = await readStore()
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  const calls = store.calls.filter((c) => new Date(c.createdAt).getTime() > cutoff && (!kbId || c.kbId === kbId))
  
  const byDay: Record<string, number> = {}
  const byEndpoint: Record<string, number> = {}
  let totalLatency = 0
  
  for (const call of calls) {
    const day = call.createdAt.substring(0, 10)
    byDay[day] = (byDay[day] || 0) + 1
    byEndpoint[call.endpoint] = (byEndpoint[call.endpoint] || 0) + 1
    totalLatency += call.latencyMs
  }
  
  return {
    total: calls.length,
    byDay,
    byEndpoint,
    avgLatency: calls.length > 0 ? Math.round(totalLatency / calls.length) : 0,
  }
}
```

---

### Task 5: 创建 KM-API 客户端

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\services\kmApiClient.ts`

- [ ] **Step 1: 创建 KM-API 客户端**

```typescript
const KM_API_URL = process.env.KM_API_URL || 'http://localhost:5052'

interface WikiResponse<T> {
  code: number
  msg: string
  data?: T
}

async function callKmApi<T>(endpoint: string, body: Record<string, unknown>): Promise<WikiResponse<T>> {
  const url = `${KM_API_URL}${endpoint}`
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return response.json()
  } catch (err) {
    return {
      code: -1,
      msg: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function getKbInfo(kbId: string) {
  return callKmApi('/api/kb/info', { kb_id: kbId })
}

export async function getKbTree(kbId: string, parentId?: number) {
  return callKmApi('/api/kb/tree', { kb_id: kbId, parent_id: parentId })
}

export async function getContent(kbId: string, contentIds: number[], contentType: string) {
  return callKmApi('/api/kb/content', { kb_id: kbId, content_ids: contentIds, content_type: contentType })
}

export async function createContent(kbId: string, title: string, contentType: string, content: string, parentId?: number) {
  return callKmApi('/api/kb/contents/create', { kb_id: kbId, title, content_type: contentType, content, parent_id: parentId })
}

export async function updateContent(kbId: string, contentId: number, title: string, contentType: string, content: string) {
  return callKmApi('/api/kb/contents/update', { kb_id: kbId, content_id: contentId, title, content_type: contentType, content })
}

export async function listTokens() {
  return callKmApi('/api/admin/tokens/list', {})
}

export async function uploadToken(kbName: string, kbId: string, token: string, owner: string, env: string) {
  return callKmApi('/api/admin/tokens/upload', { kb_name: kbName, kb_id: kbId, token, owner, env })
}

export async function revokeToken(id: string) {
  return callKmApi('/api/admin/tokens/revoke', { id })
}
```

---

### Task 6: 创建中间件 - 认证

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\middleware\auth.ts`

- [ ] **Step 1: 创建认证中间件**

```typescript
import { Request, Response, NextFunction } from 'express'
import { getApiKeyByKey, checkKbPermission } from '../services/apiKeyStore'

declare global {
  namespace Express {
    interface Request {
      apiKeyId?: string
      kbId?: string
    }
  }
}

export async function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  const kbId = req.headers['x-kb-id'] as string

  if (!apiKey) {
    res.status(401).json({ code: -1, msg: 'Missing API Key' })
    return
  }

  const record = await getApiKeyByKey(apiKey)
  if (!record) {
    res.status(401).json({ code: -1, msg: 'Invalid API Key' })
    return
  }

  req.apiKeyId = record.id

  if (kbId) {
    const method = req.method === 'GET' ? 'read' : 'write'
    const hasPermission = await checkKbPermission(record.id, kbId, method)
    if (!hasPermission) {
      res.status(403).json({ code: -1, msg: 'No permission for this KB' })
      return
    }
    req.kbId = kbId
  }

  next()
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string
  if (apiKey) {
    getApiKeyByKey(apiKey).then((record) => {
      if (record) {
        req.apiKeyId = record.id
      }
      next()
    })
  } else {
    next()
  }
}
```

---

### Task 7: 创建中间件 - 错误处理和日志

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\middleware\errorHandler.ts`
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\middleware\logger.ts`

- [ ] **Step 1: 创建错误处理中间件**

```typescript
import { Request, Response, NextFunction } from 'express'

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('[Error]', err.message, err.stack)
  res.status(500).json({
    code: -1,
    msg: err.message || 'Internal server error',
  })
}
```

- [ ] **Step 2: 创建日志中间件**

```typescript
import { Request, Response, NextFunction } from 'express'
import { recordCall } from '../services/statsStore'
import { getClientIp } from '../utils'

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()
  const originalSend = res.send
  
  res.send = function (body) {
    const latency = Date.now() - start
    if (req.apiKeyId) {
      recordCall({
        apiKeyId: req.apiKeyId,
        kbId: req.kbId || '',
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        latencyMs: latency,
        ip: getClientIp(req),
        userAgent: req.headers['user-agent'] || '',
      })
    }
    return originalSend.call(this, body)
  }
  
  next()
}
```

---

### Task 8: 创建路由 - Admin

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\routes\admin.ts`

- [ ] **Step 1: 创建 Admin 路由**

```typescript
import { Router } from 'express'
import { createApiKey, listApiKeys, revokeApiKey } from '../services/apiKeyStore'
import { listTokens, uploadToken, revokeToken } from '../services/kmApiClient'

const router = Router()

router.get('/api-keys', async (req, res) => {
  const keys = await listApiKeys()
  res.json({ code: 1, msg: 'success', data: keys })
})

router.post('/api-keys', async (req, res) => {
  const { name, owner, kbPermissions } = req.body
  if (!name || !owner) {
    res.json({ code: -1, msg: 'Missing required fields' })
    return
  }
  const apiKey = await createApiKey(name, owner, kbPermissions || [])
  res.json({ code: 1, msg: 'success', data: apiKey })
})

router.post('/api-keys/revoke', async (req, res) => {
  const { id } = req.body
  const success = await revokeApiKey(id)
  res.json({ code: success ? 1 : -1, msg: success ? 'success' : 'Failed' })
})

router.get('/tokens', async (req, res) => {
  const result = await listTokens()
  res.json(result)
})

router.post('/tokens/upload', async (req, res) => {
  const { kb_name, kb_id, token, owner, env } = req.body
  const result = await uploadToken(kb_name, kb_id, token, owner, env)
  res.json(result)
})

router.post('/tokens/revoke', async (req, res) => {
  const { id } = req.body
  const result = await revokeToken(id)
  res.json(result)
})

export default router
```

---

### Task 9: 创建路由 - KB

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\routes\kb.ts`

- [ ] **Step 1: 创建 KB 路由**

```typescript
import { Router } from 'express'
import { apiKeyAuth } from '../middleware/auth'
import { getKbInfo, getKbTree, getContent, createContent, updateContent } from '../services/kmApiClient'

const router = Router()

router.post('/kb/info', apiKeyAuth, async (req, res) => {
  const { kb_id } = req.body
  if (!kb_id) {
    res.json({ code: -1, msg: 'kb_id is required' })
    return
  }
  const result = await getKbInfo(kb_id)
  res.json(result)
})

router.post('/kb/tree', apiKeyAuth, async (req, res) => {
  const { kb_id, parent_id } = req.body
  if (!kb_id) {
    res.json({ code: -1, msg: 'kb_id is required' })
    return
  }
  const result = await getKbTree(kb_id, parent_id)
  res.json(result)
})

router.post('/kb/content', apiKeyAuth, async (req, res) => {
  const { kb_id, content_ids, content_type } = req.body
  if (!kb_id || !content_ids || !content_type) {
    res.json({ code: -1, msg: 'Missing required fields' })
    return
  }
  const result = await getContent(kb_id, content_ids, content_type)
  res.json(result)
})

router.post('/kb/contents/create', apiKeyAuth, async (req, res) => {
  const { kb_id, title, content_type, content, parent_id } = req.body
  if (!kb_id || !content_type || !content) {
    res.json({ code: -1, msg: 'Missing required fields' })
    return
  }
  const result = await createContent(kb_id, title, content_type, content, parent_id)
  res.json(result)
})

router.post('/kb/contents/update', apiKeyAuth, async (req, res) => {
  const { kb_id, content_id, title, content_type, content } = req.body
  if (!kb_id || !content_id || !content_type || !content) {
    res.json({ code: -1, msg: 'Missing required fields' })
    return
  }
  const result = await updateContent(kb_id, content_id, title, content_type, content)
  res.json(result)
})

export default router
```

---

### Task 10: 创建路由 - Stats

**Files:**
- Create: `D:\Users\11033406\【01】Projects\KM-Portal\src\server\routes\stats.ts`

- [ ] **Step 1: 创建 Stats 路由**

```typescript
import { Router } from 'express'
import { getStats } from '../services/statsStore'

const router = Router()

router.get('/stats', async (req, res) => {
  const { kb_id, days } = req.query
  const stats = await getStats(kb_id as string, days ? parseInt(days as string) : 7)
  res.json({ code: 1, msg: 'success', data: stats })
})

router.get('/stats/summary', async (req, res) => {
  const stats7 = await getStats(undefined, 7)
  const stats30 = await getStats(undefined, 30)
  res.json({
    code: 1,
    msg: 'success',
    data: {
      last7Days: stats7,
      last30Days: stats30,
    },
  })
})

export default router
```

---

## 验收标准

- [ ] 后端服务可正常启动
- [ ] API Key 创建/查询/撤销功能正常
- [ ] Token 管理（调用 KM-API）功能正常
- [ ] KB API 路由正常（需认证）
- [ ] 统计记录正常