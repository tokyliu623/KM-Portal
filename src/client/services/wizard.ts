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
  description: string
  icon: string
  downloadUrl?: string
  content?: string
  mimeType?: string
  filename?: string
  status?: 'pending' | 'done' | 'error'
  error?: string
}

export interface GenerateResult {
  jobId: string
  products: ProductItem[]
}

export interface JobStatus {
  jobId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  progress: number
  message?: string
  result?: GenerateResult
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

export const wizardApi = {
  init: (credential: KBCredential) =>
    api.post<ApiResponse<KBInfo>>('/wizard/init', credential),

  diagnose: (kbId: string, token: string) =>
    api.post<ApiResponse<DiagnoseResult>>('/wizard/diagnose', { kbId, token }),

  generate: (kbId: string, token: string) =>
    api.post<ApiResponse<GenerateResult>>('/wizard/generate', { kbId, token }),

  getStatus: (jobId: string) =>
    api.get<ApiResponse<JobStatus>>(`/wizard/status/${jobId}`),

  getMcpConfigs: (kbId: number, kbName: string, accessToken: string) =>
    api.post<ApiResponse<McpConfigsResponse>>('/wizard/mcp-configs', {
      kbId,
      kbName,
      accessToken,
    }),

  getAiPrompts: (kbId: number, kbName: string, accessToken: string, description?: string) =>
    api.post<ApiResponse<AiPromptsResponse>>('/wizard/ai-prompts', {
      kbId,
      kbName,
      accessToken,
      description,
    }),

  getOpenApiSpecUrl: (kbId: number, kbName: string) =>
    `/api/wizard/openapi.json?kbId=${kbId}&kbName=${encodeURIComponent(kbName)}`,

  getSwaggerUrl: (kbId: number, kbName: string) =>
    `/api/wizard/swagger?kbId=${kbId}&kbName=${encodeURIComponent(kbName)}`,
}