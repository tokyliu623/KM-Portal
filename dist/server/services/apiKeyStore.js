"use strict";
const { v4: uuidv4 } = require('uuid');
const keys = new Map();
const apiKeyStore = {
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
module.exports = { apiKeyStore };
//# sourceMappingURL=apiKeyStore.js.map