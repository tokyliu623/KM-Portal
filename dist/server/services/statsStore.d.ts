declare const fs: any;
declare const path: any;
declare const uuidv4: any;
declare const DATA_DIR: any;
declare const STATS_FILE: any;
declare function recordCall(data: any): Promise<void>;
declare function getStats(kbId: any, days?: number): Promise<{
    total: any;
    byDay: {};
    byEndpoint: {};
    avgLatency: number;
}>;
//# sourceMappingURL=statsStore.d.ts.map