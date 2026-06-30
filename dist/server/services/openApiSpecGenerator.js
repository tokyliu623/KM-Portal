/**
 * v1.8.4 OpenAPI 3.0.3 规范生成器
 *
 * 职责:
 * 1. 根据 KB 信息生成 OpenAPI 3.0.3 JSON 规范
 * 2. 生成 Swagger UI HTML（CDN 方式，不引入 npm 依赖）
 * 3. 注入来自 src/shared/types/kb.ts 的 Schema
 * 4. 支持 bearerAuth 安全方案
 */
function htmlEscape(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
export function getServers() {
    return [
        {
            url: 'https://wiki.vivo.xyz',
            description: 'Production',
        },
    ];
}
export function getComponents() {
    return {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'KM API accessToken (bearer JWT)',
            },
        },
        schemas: {
            KBInfo: {
                type: 'object',
                description: '知识库基础信息（对齐 src/shared/types/kb.ts KBInfo）',
                properties: {
                    id: { type: 'integer', description: '知识库 ID' },
                    name: { type: 'string', description: '知识库名称' },
                    description: { type: 'string', description: '知识库描述' },
                    document_count: { type: 'integer', description: '文档总数' },
                    created_at: { type: 'string', format: 'date-time', description: '创建时间' },
                },
                required: ['id', 'name', 'document_count', 'created_at'],
            },
            KBTreeNode: {
                type: 'object',
                description: '知识库目录树节点（对齐 src/shared/types/kb.ts KBTreeNode）',
                properties: {
                    id: { type: 'integer', description: '节点 ID' },
                    name: { type: 'string', description: '节点名称' },
                    parent_id: { type: 'integer', nullable: true, description: '父节点 ID' },
                    children: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/KBTreeNode' },
                        description: '子节点',
                    },
                    document_count: { type: 'integer', description: '节点下文档数' },
                },
                required: ['id', 'name'],
            },
            KBDocument: {
                type: 'object',
                description: '知识库文档（对齐 src/shared/types/kb.ts KBDocument）',
                properties: {
                    id: { type: 'integer', description: '文档 ID' },
                    title: { type: 'string', description: '文档标题' },
                    content: { type: 'string', description: '文档内容' },
                    parent_id: { type: 'integer', nullable: true, description: '父节点 ID' },
                    updated_at: { type: 'string', format: 'date-time', description: '更新时间' },
                },
                required: ['id', 'title', 'content', 'updated_at'],
            },
        },
    };
}
function kbIdParam() {
    return {
        name: 'kbId',
        in: 'path',
        required: true,
        description: '知识库 ID',
        schema: { type: 'integer' },
    };
}
export function getPaths(kbId) {
    void kbId;
    return {
        '/api/knowledge/v1/openapi/kb/{kbId}/info': {
            get: {
                operationId: 'getKBInfo',
                summary: '获取知识库信息',
                tags: ['Knowledge Base'],
                parameters: [kbIdParam()],
                responses: {
                    '200': {
                        description: '成功',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/KBInfo' },
                            },
                        },
                    },
                    '401': {
                        description: '未授权：accessToken 无效或已过期',
                    },
                    '404': {
                        description: '知识库不存在',
                    },
                },
            },
        },
        '/api/knowledge/v1/openapi/kb/{kbId}/content-tree': {
            get: {
                operationId: 'getKBContentTree',
                summary: '获取知识库目录树',
                tags: ['Knowledge Base'],
                parameters: [kbIdParam()],
                responses: {
                    '200': {
                        description: '成功',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        items: {
                                            type: 'array',
                                            items: { $ref: '#/components/schemas/KBTreeNode' },
                                        },
                                    },
                                },
                            },
                        },
                    },
                    '401': { description: '未授权' },
                },
            },
        },
        '/api/knowledge/v1/openapi/kb/{kbId}/document': {
            get: {
                operationId: 'getKBDocument',
                summary: '获取文档内容',
                tags: ['Knowledge Base'],
                parameters: [
                    kbIdParam(),
                    {
                        name: 'docId',
                        in: 'query',
                        required: true,
                        description: '文档 ID',
                        schema: { type: 'integer' },
                    },
                ],
                responses: {
                    '200': {
                        description: '成功',
                        content: {
                            'application/json': {
                                schema: { $ref: '#/components/schemas/KBDocument' },
                            },
                        },
                    },
                    '404': { description: '文档不存在' },
                },
            },
        },
        '/api/knowledge/v1/openapi/kb/{kbId}/contents/create': {
            post: {
                operationId: 'createContent',
                summary: '创建文档',
                tags: ['Knowledge Base'],
                parameters: [kbIdParam()],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['title', 'content'],
                                properties: {
                                    title: { type: 'string', description: '文档标题' },
                                    content: { type: 'string', description: '文档内容' },
                                    contentType: { type: 'string', default: 'markdown', description: '内容类型' },
                                    parentId: { type: 'integer', description: '父节点 ID（可选）' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: '成功',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        contentId: { type: 'integer' },
                                        link: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '400': { description: '请求参数错误' },
                    '403': { description: '无写权限' },
                },
            },
        },
        '/api/knowledge/v1/openapi/kb/{kbId}/contents/update': {
            post: {
                operationId: 'updateContent',
                summary: '更新文档',
                tags: ['Knowledge Base'],
                parameters: [kbIdParam()],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['contentId', 'content'],
                                properties: {
                                    contentId: { type: 'integer', description: '要更新的文档 ID' },
                                    title: { type: 'string', description: '新标题（可选）' },
                                    content: { type: 'string', description: '新内容' },
                                    contentType: { type: 'string', default: 'markdown' },
                                },
                            },
                        },
                    },
                },
                responses: {
                    '200': {
                        description: '成功',
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        contentId: { type: 'integer' },
                                        link: { type: 'string' },
                                    },
                                },
                            },
                        },
                    },
                    '404': { description: '文档不存在' },
                    '403': { description: '无写权限' },
                },
            },
        },
    };
}
export function generateOpenApiSpec(input) {
    const servers = [
        ...getServers(),
        {
            url: input.baseUrl,
            description: 'Custom',
        },
    ];
    return {
        openapi: '3.0.3',
        info: {
            title: `${input.kbName} - Knowledge Base API`,
            description: `OpenAPI specification for knowledge base "${input.kbName}" (ID: ${input.kbId}). accessToken: ${input.accessToken ? 'configured' : 'MISSING'}`,
            version: '1.0.0',
        },
        servers,
        paths: getPaths(input.kbId),
        components: getComponents(),
        security: [{ bearerAuth: [] }],
    };
}
export function generateSwaggerHtml(specUrl, title) {
    const safeSpecUrl = htmlEscape(specUrl);
    const safeTitle = htmlEscape(title);
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
  <title>${safeTitle}</title>
  <style>
    body { margin: 0; padding: 0; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "${safeSpecUrl}",
        dom_id: "#swagger-ui",
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis
        ]
      });
    };
  </script>
</body>
</html>`;
}
