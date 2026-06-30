import { execFile } from 'child_process'
import { promisify } from 'util'

const execFileAsync = promisify(execFile)

const LLM_API_URL = process.env.LLM_API_URL || 'http://jiuwen-api.vmic.xyz/v1/chat-messages'
const LLM_API_KEY = process.env.LLM_API_KEY || ''
const LLM_BOT_ID = process.env.LLM_BOT_ID || ''

interface TranslateResponse {
  answer?: string
  conversation_id?: string
}

interface TranslateSession {
  conversationId: string | null
  lastUsed: number
}

const sessions = new Map<string, TranslateSession>()
const SESSION_TIMEOUT_MS = 60 * 60 * 1000

setInterval(() => {
  const now = Date.now()
  for (const [k, s] of sessions.entries()) {
    if (now - s.lastUsed > SESSION_TIMEOUT_MS) {
      sessions.delete(k)
    }
  }
}, 60 * 1000)

export async function translateToEnglish(prompt: string, kbId: string): Promise<string> {
  if (!LLM_API_KEY) {
    throw new Error('LLM_API_KEY is not configured')
  }

  let session = sessions.get(kbId)
  if (!session) {
    session = { conversationId: null, lastUsed: Date.now() }
    sessions.set(kbId, session)
  }
  session.lastUsed = Date.now()

  const body: Record<string, unknown> = {
    query: prompt,
    inputs: {},
    response_mode: 'blocking',
    user: `km-portal-${kbId}`,
  }
  if (session.conversationId) {
    body.conversation_id = session.conversationId
  }

  const { stdout } = await execFileAsync(
    'curl',
    [
      '-s',
      '-X', 'POST',
      LLM_API_URL,
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${LLM_API_KEY}`,
      '-d', JSON.stringify(body),
      '--max-time', '30',
    ],
    { timeout: 35000 }
  )

  let data: TranslateResponse
  try {
    data = JSON.parse(stdout) as TranslateResponse
  } catch {
    return asciiFallback(prompt)
  }

  const answer = (data?.answer || '').toString().trim()

  if (data?.conversation_id && !session.conversationId) {
    session.conversationId = data.conversation_id as string
  }

  const match = answer.match(/知识库英文名[：:]\s*([^\n]+)/)
  if (match) {
    return sanitizeEnglish(match[1].trim())
  }

  const lines = answer.split('\n').map((l: string) => l.trim()).filter(Boolean)
  if (lines.length > 0) {
    const last = lines[lines.length - 1]
    if (/^[A-Za-z]/.test(last)) {
      return sanitizeEnglish(last)
    }
  }

  return asciiFallback(prompt)
}

export function sanitizeEnglish(s: string): string {
  return s
    .replace(/[\\/:*?"<>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'Skill'
}

export function asciiFallback(name: string): string {
  const ascii = name
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50)
  return ascii || `skill-${Date.now()}`
}

export { LLM_BOT_ID }
