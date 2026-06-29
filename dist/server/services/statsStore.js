"use strict";
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const DATA_DIR = path.join(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_DIR, 'api-stats.json');
async function readStore() {
    try {
        const content = await fs.readFile(STATS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return { calls: [] };
    }
}
async function writeStore(store) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(STATS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}
async function recordCall(data) {
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
}
async function getStats(kbId, days = 7) {
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
module.exports = { recordCall, getStats };
//# sourceMappingURL=statsStore.js.map