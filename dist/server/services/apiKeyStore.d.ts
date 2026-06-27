import type { ApiKey } from '../types';
export declare const apiKeyStore: {
    create(name: string, key: string): ApiKey;
    findAll(): ApiKey[];
    findById(id: string): ApiKey | undefined;
    delete(id: string): boolean;
    updateLastUsed(id: string): void;
};
//# sourceMappingURL=apiKeyStore.d.ts.map