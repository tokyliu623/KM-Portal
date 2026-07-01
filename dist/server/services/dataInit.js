import { promises as fs } from 'fs';
import path from 'path';
const DEFAULT_DATA_DIR = path.join(process.cwd(), 'data');
const DEFAULT_FILES = [
    ['tokens.json', { tokens: [] }],
    ['skills.json', { skills: [] }],
    ['api-keys.json', { keys: [] }],
    ['api-logs.json', { calls: [] }],
    ['operation-stats.json', { stats: [] }],
];
export function getDataDir() {
    return process.env.KM_DATA_DIR || DEFAULT_DATA_DIR;
}
export async function ensureDataFiles(dataDir = getDataDir()) {
    const initialized = [];
    await fs.mkdir(dataDir, { recursive: true });
    for (const [filename, defaultContent] of DEFAULT_FILES) {
        const filePath = path.join(dataDir, filename);
        try {
            await fs.access(filePath);
        }
        catch {
            await fs.writeFile(filePath, JSON.stringify(defaultContent, null, 2), 'utf-8');
            initialized.push(filename);
        }
    }
    return initialized;
}
