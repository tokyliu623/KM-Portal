import { v4 as uuidv4 } from 'uuid';
import type { ApiKey } from '../types';

// NOTE: This store uses in-memory storage only.
// Data is lost on server restart. For production, implement file-based or database persistence.

const keys: Map<string, ApiKey> = new Map();

export const apiKeyStore = {
  create(name: string, key: string): ApiKey {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new Error('Invalid name: name is required and must be a non-empty string')
    }
    if (!key || typeof key !== 'string' || key.length < 10) {
      throw new Error('Invalid API key: key must be at least 10 characters')
    }
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