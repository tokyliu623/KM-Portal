"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KmApiClient = void 0;
class KmApiClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async request(endpoint, options) {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey}`,
                ...options?.headers,
            },
        });
        if (!response.ok) {
            throw new Error(`API request failed: ${response.statusText}`);
        }
        return response.json();
    }
}
exports.KmApiClient = KmApiClient;
//# sourceMappingURL=kmApiClient.js.map