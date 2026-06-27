export declare class KmApiClient {
    private baseUrl;
    private apiKey;
    constructor(baseUrl: string, apiKey: string);
    request<T>(endpoint: string, options?: RequestInit): Promise<T>;
}
//# sourceMappingURL=kmApiClient.d.ts.map