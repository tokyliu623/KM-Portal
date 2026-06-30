// v1.8.1 MCP 4 客户端配置生成器
// 从 wizard.ts:287-297 硬编码 MCP JSON 抽出为独立 service
// 支持 4 客户端：Claude Desktop / Cursor / Continue / Cline
const MCP_URL = 'https://wiki.vivo.xyz/api/knowledge/mcp/rpc';
const MCP_PROTOCOL_VERSION = '2025-03-26';
const ACCESS_TOKEN_PLACEHOLDER = '{{accessToken}}';
function resolveServerName(input) {
    return input.serverName || 'vivo-knowledge';
}
function resolveAuthHeader(input) {
    if (!input.accessToken)
        return `Bearer ${ACCESS_TOKEN_PLACEHOLDER}`;
    return `Bearer ${input.accessToken}`;
}
function jsonStringify(obj) {
    return JSON.stringify(obj, null, 2);
}
// 1. Claude Desktop / Claude Code
// 参考：https://docs.claude.com/en/docs/claude-code/mcp
// 文件名：claude_desktop_config.json
// 顶层 mcpServers 字典，每个 server 包含 type/command 或 url+headers
export function generateClaudeDesktopConfig(input) {
    const serverName = resolveServerName(input);
    const config = {
        mcpServers: {
            [serverName]: {
                type: 'streamable-http',
                url: MCP_URL,
                headers: {
                    Authorization: resolveAuthHeader(input),
                    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
                },
                transport: 'streamable-http',
            },
        },
    };
    return {
        filename: 'claude_desktop_config.json',
        mimeType: 'application/json',
        content: jsonStringify(config),
    };
}
// 2. Cursor
// 文件名：cursor_mcp.json (放入 .cursor/mcp.json)
// Cursor 兼容 Claude JSON 格式；额外在 server 块加 description 标注 KB 信息
export function generateCursorConfig(input) {
    const serverName = resolveServerName(input);
    const config = {
        mcpServers: {
            [serverName]: {
                type: 'streamable-http',
                url: MCP_URL,
                description: `KM Studio — 知识库「${input.kbName}」(KB ID: ${input.kbId}) MCP 接入`,
                headers: {
                    Authorization: resolveAuthHeader(input),
                    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
                },
                transport: 'streamable-http',
            },
        },
    };
    return {
        filename: 'cursor_mcp.json',
        mimeType: 'application/json',
        content: jsonStringify(config),
    };
}
// 3. Continue
// 文件名：continue_config.json
// Continue 同时支持 JSON 数组格式（yaml 派生）
// mcpServers 为数组，每个元素 {name, type, url, headers}
export function generateContinueConfig(input) {
    const serverName = resolveServerName(input);
    const config = {
        mcpServers: [
            {
                name: serverName,
                type: 'streamable-http',
                url: MCP_URL,
                description: `KM Studio — 知识库「${input.kbName}」(KB ID: ${input.kbId})`,
                headers: {
                    Authorization: resolveAuthHeader(input),
                    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
                },
            },
        ],
    };
    return {
        filename: 'continue_config.json',
        mimeType: 'application/json',
        content: jsonStringify(config),
    };
}
// 4. Cline
// 文件名：cline_mcp_settings.json (放入 .vscode/cline_mcp_settings.json)
// mcpServers.{name} 含 type/url/headers/disabled/autoApprove
// 注意：Cline 的 streamable-http 字段名是 streamableHttp（驼峰）
export function generateClineConfig(input) {
    const serverName = resolveServerName(input);
    const config = {
        mcpServers: {
            [serverName]: {
                type: 'streamableHttp',
                url: MCP_URL,
                headers: {
                    Authorization: resolveAuthHeader(input),
                    'MCP-Protocol-Version': MCP_PROTOCOL_VERSION,
                },
                disabled: false,
                autoApprove: [],
            },
        },
    };
    return {
        filename: 'cline_mcp_settings.json',
        mimeType: 'application/json',
        content: jsonStringify(config),
    };
}
export function generateAllMcpConfigs(input) {
    return {
        claudeDesktop: generateClaudeDesktopConfig(input),
        cursor: generateCursorConfig(input),
        continue: generateContinueConfig(input),
        cline: generateClineConfig(input),
    };
}
