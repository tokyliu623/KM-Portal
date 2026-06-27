interface ApiCallRecord {
    id: string;
    apiKeyId: string;
    kbId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    latencyMs: number;
    ip: string;
    userAgent: string;
    createdAt: string;
}
export declare function recordCall(data: Omit<ApiCallRecord, 'id' | 'createdAt'>): Promise<void>;
export declare function getStats(kbId?: string, days?: number): Promise<{
    total: number;
    byDay: Record<string, number>;
    byEndpoint: Record<string, number>;
    avgLatency: number;
}>;
export {};
//# sourceMappingURL=statsStore.d.ts.map