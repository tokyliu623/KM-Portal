import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { getField } from '../utils/fieldCompat.js'
import { KMApiError, KMApiClient } from '../services/kmApiClient.js'
import { buildSkillZip } from '../services/skillPackage.js'
import { buildTreeFromFlat, visualizeTree, exportAsMarkdown, getDocCount } from '../services/kbTreeVisualizer.js'
import { generateOpenApiSpec, generateSwaggerHtml } from '../services/openApiSpecGenerator.js'
import { generateAllMcpConfigs } from '../services/mcpConfigGenerator.js'
import { generateAllAiPrompts, type AiPromptInput, type AiPromptTemplate } from '../services/aiPromptTemplateGenerator.js'

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
  // v1.8.6: 初始返回 5 个 pending 占位,前端可立即展示卡片
  products: Array<{
    type: 'skill' | 'mcp' | 'ai_template' | 'openapi' | 'tree'
    name: string
    status: 'pending'
  }>
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
          // v1.8.1 抽离到 mcpConfigGenerator service（向后兼容：data 仍为 JSON 字符串）
          const allMcpConfigs = generateAllMcpConfigs({
            kbId: kbIdNum,
            kbName: kbNameStr,
            accessToken: tokenStr,
          })
          const mcpConfig = JSON.parse(allMcpConfigs.claudeDesktop.content)
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
          const openapiObj = generateOpenApiSpec({
            kbId: kbIdNum,
            kbName: kbNameStr,
            baseUrl: process.env.WIKI_BASE_URL || 'https://wiki.vivo.xyz',
            accessToken: tokenStr,
          })
          const openapiSpec = JSON.stringify(openapiObj, null, 2)
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

    // v1.8.6: 初始返回 5 个 pending 占位
    const initialProducts: GenerateResponse['products'] = [
      { type: 'skill', name: 'Skill 安装包', status: 'pending' },
      { type: 'mcp', name: 'MCP 配置', status: 'pending' },
      { type: 'ai_template', name: 'AI 指令模板', status: 'pending' },
      { type: 'openapi', name: 'OpenAPI 规范', status: 'pending' },
      { type: 'tree', name: '目录结构', status: 'pending' },
    ]

    const response: GenerateResponse = { jobId, status: 'pending', products: initialProducts }
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

router.post('/ai-prompts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbId = getField(req.body, 'kbId', 'kb_id')
    const kbName = getField(req.body, 'kbName', 'kb_name')
    const accessToken = getField(req.body, 'accessToken', 'token')
    const description = getField(req.body, 'description', 'desc')

    if (!kbId) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }
    if (!kbName) {
      res.status(400).json({ success: false, error: 'kbName is required' })
      return
    }
    if (!accessToken) {
      res.status(400).json({ success: false, error: 'accessToken is required' })
      return
    }

    const kbIdNum = Number(kbId)
    if (isNaN(kbIdNum) || kbIdNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid kbId: must be a positive number' })
      return
    }

    const input: AiPromptInput = {
      kbId: kbIdNum,
      kbName: String(kbName),
      accessToken: String(accessToken),
      description: description ? String(description) : undefined,
    }

    const templates = generateAllAiPrompts(input)
    res.json({
      success: true,
      data: {
        kbId: kbIdNum,
        kbName: String(kbName),
        count: templates.length,
        templates,
      },
    })
  } catch (err) {
    next(err)
  }
})

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

// v1.8.1 新增：独立下载 4 客户端 MCP 配置
// POST /api/wizard/mcp-configs
// body: { kbId, kbName, accessToken }
// 返回 4 个文件 (filename + base64 content) + 安装说明
router.post('/mcp-configs', (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbId = getField(req.body, 'kbId', 'kb_id')
    const kbName = getField(req.body, 'kbName', 'kb_name')
    const accessToken = getField(req.body, 'accessToken', 'token')

    if (!kbId) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }
    if (!kbName) {
      res.status(400).json({ success: false, error: 'kbName is required' })
      return
    }
    if (!accessToken) {
      res.status(400).json({ success: false, error: 'accessToken is required' })
      return
    }

    const kbIdNum = Number(kbId)
    if (isNaN(kbIdNum) || kbIdNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid kbId: must be a positive number' })
      return
    }

    const allConfigs = generateAllMcpConfigs({
      kbId: kbIdNum,
      kbName: String(kbName),
      accessToken: String(accessToken),
    })

    const files = Object.entries(allConfigs).map(([client, cfg]) => ({
      client,
      filename: cfg.filename,
      mimeType: cfg.mimeType,
      content: Buffer.from(cfg.content, 'utf-8').toString('base64'),
    }))

    res.json({
      success: true,
      data: {
        kbId: kbIdNum,
        kbName: String(kbName),
        files,
        installHints: {
          claudeDesktop: '保存为 ~/Library/Application Support/Claude/claude_desktop_config.json',
          cursor: '保存为 .cursor/mcp.json (项目根目录)',
          continue: '保存为 .continue/mcpServers/mcp.json',
          cline: '保存为 .vscode/cline_mcp_settings.json',
        },
      },
    })
  } catch (error) {
    next(error)
  }
})

function generateAiTemplates(kbName: string, kbId: number): string {
  // v1.8.2: 委托给 aiPromptTemplateGenerator（5 类 .md 模板）
  // 保留旧 JSON 格式以兼容现有前端 WizardProduct.data
  const input: AiPromptInput = { kbId, kbName, accessToken: '' }
  const all = generateAllAiPrompts(input)
  const templates = all.map((t: AiPromptTemplate) => {
    const categoryMap: Record<string, string> = {
      writing: 'writing',
      reading: 'reading',
      qa: 'qa',
      retrieval: 'search',
      command: 'template',
    }
    const nameMap: Record<string, string> = {
      writing: '文档写作助手',
      reading: '文档阅读助手',
      qa: '知识库问答',
      retrieval: '知识检索助手',
      command: '结构化指令模板',
    }
    return {
      name: nameMap[t.type] || t.type,
      category: categoryMap[t.type] || t.type,
      content: t.content,
    }
  })
  return JSON.stringify(templates, null, 2)
}

router.get('/openapi.json', (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbIdRaw = req.query.kbId ?? req.query.kb_id
    const kbNameRaw = req.query.kbName ?? req.query.kb_name
    const tokenRaw = req.query.token ?? req.query.accessToken

    if (!kbIdRaw) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }
    if (!kbNameRaw) {
      res.status(400).json({ success: false, error: 'kbName is required' })
      return
    }

    const kbIdNum = Number(kbIdRaw)
    if (isNaN(kbIdNum) || kbIdNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid kbId: must be a positive number' })
      return
    }

    const spec = generateOpenApiSpec({
      kbId: kbIdNum,
      kbName: String(kbNameRaw),
      baseUrl: process.env.WIKI_BASE_URL || 'https://wiki.vivo.xyz',
      accessToken: tokenRaw ? String(tokenRaw) : '',
    })

    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.json(spec)
  } catch (error) {
    next(error)
  }
})

router.get('/swagger', (req: Request, res: Response, next: NextFunction) => {
  try {
    const kbIdRaw = req.query.kbId ?? req.query.kb_id
    const kbNameRaw = req.query.kbName ?? req.query.kb_name

    if (!kbIdRaw) {
      res.status(400).json({ success: false, error: 'kbId is required' })
      return
    }

    const kbIdNum = Number(kbIdRaw)
    if (isNaN(kbIdNum) || kbIdNum <= 0) {
      res.status(400).json({ success: false, error: 'Invalid kbId: must be a positive number' })
      return
    }

    const title = `${kbNameRaw ? String(kbNameRaw) : 'KB ' + kbIdNum} - API Docs`
    const specUrl = `/api/wizard/openapi.json?kbId=${kbIdNum}${kbNameRaw ? `&kbName=${encodeURIComponent(String(kbNameRaw))}` : ''}`
    const html = generateSwaggerHtml(specUrl, title)

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(html)
  } catch (error) {
    next(error)
  }
})

export default router