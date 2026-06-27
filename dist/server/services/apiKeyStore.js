import { v4 as uuidv4 } from 'uuid';
const keys = new Map();
export const apiKeyStore = {
    create(name, key) {
        const apiKey = {
            id: uuidv4(),
            name,
            key,
            createdAt: new Date().toISOString(),
        };
        keys.set(apiKey.id, apiKey);
        return apiKey;
    },
    findAll() {
        return Array.from(keys.values());
    },
    findById(id) {
        return keys.get(id);
    },
    delete(id) {
        return keys.delete(id);
    },
    updateLastUsed(id) {
        const key = keys.get(id);
        if (key) {
            key.lastUsed = new Date().toISOString();
        }
    },
};
//# sourceMappingURL=apiKeyStore.js.map