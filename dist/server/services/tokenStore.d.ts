export interface KMToken {
    id: string;
    kb_id: number;
    kb_name: string;
    token: string;
    owner: string;
    permission: 'read' | 'write';
    status: 'active' | 'revoked';
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
}
export declare const tokenStore: {
    create(data: Omit<KMToken, "id" | "createdAt" | "updatedAt">): Promise<KMToken>;
    findAll(): Promise<KMToken[]>;
    findByKbId(kbId: number | string): Promise<KMToken | undefined>;
    findById(id: string): Promise<KMToken | undefined>;
    update(id: string, data: Partial<KMToken>): Promise<KMToken | undefined>;
    revoke(id: string): Promise<boolean>;
    delete(id: string): Promise<boolean>;
};
//# sourceMappingURL=tokenStore.d.ts.map