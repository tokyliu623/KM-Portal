import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getField } from '../utils/fieldCompat.js'
import { KMApiError, KMApiClient } from '../services/kmApiClient.js'
import { buildSkillZip } from '../services/skillPackage.js'
import { buildTreeFromFlat, visualizeTree, exportAsMarkdown, getDocCount } from '../services/kbTreeVisualizer.js'

const router = Router()

interface WizardJob {
  jobId: string
  kbId: number
  kbName: string
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  products: WizardProduct[]
  error?: string
  createdAt: string
}

interface WizardProduct {
  type: 'skill' | 'mcp' | 'ai_template' | 'openapi' | 'tree'
  name: string
  status: 'pending' | 'done' | 'error'
  data?: string
  error?: string
}

const jobs = new Map<string, WizardJob>()

setInterval(() => {
  const now = Date.now()
  const expireTime = 30 * 60 * 1000
  for (const [jobId, job] of jobs.entries()) {
    if (now - new Date(job.createdAt).getTime() > expireTime) {
      jobs.delete(jobId)
    }
  }
}, 5 * 60 * 1000)

interface InitResponse {
  valid: boolean
  kbInfo?: {
    kbId: number
    kbName: string
    permission: string
  }
  error?: string
}

router.post('/init', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbId = getField(req.body, 'kbId', 'kb_id')
    const token = getField(req.body, 'token', 'accessToken')
    const kbName = getField(req.body, 'kbName', 'kb_name')

    if (!kbId) {
      const response: InitResponse = { valid: false, error: 'kbId is required' }
      res.status(400).json(response)
      return
    }
    if (!token) {
      const response: InitResponse = { valid: false, error: 'token is required' }
      res.status(400).json(response)
      return
    }
    if (!kbName) {
      const response: InitResponse = { valid: false, error: 'kbName is required' }
      res.status(400).json(response)
      return
    }

    const kbIdNum = Number(kbId)
    if (isNaN(kbIdNum) || kbIdNum <= 0) {
      const response: InitResponse = { valid: false, error: 'Invalid kbId: must be a positive number' }
      res.status(400).json(response)
      return
    }

    const tokenStr = String(token)
    const kbNameStr = String(kbName)

    const kmApiClient: KMApiClient = req.app.locals.kmApiClient

    try {
      const kbInfo = await kmApiClient.getKBInfo(String(kbIdNum), tokenStr) as {
        kbId?: number
        kbName?: string
        effectivePermType?: string
      }

      const response: InitResponse = {
        valid: true,
        kbInfo: {
          kbId: kbInfo.kbId || kbIdNum,
          kbName: kbInfo.kbName || kbNameStr,
          permission: kbInfo.effectivePermType || 'read_only',
        },
      }
      res.json(response)
    } catch (error) {
      if (error instanceof KMApiError) {
        const response: InitResponse = { valid: false, error: error.message }
        res.status(error.status).json(response)
      } else {
        throw error
      }
    }
  } catch (error) {
    next(error)
  }
})

interface DiagnoseResponse {
  tree: Array<{
    id: number
    title: string
    parentId: number | null
    hasChild: boolean
    kbId: number
    kbName: string
    spaceId: number
    spaceName: string
  }>
  docCount: number
  summary: string
}

router.post('/diagnose', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbId = getField(req.body, 'kbId', 'kb_id')
    const token = getField(req.body, 'token', 'accessToken')

    if (!kbId) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }
    if (!token) {
      res.status(400).json({ success: false, error: 'token is required' })
      return
    }

    const kbIdNum = Number(kbId)
    const tokenStr = String(token)

    const kmApiClient: KMApiClient = req.app.locals.kmApiClient

    try {
      const treeData = await kmApiClient.getKBTree(String(kbIdNum), tokenStr) as {
        items?: Array<{
          id: number
          title: string
          parentId: number | null
          hasChild: boolean
          kbId: number
          kbName: string
          spaceId: number
          spaceName: string
        }>
      }

      const flatNodes = treeData.items || []
      const tree = buildTreeFromFlat(flatNodes)
      const docCount = getDocCount(tree)
      const visualization = visualizeTree(tree)

      const summary = `知识库包含 ${docCount} 个文档，最大层级深度 ${visualization.stats.maxDepth} 层`

      const response: DiagnoseResponse = {
        tree: flatNodes,
        docCount,
        summary,
      }
      res.json({ success: true, data: response })
    } catch (error) {
      if (error instanceof KMApiError) {
        res.status(error.status).json({ success: false, error: error.message })
      } else {
        throw error
      }
    }
  } catch (error) {
    next(error)
  }
})

interface GenerateResponse {
  jobId: string
  status: 'pending'
}

router.post('/generate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbId = getField(req.body, 'kbId', 'kb_id')
    const token = getField(req.body, 'token', 'accessToken')
    const kbName = getField(req.body, 'kbName', 'kb_name')

    if (!kbId) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }
    if (!token) {
      res.status(400).json({ success: false, error: 'token is required' })
      return
    }
    if (!kbName) {
      res.status(400).json({ success: false, error: 'kbName is required' })
      return
    }

    const kbIdNum = Number(kbId)
    const tokenStr = String(token)
    const kbNameStr = String(kbName)

    const jobId = uuidv4()
    const job: WizardJob = {
      jobId,
      kbId: kbIdNum,
      kbName: kbNameStr,
      status: 'pending',
      progress: 0,
      products: [
        { type: 'skill', name: 'Skill 安装包', status: 'pending' },
        { type: 'mcp', name: 'MCP 配置', status: 'pending' },
        { type: 'ai_template', name: 'AI 指令模板', status: 'pending' },
        { type: 'openapi', name: 'OpenAPI 规范', status: 'pending' },
        { type: 'tree', name: '目录结构', status: 'pending' },
      ],
      createdAt: new Date().toISOString(),
    }
    jobs.set(jobId, job)

    const kmApiClient: KMApiClient = req.app.locals.kmApiClient

    const generateJob = async (): Promise<void> => {
      job.status = 'running'

      try {
        const treeData = await kmApiClient.getKBTree(String(kbIdNum), tokenStr) as {
          items?: Array<{
            id: number
            title: string
            parentId: number | null
            hasChild: boolean
            kbId: number
            kbName: string
            spaceId: number
            spaceName: string
          }>
        }
        const flatNodes = treeData.items || []
        const tree = buildTreeFromFlat(flatNodes)

        job.progress = 20

        const skillIndex = job.products.findIndex(p => p.type === 'skill')
        try {
          const skillZip = await buildSkillZip({
            skillId: jobId,
            skillName: kbNameStr,
            description: `Knowledge Base Skill for ${kbNameStr}`,
            triggerWords: [],
            kbId: kbIdNum,
            kbName: kbNameStr,
            content: `# ${kbNameStr}\n\nKnowledge Base Skill for ${kbNameStr}`,
          })
          job.products[skillIndex] = {
            type: 'skill',
            name: 'Skill 安装包',
            status: 'done',
            data: skillZip.toString('base64'),
          }
        } catch (err) {
          job.products[skillIndex] = {
            type: 'skill',
            name: 'Skill 安装包',
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }

        job.progress = 40

        const mcpIndex = job.products.findIndex(p => p.type === 'mcp')
        try {
          const mcpConfig = {
            mcpServers: {
              'vivo-knowledge': {
                url: 'https://wiki.vivo.xyz/api/knowledge/mcp/rpc',
                headers: {
                  Authorization: `Bearer ${tokenStr}`,
                  'MCP-Protocol-Version': '2025-03-26',
                },
                transport: 'streamable-http',
              },
            },
          }
          job.products[mcpIndex] = {
            type: 'mcp',
            name: 'MCP 配置',
            status: 'done',
            data: JSON.stringify(mcpConfig, null, 2),
          }
        } catch (err) {
          job.products[mcpIndex] = {
            type: 'mcp',
            name: 'MCP 配置',
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }

        job.progress = 60

        const aiTemplateIndex = job.products.findIndex(p => p.type === 'ai_template')
        try {
          const templates = generateAiTemplates(kbNameStr, kbIdNum)
          job.products[aiTemplateIndex] = {
            type: 'ai_template',
            name: 'AI 指令模板',
            status: 'done',
            data: templates,
          }
        } catch (err) {
          job.products[aiTemplateIndex] = {
            type: 'ai_template',
            name: 'AI 指令模板',
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }

        job.progress = 80

        const openapiIndex = job.products.findIndex(p => p.type === 'openapi')
        try {
          const openapiSpec = generateOpenApiSpec(kbNameStr, kbIdNum)
          job.products[openapiIndex] = {
            type: 'openapi',
            name: 'OpenAPI 规范',
            status: 'done',
            data: openapiSpec,
          }
        } catch (err) {
          job.products[openapiIndex] = {
            type: 'openapi',
            name: 'OpenAPI 规范',
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }

        const treeIndex = job.products.findIndex(p => p.type === 'tree')
        try {
          const markdown = exportAsMarkdown(tree, kbNameStr)
          const visualization = visualizeTree(tree)
          job.products[treeIndex] = {
            type: 'tree',
            name: '目录结构',
            status: 'done',
            data: JSON.stringify({ markdown, visualization }, null, 2),
          }
        } catch (err) {
          job.products[treeIndex] = {
            type: 'tree',
            name: '目录结构',
            status: 'error',
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }

        job.progress = 100
        job.status = 'done'
      } catch (err) {
        job.status = 'error'
        job.error = err instanceof Error ? err.message : 'Unknown error'
      }
    }

    generateJob()

    const response: GenerateResponse = { jobId, status: 'pending' }
    res.json({ success: true, data: response })
  } catch (error) {
    next(error)
  }
})

interface StatusResponse {
  jobId: string
  status: 'pending' | 'running' | 'done' | 'error'
  progress: number
  products?: WizardProduct[]
  error?: string
}

router.get('/status/:jobId', (req: Request, res: Response) => {
  const { jobId } = req.params
  const job = jobs.get(jobId)

  if (!job) {
    res.status(404).json({ success: false, error: 'Job not found or expired' })
    return
  }

  const response: StatusResponse = {
    jobId: job.jobId,
    status: job.status,
    progress: job.progress,
    products: job.products,
    error: job.error,
  }
  res.json({ success: true, data: response })
})

function generateAiTemplates(kbName: string, kbId: number): string {
  const templates = [
    {
      name: '文档写作助手',
      category: 'writing',
      content: `你是一个专业的文档写作助手，擅长帮助用户撰写高质量的文档。

请根据用户提供的关键词或主题，参考知识库「${kbName}」(ID: ${kbId}) 中的相关内容，生成结构清晰、内容准确的文档。

请遵循以下格式：
1. 标题
2. 概述
3. 详细内容
4. 总结

开始写作前，请先检索知识库中的相关文档作为参考。`,
    },
    {
      name: '文档阅读助手',
      category: 'reading',
      content: `你是一个专业的文档阅读助手，擅长帮助用户理解和总结文档内容。

请根据用户提供的文档或主题，从知识库「${kbName}」(ID: ${kbId}) 中检索相关内容，并提供：
1. 文档摘要
2. 关键要点
3. 相关背景知识
4. 进一步阅读建议`,
    },
    {
      name: '知识检索助手',
      category: 'search',
      content: `你是一个专业的知识检索助手，擅长从知识库中精准检索用户需要的信息。

请根据用户的查询，从知识库「${kbName}」(ID: ${kbId}) 中检索相关内容，并提供：
1. 相关文档列表
2. 每个文档的相关度评分
3. 关键内容摘要
4. 文档链接`,
    },
    {
      name: '结构化指令模板',
      category: 'template',
      content: `请使用以下结构化指令模板生成回答：

【背景】
{描述任务背景}

【目标】
{明确回答目标}

【约束条件】
{列出限制条件}

【输出格式】
{指定输出格式}

【参考知识】
请从知识库「${kbName}」(ID: ${kbId}) 中检索相关内容作为参考。`,
    },
    {
      name: '知识库问答',
      category: 'qa',
      content: `你是一个专业的知识库问答助手，基于知识库「${kbName}」(ID: ${kbId}) 回答用户问题。

请遵循以下流程：
1. 理解用户问题
2. 检索知识库相关内容
3. 综合分析后给出准确回答
4. 注明信息来源

如果知识库中没有相关信息，请明确告知用户。`,
    },
  ]

  return JSON.stringify(templates, null, 2)
}

function generateOpenApiSpec(kbName: string, kbId: number): string {
  const spec = {
    openapi: '3.0.3',
    info: {
      title: `${kbName} - Knowledge Base API`,
      description: `OpenAPI specification for knowledge base "${kbName}" (ID: ${kbId})`,
      version: '1.0.0',
    },
    servers: [
      {
        url: 'https://wiki.vivo.xyz',
        description: 'Production',
      },
    ],
    paths: {
      '/api/knowledge/v1/openapi/kb/{kbId}/info': {
        get: {
          operationId: 'getKBInfo',
          summary: '获取知识库信息',
          tags: ['Knowledge Base'],
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: '知识库 ID',
            },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      kbId: { type: 'integer' },
                      kbName: { type: 'string' },
                      effectivePermType: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/v1/openapi/kb/{kbId}/tree': {
        get: {
          operationId: 'getKBTree',
          summary: '获取知识库目录树',
          tags: ['Knowledge Base'],
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
              description: '知识库 ID',
            },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      items: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'integer' },
                            title: { type: 'string' },
                            parentId: { type: 'integer', nullable: true },
                            hasChild: { type: 'boolean' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/v1/openapi/kb/{kbId}/document/{docId}': {
        get: {
          operationId: 'getKBDocument',
          summary: '获取文档内容',
          tags: ['Knowledge Base'],
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
            {
              name: 'docId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contentId: { type: 'integer' },
                      title: { type: 'string' },
                      content: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/v1/openapi/kb/{kbId}/contents/create': {
        post: {
          operationId: 'createContent',
          summary: '创建文档',
          tags: ['Knowledge Base'],
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['title', 'content'],
                  properties: {
                    title: { type: 'string' },
                    content: { type: 'string' },
                    contentType: { type: 'string', default: 'markdown' },
                    parentId: { type: 'integer' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contentId: { type: 'integer' },
                      link: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/knowledge/v1/openapi/kb/{kbId}/contents/update': {
        post: {
          operationId: 'updateContent',
          summary: '更新文档',
          tags: ['Knowledge Base'],
          parameters: [
            {
              name: 'kbId',
              in: 'path',
              required: true,
              schema: { type: 'integer' },
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['contentId', 'content'],
                  properties: {
                    contentId: { type: 'integer' },
                    title: { type: 'string' },
                    content: { type: 'string' },
                    contentType: { type: 'string', default: 'markdown' },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      contentId: { type: 'integer' },
                      link: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: `accessToken for KB ${kbId}`,
        },
      },
    },
    security: [{ bearerAuth: [] }],
  }

  return JSON.stringify(spec, null, 2)
}

export default router