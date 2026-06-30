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

export interface ProductItem {
  type: 'skill' | 'mcp' | 'template' | 'openapi' | 'structure'
  name: string
  description: string
  icon: string
  downloadUrl?: string
  content?: string
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

export const wizardApi = {
  init: (credential: KBCredential) =>
    api.post<ApiResponse<KBInfo>>('/wizard/init', credential),

  diagnose: (kbId: string, token: string) =>
    api.post<ApiResponse<DiagnoseResult>>('/wizard/diagnose', { kbId, token }),

  generate: (kbId: string, token: string) =>
    api.post<ApiResponse<GenerateResult>>('/wizard/generate', { kbId, token }),

  getStatus: (jobId: string) =>
    api.get<ApiResponse<JobStatus>>(`/wizard/status/${jobId}`),
}