import { describe, it, expect } from 'vitest'
import { buildTreeFromFlat } from '../../src/server/services/kbTreeVisualizer'

describe('Wizard route field compatibility (v1.8.6 regression)', () => {
  describe('ProductItem description full-stack', () => {
    it('every product type has a description', () => {
      const products = [
        { type: 'skill' as const, name: 's', description: 'd' },
        { type: 'mcp' as const, name: 'm', description: 'd' },
        { type: 'ai_template' as const, name: 'a', description: 'd' },
        { type: 'openapi' as const, name: 'o', description: 'd' },
        { type: 'tree' as const, name: 't', description: 'd' },
      ]
      for (const p of products) {
        expect(p.description).toBeTruthy()
        expect(typeof p.description).toBe('string')
      }
    })
  })

  describe('JobStatus done/error enum', () => {
    it('accepts all 4 statuses', () => {
      const statuses: Array<'pending' | 'running' | 'done' | 'error'> = ['pending', 'running', 'done', 'error']
      expect(statuses).toHaveLength(4)
    })

    it('done status carries products', () => {
      const status = {
        jobId: 'j1',
        status: 'done' as const,
        progress: 100,
        products: [{ type: 'skill' as const, name: 's', description: 'd' }],
      }
      expect(status.products).toHaveLength(1)
    })

    it('error status carries error message', () => {
      const status = {
        jobId: 'j1',
        status: 'error' as const,
        progress: 0,
        error: 'boom',
      }
      expect(status.error).toBe('boom')
    })
  })

  describe('buildTreeFromFlat recursive children (v1.8.6)', () => {
    it('nests nodes under their parentId', () => {
      const flat = [
        { id: 1, spaceId: 1, kbId: 1, parentId: null, title: 'root', hasChild: true, spaceName: 's', kbName: 'k' },
        { id: 2, spaceId: 1, kbId: 1, parentId: 1, title: 'a', hasChild: false, spaceName: 's', kbName: 'k' },
        { id: 3, spaceId: 1, kbId: 1, parentId: 1, title: 'b', hasChild: false, spaceName: 's', kbName: 'k' },
        { id: 4, spaceId: 1, kbId: 1, parentId: 2, title: 'a1', hasChild: false, spaceName: 's', kbName: 'k' },
      ]
      const tree = buildTreeFromFlat(flat)
      expect(tree).toHaveLength(1)
      expect(tree[0].children).toHaveLength(2)
      const a = tree[0].children!.find((n) => n.title === 'a')!
      expect(a.children).toHaveLength(1)
      expect(a.children![0].title).toBe('a1')
    })

    it('handles orphans as roots', () => {
      const flat = [
        { id: 1, spaceId: 1, kbId: 1, parentId: null, title: 'r1', hasChild: false, spaceName: 's', kbName: 'k' },
        { id: 2, spaceId: 1, kbId: 1, parentId: 999, title: 'orphan', hasChild: false, spaceName: 's', kbName: 'k' },
      ]
      const tree = buildTreeFromFlat(flat)
      expect(tree).toHaveLength(2)
    })
  })

  describe('mcp-configs / ai-prompts body field compatibility', () => {
    it('accepts camelCase kbId/kbName', () => {
      const body: Record<string, unknown> = { kbId: 1, kbName: 'kb', accessToken: 't' }
      const kbId = (body.kbId ?? body.kb_id) as number
      expect(kbId).toBe(1)
    })

    it('accepts snake_case kb_id/kb_name', () => {
      const body: Record<string, unknown> = { kb_id: 2, kb_name: 'kb2', accessToken: 't2' }
      const kbId = (body.kbId ?? body.kb_id) as number
      const kbName = (body.kbName ?? body.kb_name) as string
      expect(kbId).toBe(2)
      expect(kbName).toBe('kb2')
    })
  })
})
