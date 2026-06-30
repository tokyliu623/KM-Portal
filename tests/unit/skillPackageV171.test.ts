import { describe, it, expect } from 'vitest'
import { buildSkillZip } from '../../src/server/services/skillPackage'
import AdmZip from 'adm-zip'

describe('skillPackage v1.7.1 regression', () => {
  const baseOpts = {
    skillId: 'regression-test-1',
    skillName: '刘荣鑫个人知识库',
    description: 'A test knowledge base with "quotes" and special chars',
    triggerWords: ['search', 'query', '搜索'],
    kbId: 34754,
    kbName: 'Test KB',
    content: '# Liu Rongxin KB\n\nBody content here.',
  }

  it('zip should contain expected files', async () => {
    const zipBuf = await buildSkillZip(baseOpts)
    const zip = new AdmZip(zipBuf)
    const entries = zip.getEntries().map(e => e.entryName)

    expect(entries.length).toBeGreaterThan(0)
    const skillMd = entries.find(e => e.endsWith('SKILL.md'))
    expect(skillMd).toBeDefined()
    expect(entries.some(e => e.endsWith('README.md'))).toBe(true)
    expect(entries.some(e => e.endsWith('config/user.json'))).toBe(true)
    expect(entries.some(e => e.endsWith('scripts/kb_client.py'))).toBe(true)
    expect(entries.some(e => e.endsWith('requirements.txt'))).toBe(true)
  })

  it('SKILL.md frontmatter should be valid YAML (trigger as list, quoted strings)', async () => {
    const zipBuf = await buildSkillZip(baseOpts)
    const zip = new AdmZip(zipBuf)
    const skillMd = zip.getEntries().find(e => e.entryName.endsWith('SKILL.md'))!
    const content = skillMd.getData().toString('utf-8')

    expect(content).toMatch(/^---\n/)
    expect(content).toMatch(/^name: ".*"$/m)
    expect(content).toMatch(/^description: ".*$/m)
    expect(content).toMatch(/^trigger:$/m)
    expect(content).toMatch(/^ {2}- "search"$/m)
    expect(content).toMatch(/^ {2}- "搜索"$/m)
    expect(content).toMatch(/^version: "1\.0\.0"$/m)
    expect(content).toMatch(/^kb_id: 34754$/m)
  })

  it('empty __init__.py should NOT be included in zip', async () => {
    const zipBuf = await buildSkillZip(baseOpts)
    const zip = new AdmZip(zipBuf)
    const entries = zip.getEntries().map(e => e.entryName)
    const initPy = entries.find(e => e.endsWith('__init__.py'))
    expect(initPy).toBeUndefined()
  })

  it('description with special characters should be escaped', async () => {
    const opts = { ...baseOpts, description: 'Test "with quotes" and \\backslashes' }
    const zipBuf = await buildSkillZip(opts)
    const zip = new AdmZip(zipBuf)
    const skillMd = zip.getEntries().find(e => e.entryName.endsWith('SKILL.md'))!
    const content = skillMd.getData().toString('utf-8')

    expect(content).toContain('Test \\"with quotes\\"')
  })

  it('safeName unified: Chinese + special chars should produce single dir prefix', async () => {
    const opts = { ...baseOpts, skillName: '刘 荣 鑫 @#$ 测试' }
    const zipBuf = await buildSkillZip(opts)
    const zip = new AdmZip(zipBuf)
    const entries = zip.getEntries().map(e => e.entryName)
    const dirPrefixes = [...new Set(entries.map(e => e.split('/')[0]))]
    expect(dirPrefixes.length).toBe(1)
  })

  it('ASCII skill name: dir should be lowercased with hyphens', async () => {
    const opts = { ...baseOpts, skillName: 'Quality Future Test' }
    const zipBuf = await buildSkillZip(opts)
    const zip = new AdmZip(zipBuf)
    const entries = zip.getEntries().map(e => e.entryName)
    const dirPrefix = entries[0].split('/')[0]
    expect(dirPrefix).toBe('quality-future-test')
  })
})
