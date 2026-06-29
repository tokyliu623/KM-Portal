export class KmApiClient {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }
    async request(endpoint, options) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                    ...options?.headers,
                },
            });
            if (!response.ok) {
                clearTimeout(timeoutId);
                let errorMessage = 'Unknown error';
                if (response.status === 401) {
                    errorMessage = 'Unauthorized: Invalid or expired API key';
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
                else {
                    errorMessage = `KM API error: ${response.status}`;
                }
                throw Object.assign(new Error(errorMessage), { statusCode: response.status });
            }
            clearTimeout(timeoutId);
            return response.json();
        }
        catch (error) {
            clearTimeout(timeoutId);
            if (error instanceof Error && error.name === 'AbortError') {
                throw Object.assign(new Error('Request timeout: KM API did not respond within 30 seconds'), { statusCode: 408 });
            }
            throw error;
        }
    }
}
