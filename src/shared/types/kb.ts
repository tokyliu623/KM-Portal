// KB 知识库共享类型（前后端共用）
// v1.7.1 新增：解决客户端 kb_id vs 服务端 kbId 字段不一致问题
// 前端通过相对路径引用：../../shared/types/kb
// 后端通过相对路径引用：../../shared/types/kb

export interface KBTreeNode {
  id: number
  name: string
  parent_id: number | null
  children?: KBTreeNode[]
  document_count?: number
}

export interface KBDocument {
  id: number
  title: string
  content: string
  parent_id: number | null
  updated_at: string
}

export interface KBInfo {
  id: number
  name: string
  description?: string
  document_count: number
  created_at: string
}

// 所有 KB API 统一使用 camelCase 字段
export interface GetTreeRequest {
  kbId: string | number
  parentId?: number
}

export interface GetContentRequest {
  kbId: string | number
  docId: string | number
}

export interface GetInfoRequest {
  kbId: string | number
}

export interface CreateContentRequest {
  kbId: string | number
  title: string
  content: string
  parentId?: number
}

export interface UpdateContentRequest {
  kbId: string | number
  docId: string | number
  title?: string
  content?: string
}

export interface DeleteContentRequest {
  kbId: string | number
  docId: string | number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  warning?: string
}
