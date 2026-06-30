import { recordCall } from '../services/statsStore.js';
import { getClientIp } from '../utils/index.js';
const pendingLogs = [];
const FLUSH_INTERVAL = 5000;
const FLUSH_BATCH_SIZE = 50;
let flushTimer = null;
async function flushLogs() {
    if (pendingLogs.length === 0)
        return;
    const batch = pendingLogs.splice(0, FLUSH_BATCH_SIZE);
    await Promise.all(batch.map((log) => recordCall({
        ...log,
        userAgent: log.userAgent,
    }).catch((err) => console.error('Failed to record call:', err.message))));
    if (pendingLogs.length > 0) {
        setImmediate(() => flushLogs());
    }
}
function ensureFlushTimer() {
    if (flushTimer)
        return;
    flushTimer = setInterval(() => {
        flushLogs().catch((err) => console.error('Flush logs error:', err.message));
    }, FLUSH_INTERVAL);
    flushTimer.unref();
}
export function requestLogger(req, res, next) {
    const start = Date.now();
    ensureFlushTimer();
    res.on('finish', () => {
        if (!req.apiKeyId)
            return;
        const latency = Date.now() - start;
        pendingLogs.push({
            apiKeyId: req.apiKeyId,
            kbId: req.kbId || '',
            endpoint: req.path,
            method: req.method,
            statusCode: res.statusCode,
            latencyMs: latency,
            ip: getClientIp(req) || '',
            userAgent: req.headers['user-agent'] || '',
            skillId: req.skillId,
            skillName: req.skillName,
        });
    });
    next();
}
