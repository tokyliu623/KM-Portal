import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import router from './routes/index.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 5053

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

app.use('/api', router)

app.use(express.static(path.join(__dirname, '../client')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'))
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`KM-Portal server running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/api/health`)
})