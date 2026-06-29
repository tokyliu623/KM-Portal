declare const uuidv4: any;
declare const keys: Map<any, any>;
declare const apiKeyStore: {
    create(name: any, key: any): {
        id: any;
        name: any;
        key: any;
        createdAt: string;
    };
    findAll(): any[];
    findById(id: any): any;
    delete(id: any): boolean;
    updateLastUsed(id: any): void;
};
//# sourceMappingURL=apiKeyStore.d.ts.map