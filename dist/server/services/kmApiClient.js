export class KMApiError extends Error {
    constructor(status, message) {
        super(message);
        this.name = 'KMApiError';
        this.status = status;
    }
}
export class KMApiClient {
    constructor(config) {
        this.baseUrl = config.baseUrl || process.env.WIKI_BASE_URL || 'https://wiki.vivo.xyz';
        this.apiKey = config.apiKey || process.env.KM_API_KEY || '';
    }
    async request(endpoint, options, accessToken) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
            const headers = {
                'Content-Type': 'application/json',
                ...options?.headers,
            };
            if (accessToken) {
                headers['accessToken'] = accessToken;
            }
            if (this.apiKey) {
                headers['Authorization'] = `Bearer ${this.apiKey}`;
            }
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                let errorMessage = `KM API error: ${response.status}`;
                if (response.status === 401) {
                    errorMessage = 'Unauthorized: Invalid or expired token';
                }
                else if (response.status === 403) {
                    errorMessage = 'Forbidden: Insufficient permissions';
                }
                else if (response.status === 404) {
                    errorMessage = 'Resource not found';
                }
                else if (response.status >= 500) {
                    errorMessage = 'KM API server error';
                }
                throw new KMApiError(response.status, errorMessage);
            }
            return response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw new KMApiError(408, 'Request timeout: KM API did not respond within 30 seconds');
            }
            throw error;
        }
    }
    async getKBInfo(kbId, accessToken) {
        return this.request(`/api/knowledge/v1/openapi/kb/${kbId}/info`, { method: 'GET' }, accessToken);
    }
    async getKBTree(kbId, accessToken) {
        return this.request(`/api/knowledge/v1/openapi/kb/${kbId}/tree`, { method: 'GET' }, accessToken);
    }
    async getKBDocument(kbId, docId, accessToken) {
        return this.request(`/api/knowledge/v1/openapi/kb/${kbId}/document/${docId}`, { method: 'GET' }, accessToken);
    }
    async createDocument(kbId, data, accessToken) {
        return this.request(`/api/knowledge/v1/openapi/kb/${kbId}/contents/create`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }
    async updateDocument(kbId, docId, data, accessToken) {
        return this.request(`/api/knowledge/v1/openapi/kb/${kbId}/contents/update`, {
            method: 'POST',
            body: JSON.stringify(data),
        }, accessToken);
    }
}
