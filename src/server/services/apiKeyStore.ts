import { v4 as uuidv4 } from 'uuid';
import type { ApiKey } from '../types';

const keys: Map<string, ApiKey> = new Map();

export const apiKeyStore = {
  create(name: string, key: string): ApiKey {
    const apiKey: ApiKey = {
      id: uuidv4(),
      name,
      key,
      createdAt: new Date().toISOString(),
    };
    keys.set(apiKey.id, apiKey);
    return apiKey;
  },

  findAll(): ApiKey[] {
    return Array.from(keys.values());
  },

  findById(id: string): ApiKey | undefined {
    return keys.get(id);
  },

  delete(id: string): boolean {
    return keys.delete(id);
  },

  updateLastUsed(id: string): void {
    const key = keys.get(id);
    if (key) {
      key.lastUsed = new Date().toISOString();
    }
  },
};