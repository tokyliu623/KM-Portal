import { describe, it, expect } from 'vitest'
import { buildSkillZip } from '../../src/server/services/skillPackage'
import AdmZip from 'adm-zip'

describe('skillPackage v1.7.4 regression - default trigger fallback', () => {
  const baseOpts = {
    skillId: 'regression-v174',
    skillName: 'TestKB V174',
    description: 'Test default trigger fallback',
    triggerWords: [] as string[],  // 故意传空数组
    kbId: 34754,
    kbName: 'Test KB',
    content: '# Test\n\nBody.',
  }

  it('when triggerWords is empty, should use default trigger words (not empty list)', async () => {
    const zipBuf = await buildSkillZip(baseOpts)
    const zip = new AdmZip(zipBuf)
    const skillMd = zip.getEntries().find(e => e.entryName.endsWith('SKILL.md'))!
    const content = skillMd.getData().toString('utf-8')

    expect(content).toMatch(/^---\n/)
    expect(content).toMatch(/^trigger:$/m)
    // v1.7.4 默认 trigger 应该至少有 1 个元素
    expect(content).toMatch(/^ {2}- "查询"$/m)
    expect(content).toMatch(/^ {2}- "search"$/m)
    // 不应该有 trigger: [] 空列表
    expect(content).not.toMatch(/^trigger:\s*\[\s*\]/m)
  })

  it('when triggerWords has user values, should keep them (not replace with defaults)', async () => {
    const zipBuf = await buildSkillZip({
      ...baseOpts,
      triggerWords: ['用户自定义词', 'custom'],
    })
    const zip = new AdmZip(zipBuf)
    const skillMd = zip.getEntries().find(e => e.entryName.endsWith('SKILL.md'))!
    const content = skillMd.getData().toString('utf-8')

    expect(content).toMatch(/^ {2}- "用户自定义词"$/m)
    expect(content).toMatch(/^ {2}- "custom"$/m)
    // 默认 trigger 词不应该出现
    expect(content).not.toMatch(/^ {2}- "查询"$/m)
  })

  it('README.md should also reflect default triggers when empty', async () => {
    const zipBuf = await buildSkillZip(baseOpts)
    const zip = new AdmZip(zipBuf)
    const readme = zip.getEntries().find(e => e.entryName.endsWith('README.md'))!
    const content = readme.getData().toString('utf-8')

    // README 触发词章节应该包含默认 trigger
    expect(content).toContain('查询')
    expect(content).toContain('search')
    // 不应该显示"无"
    expect(content).not.toMatch(/^无$/m)
  })
})
