import api from './api'

export interface KbInfo {
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

export interface ContentBody {
  contentId: number
  title: string
  content: string
  kbId: number
  kbName: string
  spaceId: number
  spaceName: string
  link: string
}

export interface KBDocument {
  id: string
  title: string
  content: string
  category?: string
  createdAt: string
  updatedAt: string
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export const kbApi = {
  getInfo: (kbId: string) => api.post<ApiResponse<KbInfo[]>>('/kb/info', { kb_id: kbId }),

  getTree: (kbId: string, parentId?: number) =>
    api.post<ApiResponse<TreeNode[]>>('/kb/tree', { kb_id: kbId, parent_id: parentId }),

  getContent: (kbId: string, contentIds: number[], contentType: string) =>
    api.post<ApiResponse<{ type: string; content: ContentBody[] }>>('/kb/content', {
      kb_id: kbId,
      content_ids: contentIds,
      content_type: contentType,
    }),

  createContent: (kbId: string, title: string, contentType: string, content: string, parentId?: number) =>
    api.post<ApiResponse<ContentBody>>('/kb/contents/create', {
      kb_id: kbId,
      title,
      content_type: contentType,
      content,
      parent_id: parentId,
    }),

  updateContent: (kbId: string, contentId: number, title: string, contentType: string, content: string) =>
    api.post<ApiResponse<ContentBody>>('/kb/contents/update', {
      kb_id: kbId,
      content_id: contentId,
      title,
      content_type: contentType,
      content,
    }),

  verifyAccess: (kbId: string) => api.get<ApiResponse<{ permission: string }>>(`/kb/${kbId}`),

  listDocuments: (kbId: string) =>
    api.get<ApiResponse<{ documents: KBDocument[] }>>(`/kb/${kbId}/documents`),

  createDocument: (kbId: string, data: { title: string; content: string; category?: string }) =>
    api.post<ApiResponse<KBDocument>>(`/kb/${kbId}/documents`, data),

  updateDocument: (kbId: string, docId: string, data: { title?: string; content?: string; category?: string }) =>
    api.put<ApiResponse<KBDocument>>(`/kb/${kbId}/documents/${docId}`, data),

  deleteDocument: (kbId: string, docId: string) =>
    api.delete<ApiResponse<null>>(`/kb/${kbId}/documents/${docId}`),
}