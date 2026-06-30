import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import { ensureDataFiles } from '../../src/server/services/dataInit'

let tmpDir: string

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'km-data-init-'))
})

afterAll(async () => {
  if (tmpDir) {
    await fs.rm(tmpDir, { recursive: true, force: true })
  }
})

describe('ensureDataFiles v1.9.1 启动兜底', () => {
  it('空目录时初始化 5 个 JSON 文件并返回新建文件名列表', async () => {
    const subdir = path.join(tmpDir, 'fresh')
    const initialized = await ensureDataFiles(subdir)
    expect(initialized.sort()).toEqual([
      'api-keys.json',
      'api-logs.json',
      'operation-stats.json',
      'skills.json',
      'tokens.json',
    ])
    for (const name of ['tokens.json', 'skills.json', 'api-keys.json', 'api-logs.json', 'operation-stats.json']) {
      const content = await fs.readFile(path.join(subdir, name), 'utf-8')
      expect(() => JSON.parse(content)).not.toThrow()
    }
  })

  it('已存在文件不会覆盖（幂等）', async () => {
    const subdir = path.join(tmpDir, 'existing')
    await fs.mkdir(subdir, { recursive: true })
    const customContent = JSON.stringify({ tokens: [{ id: 'keep-me' }] }, null, 2)
    await fs.writeFile(path.join(subdir, 'tokens.json'), customContent, 'utf-8')
    const initialized = await ensureDataFiles(subdir)
    expect(initialized).not.toContain('tokens.json')
    const after = await fs.readFile(path.join(subdir, 'tokens.json'), 'utf-8')
    expect(after).toBe(customContent)
  })

  it('多个缺失文件混合存在时只初始化缺失的', async () => {
    const subdir = path.join(tmpDir, 'partial')
    await fs.mkdir(subdir, { recursive: true })
    await fs.writeFile(path.join(subdir, 'tokens.json'), JSON.stringify({ tokens: [] }), 'utf-8')
    const initialized = await ensureDataFiles(subdir)
    expect(initialized).toContain('skills.json')
    expect(initialized).toContain('api-keys.json')
    expect(initialized).not.toContain('tokens.json')
  })

  it('递归创建嵌套目录（mkdir recursive）', async () => {
    const subdir = path.join(tmpDir, 'a/b/c')
    const initialized = await ensureDataFiles(subdir)
    expect(initialized.length).toBe(5)
    const stat = await fs.stat(subdir)
    expect(stat.isDirectory()).toBe(true)
  })

  it('初始化后 JSON 内容为合法对象（可解析）', async () => {
    const subdir = path.join(tmpDir, 'json-shape')
    await ensureDataFiles(subdir)
    const skills = JSON.parse(await fs.readFile(path.join(subdir, 'skills.json'), 'utf-8'))
    const apikeys = JSON.parse(await fs.readFile(path.join(subdir, 'api-keys.json'), 'utf-8'))
    const logs = JSON.parse(await fs.readFile(path.join(subdir, 'api-logs.json'), 'utf-8'))
    const stats = JSON.parse(await fs.readFile(path.join(subdir, 'operation-stats.json'), 'utf-8'))
    const tokens = JSON.parse(await fs.readFile(path.join(subdir, 'tokens.json'), 'utf-8'))
    expect(Array.isArray(skills.skills)).toBe(true)
    expect(Array.isArray(apikeys.keys)).toBe(true)
    expect(Array.isArray(logs.calls)).toBe(true)
    expect(Array.isArray(stats.stats)).toBe(true)
    expect(Array.isArray(tokens.tokens)).toBe(true)
  })
})
