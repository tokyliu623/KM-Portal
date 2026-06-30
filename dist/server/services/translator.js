import { execFile } from 'child_process';
import { promisify } from 'util';
const execFileAsync = promisify(execFile);
const LLM_API_URL = process.env.LLM_API_URL || 'http://jiuwen-api.vmic.xyz/v1/chat-messages';
const LLM_API_KEY = process.env.LLM_API_KEY || '';
const LLM_BOT_ID = process.env.LLM_BOT_ID || '';
const sessions = new Map();
const SESSION_TIMEOUT_MS = 60 * 60 * 1000;
setInterval(() => {
    const now = Date.now();
    for (const [k, s] of sessions.entries()) {
        if (now - s.lastUsed > SESSION_TIMEOUT_MS) {
            sessions.delete(k);
        }
    }
}, 60 * 1000);
export async function translateToEnglish(prompt, kbId) {
    if (!LLM_API_KEY) {
        throw new Error('LLM_API_KEY is not configured');
    }
    let session = sessions.get(kbId);
    if (!session) {
        session = { conversationId: null, lastUsed: Date.now() };
        sessions.set(kbId, session);
    }
    session.lastUsed = Date.now();
    const body = {
        query: prompt,
        inputs: {},
        response_mode: 'blocking',
        user: `km-portal-${kbId}`,
    };
    if (session.conversationId) {
        body.conversation_id = session.conversationId;
    }
    const { stdout } = await execFileAsync('curl', [
        '-s',
        '-X', 'POST',
        LLM_API_URL,
        '-H', 'Content-Type: application/json',
        '-H', `Authorization: Bearer ${LLM_API_KEY}`,
        '-d', JSON.stringify(body),
        '--max-time', '30',
    ], { timeout: 35000 });
    let data;
    try {
        data = JSON.parse(stdout);
    }
    catch {
        return asciiFallback(prompt);
    }
    const answer = (data?.answer || '').toString().trim();
    if (data?.conversation_id && !session.conversationId) {
        session.conversationId = data.conversation_id;
    }
    const match = answer.match(/知识库英文名[：:]\s*([^\n]+)/);
    if (match) {
        return sanitizeEnglish(match[1].trim());
    }
    const lines = answer.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length > 0) {
        const last = lines[lines.length - 1];
        if (/^[A-Za-z]/.test(last)) {
            return sanitizeEnglish(last);
        }
    }
    return asciiFallback(prompt);
}
export function sanitizeEnglish(s) {
    return s
        .replace(/[\\/:*?"<>|]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 80) || 'Skill';
}
export function asciiFallback(name) {
    const ascii = name
        .replace(/[^\x20-\x7E]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
    return ascii || `skill-${Date.now()}`;
}
export async function translatorHealthCheck() {
    const start = Date.now();
    if (!LLM_API_KEY) {
        return { reachable: false, latencyMs: 0, error: 'LLM_API_KEY not configured' };
    }
    try {
        const testBody = {
            query: 'hi',
            inputs: {},
            response_mode: 'blocking',
            user: 'km-portal-health-check',
        };
        await execFileAsync('curl', [
            '-s',
            '-o', '/dev/null',
            '-w', '%{http_code}',
            '-X', 'POST',
            LLM_API_URL,
            '-H', 'Content-Type: application/json',
            '-H', `Authorization: Bearer ${LLM_API_KEY}`,
            '-d', JSON.stringify(testBody),
            '--max-time', '10',
        ], { timeout: 12000 });
        return { reachable: true, latencyMs: Date.now() - start };
    }
    catch (err) {
        return {
            reachable: false,
            latencyMs: Date.now() - start,
            error: err.message,
        };
    }
}
export { LLM_BOT_ID, LLM_API_URL, LLM_API_KEY };
