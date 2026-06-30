import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
const DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_STATS_FILE = path.join(DATA_DIR, 'api-logs.json');
function statsFile() {
    return process.env.STATS_FILE || DEFAULT_STATS_FILE;
}
let writeQueue = Promise.resolve();
async function withLock(fn) {
    const next = writeQueue.then(fn, fn);
    writeQueue = next.catch(() => undefined);
    return next;
}
async function readStore() {
    try {
        const file = statsFile();
        const content = await fs.readFile(file, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return { calls: [] };
    }
}
async function writeStore(store) {
    const file = statsFile();
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(store, null, 2), 'utf-8');
}
export async function recordCall(data) {
    await withLock(async () => {
        const store = await readStore();
        store.calls.push({
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
        });
        if (store.calls.length > 10000) {
            store.calls = store.calls.slice(-5000);
        }
        await writeStore(store);
    });
}
export async function getStats(kbId, days = 7) {
    const store = await readStore();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    const calls = store.calls.filter((c) => new Date(c.createdAt).getTime() > cutoff && (!kbId || c.kbId === kbId));
    const byDay = {};
    const byEndpoint = {};
    let totalLatency = 0;
    for (const call of calls) {
        const day = call.createdAt.substring(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
        byEndpoint[call.endpoint] = (byEndpoint[call.endpoint] || 0) + 1;
        totalLatency += call.latencyMs;
    }
    return {
        total: calls.length,
        byDay,
        byEndpoint,
        avgLatency: calls.length > 0 ? Math.round(totalLatency / calls.length) : 0,
    };
}
export async function getRawCalls(kbId, days = 7, skillName, skillId) {
    const store = await readStore();
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return store.calls.filter((c) => {
        if (new Date(c.createdAt).getTime() <= cutoff)
            return false;
        if (kbId && c.kbId !== kbId)
            return false;
        if (skillName && c.skillName !== skillName)
            return false;
        if (skillId && c.skillId !== skillId)
            return false;
        return true;
    });
}
