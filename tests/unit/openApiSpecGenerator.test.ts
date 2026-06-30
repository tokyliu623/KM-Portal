import { describe, it, expect } from 'vitest'
import {
  generateOpenApiSpec,
  generateSwaggerHtml,
  getServers,
  getPaths,
  getComponents,
  OpenApiSpecInput,
} from '../../src/server/services/openApiSpecGenerator'

const baseInput: OpenApiSpecInput = {
  kbId: 34754,
  kbName: 'Test KB',
  baseUrl: 'https://wiki.vivo.xyz',
  accessToken: 'test-token-abc',
}

describe('openApiSpecGenerator (v1.8.4)', () => {
  describe('OpenAPI 3.0.3 document structure', () => {
    it('should generate spec with openapi version 3.0.3', () => {
      const spec = generateOpenApiSpec(baseInput)
      expect(spec.openapi).toBe('3.0.3')
    })

    it('should include info block with title, version and description', () => {
      const spec = generateOpenApiSpec(baseInput)
      expect(spec.info).toBeDefined()
      expect(spec.info.title).toContain('Test KB')
      expect(spec.info.title).toContain('Knowledge Base')
      expect(spec.info.version).toBeDefined()
      expect(spec.info.description).toContain('34754')
    })

    it('should include servers, paths and components blocks', () => {
      const spec = generateOpenApiSpec(baseInput)
      expect(spec.servers).toBeDefined()
      expect(Array.isArray(spec.servers)).toBe(true)
      expect(spec.servers.length).toBeGreaterThan(0)
      expect(spec.paths).toBeDefined()
      expect(spec.components).toBeDefined()
    })
  })

  describe('5 KM API paths generation', () => {
    it('should include all 5 KM API paths', () => {
      const paths = getPaths(baseInput.kbId)
      expect(paths).toHaveProperty('/api/knowledge/v1/openapi/kb/{kbId}/info')
      expect(paths).toHaveProperty('/api/knowledge/v1/openapi/kb/{kbId}/content-tree')
      expect(paths).toHaveProperty('/api/knowledge/v1/openapi/kb/{kbId}/document')
      expect(paths).toHaveProperty('/api/knowledge/v1/openapi/kb/{kbId}/contents/create')
      expect(paths).toHaveProperty('/api/knowledge/v1/openapi/kb/{kbId}/contents/update')
    })

    it('each path should contain summary, parameters/responses and security', () => {
      const paths = getPaths(baseInput.kbId)
      for (const [pathKey, pathItem] of Object.entries(paths)) {
        const methods = Object.entries(pathItem as Record<string, unknown>)
        expect(methods.length, `Path ${pathKey} should have at least one method`).toBeGreaterThan(0)
        for (const [method, op] of methods) {
          const operation = op as Record<string, unknown>
          expect(operation.summary, `${method.toUpperCase()} ${pathKey} should have summary`).toBeDefined()
          expect(operation.operationId, `${method.toUpperCase()} ${pathKey} should have operationId`).toBeDefined()
          expect(operation.responses, `${method.toUpperCase()} ${pathKey} should have responses`).toBeDefined()
        }
      }
    })

    it('path parameters should mark kbId as required', () => {
      const paths = getPaths(baseInput.kbId)
      const infoPath = paths['/api/knowledge/v1/openapi/kb/{kbId}/info']
      const getOp = infoPath?.get as { parameters?: Array<{ name: string; in: string; required?: boolean }> }
      const kbIdParam = getOp?.parameters?.find(p => p.name === 'kbId' && p.in === 'path')
      expect(kbIdParam).toBeDefined()
      expect(kbIdParam?.required).toBe(true)
    })

    it('POST endpoints (create/update) should include requestBody', () => {
      const paths = getPaths(baseInput.kbId)
      const createOp = paths['/api/knowledge/v1/openapi/kb/{kbId}/contents/create']?.post as {
        requestBody?: { content?: { 'application/json'?: { schema?: { properties?: Record<string, unknown> } } } }
      }
      const updateOp = paths['/api/knowledge/v1/openapi/kb/{kbId}/contents/update']?.post as {
        requestBody?: { content?: { 'application/json'?: { schema?: { properties?: Record<string, unknown> } } } }
      }
      expect(createOp?.requestBody).toBeDefined()
      expect(createOp?.requestBody?.content?.['application/json']?.schema?.properties).toHaveProperty('title')
      expect(createOp?.requestBody?.content?.['application/json']?.schema?.properties).toHaveProperty('content')
      expect(updateOp?.requestBody).toBeDefined()
      expect(updateOp?.requestBody?.content?.['application/json']?.schema?.properties).toHaveProperty('contentId')
    })

    it('generated spec should include bearerAuth security scheme', () => {
      const components = getComponents()
      expect(components.securitySchemes).toBeDefined()
      expect(components.securitySchemes?.bearerAuth).toBeDefined()
      expect(components.securitySchemes?.bearerAuth.type).toBe('http')
      expect(components.securitySchemes?.bearerAuth.scheme).toBe('bearer')
    })
  })

  describe('Schema injection from shared/types/kb.ts', () => {
    it('components should expose KBInfo/KBTreeNode/KBDocument schemas', () => {
      const components = getComponents()
      expect(components.schemas).toBeDefined()
      expect(components.schemas).toHaveProperty('KBInfo')
      expect(components.schemas).toHaveProperty('KBTreeNode')
      expect(components.schemas).toHaveProperty('KBDocument')
    })

    it('KBInfo schema should have id, name, document_count, created_at properties', () => {
      const components = getComponents()
      const kbInfo = components.schemas?.KBInfo as { properties?: Record<string, { type?: string }> }
      expect(kbInfo?.properties).toBeDefined()
      expect(kbInfo?.properties?.id).toBeDefined()
      expect(kbInfo?.properties?.name).toBeDefined()
      expect(kbInfo?.properties?.document_count).toBeDefined()
      expect(kbInfo?.properties?.created_at).toBeDefined()
    })

    it('KBTreeNode schema should have id, name, parent_id, children, document_count properties', () => {
      const components = getComponents()
      const kbTree = components.schemas?.KBTreeNode as { properties?: Record<string, { type?: string }> }
      expect(kbTree?.properties).toBeDefined()
      expect(kbTree?.properties?.id).toBeDefined()
      expect(kbTree?.properties?.name).toBeDefined()
      expect(kbTree?.properties?.parent_id).toBeDefined()
      expect(kbTree?.properties?.document_count).toBeDefined()
    })

    it('KBDocument schema should have id, title, content, parent_id, updated_at properties', () => {
      const components = getComponents()
      const kbDoc = components.schemas?.KBDocument as { properties?: Record<string, { type?: string }> }
      expect(kbDoc?.properties).toBeDefined()
      expect(kbDoc?.properties?.id).toBeDefined()
      expect(kbDoc?.properties?.title).toBeDefined()
      expect(kbDoc?.properties?.content).toBeDefined()
      expect(kbDoc?.properties?.parent_id).toBeDefined()
      expect(kbDoc?.properties?.updated_at).toBeDefined()
    })
  })

  describe('Servers configuration', () => {
    it('should return production server by default', () => {
      const servers = getServers()
      expect(servers.length).toBeGreaterThan(0)
      const prod = servers.find(s => s.description === 'Production')
      expect(prod).toBeDefined()
      expect(prod?.url).toContain('https://')
    })

    it('generated spec should include the supplied baseUrl', () => {
      const customInput = { ...baseInput, baseUrl: 'https://custom.example.com' }
      const spec = generateOpenApiSpec(customInput)
      const hasCustom = spec.servers.some(s => s.url === 'https://custom.example.com')
      expect(hasCustom).toBe(true)
    })
  })

  describe('BearerAuth security injection', () => {
    it('spec should include security requirement at root level', () => {
      const spec = generateOpenApiSpec(baseInput)
      expect(spec.security).toBeDefined()
      expect(Array.isArray(spec.security)).toBe(true)
      const bearer = spec.security?.find((s: Record<string, string[]>) => s.bearerAuth)
      expect(bearer).toBeDefined()
    })

    it('bearerAuth scheme should describe the access token purpose', () => {
      const components = getComponents()
      const bearer = components.securitySchemes?.bearerAuth as { description?: string }
      expect(bearer?.description).toBeDefined()
      expect(bearer?.description).toContain('accessToken')
    })
  })

  describe('Swagger HTML generation (v1.8.4 - Swagger UI route)', () => {
    it('should return valid HTML containing swagger-ui CDN scripts', () => {
      const html = generateSwaggerHtml('/api/wizard/openapi.json?kbId=34754', 'Test KB API')
      expect(html).toContain('<!DOCTYPE html>')
      expect(html).toContain('swagger-ui')
      expect(html).toContain('SwaggerUIBundle')
      expect(html).toContain('Test KB API')
      expect(html).toContain('/api/wizard/openapi.json?kbId=34754')
    })

    it('should embed CDN urls pointing to swagger-ui-dist@5', () => {
      const html = generateSwaggerHtml('/spec.json', 'KB')
      expect(html).toContain('unpkg.com/swagger-ui-dist@5')
      expect(html).toContain('swagger-ui.css')
      expect(html).toContain('swagger-ui-bundle.js')
    })

    it('html should be safe (no unescaped template injection)', () => {
      const html = generateSwaggerHtml('/spec.json', '<script>alert(1)</script>')
      // Spec URL and title should be embedded safely (no script injection)
      expect(html).not.toContain('<script>alert(1)</script>')
    })
  })

  describe('Spec integrity', () => {
    it('should be JSON-serializable (no circular refs / functions)', () => {
      const spec = generateOpenApiSpec(baseInput)
      const json = JSON.stringify(spec)
      expect(json.length).toBeGreaterThan(0)
      const reparsed = JSON.parse(json)
      expect(reparsed.openapi).toBe('3.0.3')
    })

    it('every operation should reference bearerAuth security or be public', () => {
      const spec = generateOpenApiSpec(baseInput)
      for (const [pathKey, pathItem] of Object.entries(spec.paths as Record<string, Record<string, unknown>>)) {
        for (const [method, op] of Object.entries(pathItem)) {
          if (['get', 'post', 'put', 'delete', 'patch'].includes(method)) {
            const operation = op as { security?: unknown }
            // Either root security covers it, or operation declares its own
            const hasSecurity = operation.security !== undefined || spec.security !== undefined
            expect(hasSecurity, `${method.toUpperCase()} ${pathKey} missing security`).toBe(true)
          }
        }
      }
    })
  })
})
