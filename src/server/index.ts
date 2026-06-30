import express from 'express'
import cors from 'cors'
import path from 'path'
import adminRouter from './routes/admin.js'
import kbRouter from './routes/kb.js'
import statsRouter from './routes/stats.js'
import skillRouter from './routes/skill.js'
import diagRouter from './routes/diag.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'
import { KMApiClient } from './services/kmApiClient.js'

const __dirname = path.resolve()
const STATIC_DIR = path.join(__dirname, 'dist/client')
const INDEX_FILE = path.join(__dirname, 'dist/client/index.html')

const app = express()
const PORT = process.env.PORT || 5053

const kmApiClient = new KMApiClient({
  baseUrl: process.env.WIKI_BASE_URL || 'https://wiki.vivo.xyz',
  apiKey: process.env.KM_API_KEY || '',
})
app.locals.kmApiClient = kmApiClient

app.use(cors())
app.use(express.json())
app.use(requestLogger)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'KM-Portal',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

app.use('/api/admin', adminRouter)
app.use('/api/skill', skillRouter)
app.use('/api/kb', kbRouter)
app.use('/api/stats', statsRouter)
app.use('/api/diag', diagRouter)

app.use(express.static(STATIC_DIR))

app.get('*', (req, res) => {
  res.sendFile(INDEX_FILE)
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`KM-Portal server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)

  // v1.7.1 启动凭证自检
  const llmKeyStatus = process.env.LLM_API_KEY ? 'configured' : 'MISSING'
  const kmKeyStatus = process.env.KM_API_KEY ? 'configured' : 'MISSING'
  console.log(`[Boot] LLM_API_KEY: ${llmKeyStatus}`)
  console.log(`[Boot] KM_API_KEY:  ${kmKeyStatus}`)
  console.log(`[Boot] LLM_BOT_ID:  ${process.env.LLM_BOT_ID || 'not set'}`)
  console.log(`[Boot] WIKI_BASE_URL: ${process.env.WIKI_BASE_URL || 'default (https://wiki.vivo.xyz)'}`)
  if (llmKeyStatus === 'MISSING') {
    console.warn('[Boot] WARNING: 九问翻译功能不可用（LLM_API_KEY 未配置），Skill 中文名翻译将降级为 ASCII')
  }
  if (kmKeyStatus === 'MISSING') {
    console.warn('[Boot] WARNING: KM API 调用可能失败（KM_API_KEY 未配置）')
  }
})