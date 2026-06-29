declare const router: import("express-serve-static-core").Router;
export interface GeneratedSkill {
    id: string;
    name: string;
    description: string;
    kbId: number;
    kbName: string;
    permission: 'read' | 'write';
    content: string;
    createdAt: string;
    updatedAt: string;
}
export default router;
//# sourceMappingURL=skill.d.ts.map