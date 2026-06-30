import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { operationStatsService } from '../services/operationStatsService.js';
import { statsService } from '../services/statsService.js';
const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_FILE = path.join(DATA_DIR, 'api-logs.json');
async function readLogs() {
    try {
        const content = await fs.readFile(LOGS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return [];
    }
}
router.get('/overview', async (_req, res) => {
    try {
        const logs = await readLogs();
        const stats = {
            totalCalls: logs.length,
            callsByEndpoint: {},
            callsByStatus: {},
            recentCalls: logs.slice(-100),
            dateRange: logs.length > 0
                ? { start: logs[0].timestamp, end: logs[logs.length - 1].timestamp }
                : { start: new Date().toISOString(), end: new Date().toISOString() },
        };
        logs.forEach((log) => {
            stats.callsByEndpoint[log.path] = (stats.callsByEndpoint[log.path] || 0) + 1;
            stats.callsByStatus[log.statusCode.toString()] = (stats.callsByStatus[log.statusCode.toString()] || 0) + 1;
        });
        res.json({ success: true, data: stats });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch stats' });
    }
});
router.get('/daily', async (req, res) => {
    try {
        const daysNum = parseInt(req.query.days);
        if (isNaN(daysNum) || daysNum <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid days parameter' });
        }
        const days = daysNum;
        const logs = await readLogs();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        const filteredLogs = logs.filter((log) => new Date(log.timestamp) >= cutoff);
        const dailyStats = {};
        filteredLogs.forEach((log) => {
            const date = log.timestamp.split('T')[0];
            if (!dailyStats[date]) {
                dailyStats[date] = { date, calls: 0, errors: 0 };
            }
            dailyStats[date].calls++;
            if (log.statusCode >= 400) {
                dailyStats[date].errors++;
            }
        });
        res.json({
            success: true,
            data: Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date)),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch daily stats' });
    }
});
router.get('/endpoints', async (_req, res) => {
    try {
        const logs = await readLogs();
        const endpointStats = {};
        logs.forEach((log) => {
            if (!endpointStats[log.path]) {
                endpointStats[log.path] = { path: log.path, calls: 0, avgDuration: 0, errorRate: 0 };
            }
            endpointStats[log.path].calls++;
            endpointStats[log.path].avgDuration += log.duration;
            if (log.statusCode >= 400) {
                endpointStats[log.path].errorRate++;
            }
        });
        Object.values(endpointStats).forEach((stat) => {
            stat.avgDuration = Math.round(stat.avgDuration / stat.calls);
            stat.errorRate = Math.round((stat.errorRate / stat.calls) * 100);
        });
        res.json({
            success: true,
            data: Object.values(endpointStats).sort((a, b) => b.calls - a.calls),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch endpoint stats' });
    }
});
router.get('/operation/:kbId', async (req, res) => {
    try {
        const { kbId } = req.params;
        const days = parseInt(req.query.days) || 7;
        const [apiSummary, kpis] = await Promise.all([
            operationStatsService.getApiLogStats(days),
            operationStatsService.getManualKpis(kbId, days),
        ]);
        const trend = operationStatsService.generateTrendData(kpis);
        res.json({
            success: true,
            data: {
                kbId,
                days,
                apiLog: apiSummary,
                kpis,
                trend,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch operation stats' });
    }
});
router.post('/operation/:kbId', async (req, res) => {
    try {
        const { kbId } = req.params;
        const body = req.body;
        if (!body || !body.date) {
            return res.status(400).json({ success: false, error: 'date is required' });
        }
        const entry = {
            date: body.date,
            uv: Number(body.uv) || 0,
            pv: Number(body.pv) || 0,
            conversionRate: body.conversionRate !== undefined ? Number(body.conversionRate) : undefined,
            satisfaction: body.satisfaction !== undefined ? Number(body.satisfaction) : undefined,
            customMetrics: body.customMetrics,
        };
        await operationStatsService.saveManualKpi(kbId, entry);
        res.json({ success: true, data: entry });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to save KPI' });
    }
});
router.get('/health/:kbId', async (req, res) => {
    try {
        const { kbId } = req.params;
        const days = parseInt(req.query.days) || 7;
        const kpis = await operationStatsService.getManualKpis(kbId, days);
        const score = operationStatsService.calculateHealthScore(kpis);
        res.json({ success: true, data: { kbId, days, ...score } });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to compute health score' });
    }
});
/** v1.9.0: 按 Skill 名称 + KB ID 双维度统计 */
router.get('/by-skill', async (req, res) => {
    try {
        const skillName = req.query.skillName;
        const skillId = req.query.skillId;
        const kbId = req.query.kbId;
        const days = parseInt(req.query.days) || 7;
        const data = await statsService.getStatsBySkill({ skillName, skillId, kbId, days });
        res.json({ success: true, data });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch skill stats' });
    }
});
export default router;
