import { describe, it, expect, beforeEach } from 'vitest'
import { asciiFallback, sanitizeEnglish, translateToEnglish, LLM_BOT_ID } from '../../src/server/services/translator'

describe('translator', () => {
  describe('sanitizeEnglish', () => {
    it('removes filesystem-unsafe characters', () => {
      expect(sanitizeEnglish('foo/bar\\baz:qux')).toBe('foobarbazqux')
    })

    it('collapses whitespace and trims', () => {
      expect(sanitizeEnglish('  hello   world  ')).toBe('hello world')
    })

    it('limits to 80 chars', () => {
      const long = 'a'.repeat(200)
      expect(sanitizeEnglish(long).length).toBeLessThanOrEqual(80)
    })

    it('returns "Skill" for empty input', () => {
      expect(sanitizeEnglish('   ')).toBe('Skill')
    })

    it('strips quotes and angle brackets', () => {
      expect(sanitizeEnglish('a<b>c"d')).toBe('abcd')
    })
  })

  describe('asciiFallback', () => {
    it('converts Chinese to lowercase dash-separated ASCII', () => {
      const out = asciiFallback('中文 Skill 名')
      expect(out).toMatch(/^skill/)
    })

    it('returns a non-empty string for pure Chinese', () => {
      expect(asciiFallback('维基知识库').length).toBeGreaterThan(0)
    })

    it('trims leading and trailing dashes', () => {
      expect(asciiFallback('   hello world   ')).toBe('hello-world')
    })

    it('collapses multiple dashes', () => {
      const out = asciiFallback('foo --- bar')
      expect(out).not.toMatch(/---/)
    })
  })

  describe('translateToEnglish', () => {
    beforeEach(() => {
      delete process.env.LLM_API_KEY
    })

    it('throws when LLM_API_KEY is missing', async () => {
      await expect(translateToEnglish('hello', 'kb-1')).rejects.toThrow(/LLM_API_KEY/)
    })

    it('exports LLM_BOT_ID for config reference', () => {
      expect(typeof LLM_BOT_ID).toBe('string')
    })
  })
})
