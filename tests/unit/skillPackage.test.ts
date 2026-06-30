import { describe, it, expect } from 'vitest'
import { buildSkillZip } from '../../src/server/services/skillPackage'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

describe('skillPackage.buildSkillZip', () => {
  const baseOpts = {
    skillId: 'test-id-123',
    skillName: 'quality-future',
    description: 'A test skill for quality future',
    triggerWords: ['quality', 'test'],
    kbId: 999,
    kbName: 'TestKB',
    content: '# Quality Future\n\nThis is the skill body.',
  }

  it('returns a non-empty Buffer', async () => {
    const zip = await buildSkillZip(baseOpts)
    expect(Buffer.isBuffer(zip)).toBe(true)
    expect(zip.length).toBeGreaterThan(0)
  })

  it('zip starts with PK magic bytes', async () => {
    const zip = await buildSkillZip(baseOpts)
    expect(zip[0]).toBe(0x50)
    expect(zip[1]).toBe(0x4b)
  })

  it('produces deterministic output for same inputs', async () => {
    const a = await buildSkillZip(baseOpts)
    const b = await buildSkillZip(baseOpts)
    expect(a.equals(b)).toBe(true)
  })

  it('handles empty trigger words', async () => {
    const zip = await buildSkillZip({ ...baseOpts, triggerWords: [] })
    expect(zip.length).toBeGreaterThan(0)
  })

  it('handles empty description', async () => {
    const zip = await buildSkillZip({ ...baseOpts, description: '' })
    expect(zip.length).toBeGreaterThan(0)
  })

  it('handles Chinese content', async () => {
    const zip = await buildSkillZip({ ...baseOpts, skillName: '中文Skill' })
    expect(zip.length).toBeGreaterThan(0)
  })

  it('writes a valid zip file to disk', async () => {
    const zip = await buildSkillZip(baseOpts)
    const tmpFile = path.join(os.tmpdir(), `km-skill-${Date.now()}.zip`)
    await fs.writeFile(tmpFile, zip)
    const onDisk = await fs.readFile(tmpFile)
    expect(onDisk.length).toBe(zip.length)
    await fs.unlink(tmpFile)
  })
})
