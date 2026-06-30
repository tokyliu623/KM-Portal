import api from './api'

export type WizardStage = 'init' | 'diagnose' | 'generate' | 'analyze'

export interface KBCredential {
  kbId: string
  token: string
  kbName: string
}

export interface KBInfo {
  kbId: number
  kbName: string
  effectivePermType: string
  accessBlocked: boolean
  link: string
}

export interface TreeNode {
  id: number
  spaceId: number
  kbId: number
  parentId: number | null
  title: string
  hasChild: boolean
  spaceName: string
  kbName: string
  // v1.8.6: 递归树形结构(由 buildTreeFromFlat 填充)
  children?: TreeNode[]
}

export interface DiagnoseResult {
  kbInfo: KBInfo
  tree: TreeNode[]
  docCount: number
  summary: string
}

export type ProductType = 'skill' | 'mcp' | 'ai_template' | 'openapi' | 'tree'

export interface ProductItem {
  type: ProductType
  name: string
  // v1.8.6: description 全栈必填,服务端 routes/wizard.ts generateJob 已设
  description: string
  icon?: string
  downloadUrl?: string
  content?: string
  mimeType?: string
  filename?: string
  status?: 'pending' | 'done' | 'error'
  error?: string
}

export interface GenerateResult {
  jobId: string
  status: 'pending' | 'running' | 'done' | 'error'
  // v1.8.6: 服务端 generate 初始返回 5 个 pending 占位
  products: ProductItem[]
}

export interface JobStatus {
  jobId: string
  // v1.8.6 对齐服务端 routes/wizard.ts WizardJob.status 枚举
  // 服务端定义: 'pending' | 'running' | 'done' | 'error'
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  message?: string
  // v1.8.6: 状态响应也包含 products 数组(对齐服务端 StatusResponse.products)
  products?: ProductItem[]
  error?: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
  warning?: string
}

export interface McpConfigFile {
  client: string
  filename: string
  mimeType: string
  content: string
}

export interface McpConfigsResponse {
  kbId: number
  kbName: string
  files: McpConfigFile[]
  installHints: Record<string, string>
}

export interface AiPromptFile {
  type: 'writing' | 'reading' | 'qa' | 'retrieval' | 'command'
  filename: string
  content: string
}

export interface AiPromptsResponse {
  kbId: number
  kbName: string
  files: AiPromptFile[]
}

// v1.8.6: api.ts 拦截器已 unwrap response.data,但 axios 类型签名仍包 AxiosResponse
// 这里用 .then 转换 + as any 强转,避免改 5 个 services 的大面积改动
const unwrap = <T>(p: Promise<{ data: T }>): Promise<T> => p.then(r => r.data)

export const wizardApi = {
  init: (credential: KBCredential): Promise<ApiResponse<KBInfo>> =>
    unwrap(api.post('/wizard/init', credential)),

  diagnose: (kbId: string, token: string): Promise<ApiResponse<DiagnoseResult>> =>
    unwrap(api.post('/wizard/diagnose', { kbId, token })),

  generate: (kbId: string, token: string): Promise<ApiResponse<GenerateResult>> =>
    unwrap(api.post('/wizard/generate', { kbId, token })),

  getStatus: (jobId: string): Promise<ApiResponse<JobStatus>> =>
    unwrap(api.get(`/wizard/status/${jobId}`)),

  getMcpConfigs: (kbId: number, kbName: string, accessToken: string): Promise<ApiResponse<McpConfigsResponse>> =>
    unwrap(api.post('/wizard/mcp-configs', { kbId, kbName, accessToken })),

  getAiPrompts: (kbId: number, kbName: string, accessToken: string, description?: string): Promise<ApiResponse<AiPromptsResponse>> =>
    unwrap(api.post('/wizard/ai-prompts', { kbId, kbName, accessToken, description })),
}