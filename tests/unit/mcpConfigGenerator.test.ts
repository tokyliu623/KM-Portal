import { describe, it, expect } from 'vitest'
import {
  generateClaudeDesktopConfig,
  generateCursorConfig,
  generateContinueConfig,
  generateClineConfig,
  generateAllMcpConfigs,
  type McpConfigInput,
} from '../../src/server/services/mcpConfigGenerator'

const baseInput: McpConfigInput = {
  kbId: 34754,
  kbName: '研发知识库',
  accessToken: 'u-test-token-abc123',
  serverName: 'vivo-knowledge',
}

describe('mcpConfigGenerator v1.8.1 — 4 客户端 MCP JSON 生成', () => {
  describe('generateClaudeDesktopConfig', () => {
    it('should return filename, mimeType and JSON content', () => {
      const result = generateClaudeDesktopConfig(baseInput)
      expect(result.filename).toBe('claude_desktop_config.json')
      expect(result.mimeType).toBe('application/json')
      expect(() => JSON.parse(result.content)).not.toThrow()
    })

    it('should produce mcpServers block with streamable-http type and url + headers', () => {
      const result = generateClaudeDesktopConfig(baseInput)
      const json = JSON.parse(result.content)
      expect(json.mcpServers).toBeDefined()
      expect(json.mcpServers['vivo-knowledge']).toBeDefined()
      const server = json.mcpServers['vivo-knowledge']
      expect(server.type).toBe('streamable-http')
      expect(server.url).toBe('https://wiki.vivo.xyz/api/knowledge/mcp/rpc')
      expect(server.headers.Authorization).toBe('Bearer u-test-token-abc123')
      expect(server.headers['MCP-Protocol-Version']).toBe('2025-03-26')
    })

    it('should not leak {{accessToken}} placeholder when token provided', () => {
      const result = generateClaudeDesktopConfig(baseInput)
      expect(result.content).not.toContain('{{accessToken}}')
      expect(result.content).not.toContain('{{')
    })

    it('should default serverName to "vivo-knowledge" when omitted', () => {
      const input = { ...baseInput }
      delete (input as Partial<McpConfigInput>).serverName
      const result = generateClaudeDesktopConfig(input)
      const json = JSON.parse(result.content)
      expect(json.mcpServers['vivo-knowledge']).toBeDefined()
    })
  })

  describe('generateCursorConfig', () => {
    it('should produce .cursor/mcp.json filename and same streamable-http structure', () => {
      const result = generateCursorConfig(baseInput)
      expect(result.filename).toBe('cursor_mcp.json')
      expect(result.mimeType).toBe('application/json')
      const json = JSON.parse(result.content)
      expect(json.mcpServers['vivo-knowledge'].type).toBe('streamable-http')
      expect(json.mcpServers['vivo-knowledge'].url).toBe(
        'https://wiki.vivo.xyz/api/knowledge/mcp/rpc'
      )
      expect(json.mcpServers['vivo-knowledge'].headers.Authorization).toBe(
        'Bearer u-test-token-abc123'
      )
    })

    it('Cursor config should include kbId comment in description field', () => {
      const result = generateCursorConfig(baseInput)
      const json = JSON.parse(result.content)
      // Cursor 兼容 JSON 格式；kbId 通过注释或额外字段表达
      expect(json.mcpServers['vivo-knowledge'].description).toContain('34754')
    })
  })

  describe('generateContinueConfig', () => {
    it('should produce continue config JSON with mcpServers array', () => {
      const result = generateContinueConfig(baseInput)
      expect(result.filename).toBe('continue_config.json')
      const json = JSON.parse(result.content)
      // Continue 同时支持 JSON 数组格式（yaml 派生）
      expect(json.mcpServers).toBeDefined()
      const servers = json.mcpServers
      expect(Array.isArray(servers) || typeof servers === 'object').toBe(true)
    })

    it('should resolve server entry for vivo-knowledge with streamable-http transport', () => {
      const result = generateContinueConfig(baseInput)
      const json = JSON.parse(result.content)
      const servers = json.mcpServers
      const entries = Array.isArray(servers) ? servers : Object.values(servers)
      const vivo = entries.find((s: { name?: string }) => s.name === 'vivo-knowledge') as
        | { type?: string; url?: string; headers?: Record<string, string> }
        | undefined
      expect(vivo).toBeDefined()
      expect(vivo?.type).toBe('streamable-http')
      expect(vivo?.url).toBe('https://wiki.vivo.xyz/api/knowledge/mcp/rpc')
      expect(vivo?.headers?.Authorization).toBe('Bearer u-test-token-abc123')
    })
  })

  describe('generateClineConfig', () => {
    it('should produce cline_mcp_settings.json with disabled/autoApprove fields', () => {
      const result = generateClineConfig(baseInput)
      expect(result.filename).toBe('cline_mcp_settings.json')
      const json = JSON.parse(result.content)
      const server = json.mcpServers['vivo-knowledge']
      expect(server).toBeDefined()
      expect(server.type).toBe('streamableHttp')
      expect(server.url).toBe('https://wiki.vivo.xyz/api/knowledge/mcp/rpc')
      expect(server.headers.Authorization).toBe('Bearer u-test-token-abc123')
      expect(server.disabled).toBe(false)
      expect(Array.isArray(server.autoApprove)).toBe(true)
    })

    it('Cline autoApprove should be empty array by default (require user approval)', () => {
      const result = generateClineConfig(baseInput)
      const json = JSON.parse(result.content)
      expect(json.mcpServers['vivo-knowledge'].autoApprove).toEqual([])
    })
  })

  describe('generateAllMcpConfigs', () => {
    it('should return 4 configs keyed by client name', () => {
      const all = generateAllMcpConfigs(baseInput)
      expect(Object.keys(all).sort()).toEqual(
        ['claudeDesktop', 'cline', 'continue', 'cursor'].sort()
      )
    })

    it('all 4 configs should be valid JSON without unresolved placeholders', () => {
      const all = generateAllMcpConfigs(baseInput)
      for (const [client, cfg] of Object.entries(all)) {
        expect(() => JSON.parse(cfg.content), `${client} parse failed`).not.toThrow()
        expect(cfg.content, `${client} leaked placeholder`).not.toContain('{{')
        expect(cfg.content, `${client} leaked placeholder`).not.toContain('}}')
      }
    })

    it('all 4 configs should embed the same accessToken', () => {
      const all = generateAllMcpConfigs(baseInput)
      for (const [client, cfg] of Object.entries(all)) {
        const json = JSON.parse(cfg.content)
        const flat = JSON.stringify(json)
        expect(flat, `${client} missing token`).toContain('u-test-token-abc123')
      }
    })

    it('all 4 configs should reference the same MCP endpoint URL', () => {
      const all = generateAllMcpConfigs(baseInput)
      const expectedUrl = 'https://wiki.vivo.xyz/api/knowledge/mcp/rpc'
      for (const [client, cfg] of Object.entries(all)) {
        const json = JSON.parse(cfg.content)
        const flat = JSON.stringify(json)
        expect(flat, `${client} missing URL`).toContain(expectedUrl)
      }
    })

    it('each config has filename and mimeType', () => {
      const all = generateAllMcpConfigs(baseInput)
      for (const cfg of Object.values(all)) {
        expect(cfg.filename).toMatch(/\.json$/)
        expect(cfg.mimeType).toBe('application/json')
      }
    })
  })

  describe('token safety', () => {
    it('should embed real token, never the placeholder when token provided', () => {
      const result = generateClaudeDesktopConfig({
        ...baseInput,
        accessToken: 'real-secret-9999',
      })
      expect(result.content).toContain('real-secret-9999')
      expect(result.content).not.toContain('{{accessToken}}')
    })

    it('should keep {{accessToken}} placeholder when token is empty string', () => {
      const result = generateClaudeDesktopConfig({
        ...baseInput,
        accessToken: '',
      })
      expect(result.content).toContain('{{accessToken}}')
    })
  })

  describe('backward compat with wizard.ts hardcoded format', () => {
    it('Claude Desktop config should keep transport field (matches old wizard.ts:295)', () => {
      const result = generateClaudeDesktopConfig(baseInput)
      const json = JSON.parse(result.content)
      expect(json.mcpServers['vivo-knowledge'].transport).toBe('streamable-http')
    })

    it('URL must equal https://wiki.vivo.xyz/api/knowledge/mcp/rpc (matches wizard.ts:290)', () => {
      const result = generateClaudeDesktopConfig(baseInput)
      const json = JSON.parse(result.content)
      expect(json.mcpServers['vivo-knowledge'].url).toBe(
        'https://wiki.vivo.xyz/api/knowledge/mcp/rpc'
      )
    })
  })
})
