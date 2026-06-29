import { Request, Response, NextFunction } from 'express'
import { recordCall } from '../services/statsStore.js'
import { getClientIp } from '../utils/index.js'

interface LogRequest extends Request {
  apiKeyId?: string
  kbId?: string
}

interface PendingLog {
  apiKeyId: string
  kbId: string
  endpoint: string
  method: string
  statusCode: number
  latencyMs: number
  ip: string
  userAgent: string
}

const pendingLogs: PendingLog[] = []
const FLUSH_INTERVAL = 5000
const FLUSH_BATCH_SIZE = 50
let flushTimer: NodeJS.Timeout | null = null

async function flushLogs(): Promise<void> {
  if (pendingLogs.length === 0) return
  const batch = pendingLogs.splice(0, FLUSH_BATCH_SIZE)
  await Promise.all(
    batch.map((log) =>
      recordCall({
        ...log,
        userAgent: log.userAgent,
      }).catch((err) => console.error('Failed to record call:', err.message))
    )
  )
  if (pendingLogs.length > 0) {
    setImmediate(() => flushLogs())
  }
}

function ensureFlushTimer(): void {
  if (flushTimer) return
  flushTimer = setInterval(() => {
    flushLogs().catch((err) => console.error('Flush logs error:', err.message))
  }, FLUSH_INTERVAL)
  flushTimer.unref()
}

export function requestLogger(req: LogRequest, res: Response, next: NextFunction) {
  const start = Date.now()
  ensureFlushTimer()

  res.on('finish', () => {
    if (!req.apiKeyId) return
    const latency = Date.now() - start
    pendingLogs.push({
      apiKeyId: req.apiKeyId,
      kbId: req.kbId || '',
      endpoint: req.path,
      method: req.method,
      statusCode: res.statusCode,
      latencyMs: latency,
      ip: getClientIp(req) || '',
      userAgent: (req.headers['user-agent'] as string) || '',
    })
  })

  next()
}