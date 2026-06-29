declare const fs: any;
declare const path: any;
declare const uuidv4: any;
declare const DATA_DIR: any;
declare const TOKENS_FILE: any;
declare const tokenStore: {
    create(data: any): Promise<any>;
    findAll(): Promise<any>;
    findByKbId(kbId: any): Promise<any>;
    findById(id: any): Promise<any>;
    update(id: any, data: any): Promise<any>;
    revoke(id: any): Promise<boolean>;
    delete(id: any): Promise<boolean>;
};
//# sourceMappingURL=tokenStore.d.ts.map