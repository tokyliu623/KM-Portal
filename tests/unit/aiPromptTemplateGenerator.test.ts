import { describe, it, expect } from 'vitest';
import {
  generateWritingPrompt,
  generateReadingPrompt,
  generateQaPrompt,
  generateRetrievalPrompt,
  generateCommandPrompt,
  generateAllAiPrompts,
  type AiPromptInput,
} from '../../src/server/services/aiPromptTemplateGenerator.js';

const baseInput: AiPromptInput = {
  kbId: 34754,
  kbName: '研发知识库',
  description: '研发流程与规范',
  accessToken: 'u-test-token-123',
};

describe('aiPromptTemplateGenerator', () => {
  describe('generateWritingPrompt', () => {
    it('返回 writing 类型的 AI 指令模板', () => {
      const result = generateWritingPrompt(baseInput);
      expect(result.type).toBe('writing');
      expect(result.filename).toBe('writing.md');
      expect(result.content).toContain('写作');
    });

    it('注入 KB 上下文变量', () => {
      const result = generateWritingPrompt(baseInput);
      expect(result.content).toContain('研发知识库');
      expect(result.content).toContain('34754');
    });

    it('占位符 {{accessToken}} 被替换', () => {
      const result = generateWritingPrompt(baseInput);
      expect(result.content).not.toContain('{{accessToken}}');
      expect(result.content).toContain('u-test-token-123');
    });
  });

  describe('generateReadingPrompt', () => {
    it('返回 reading 类型的 AI 指令模板', () => {
      const result = generateReadingPrompt(baseInput);
      expect(result.type).toBe('reading');
      expect(result.filename).toBe('reading.md');
      expect(result.content).toContain('阅读');
    });

    it('含 KB 上下文', () => {
      const result = generateReadingPrompt(baseInput);
      expect(result.content).toContain('研发知识库');
    });
  });

  describe('generateQaPrompt', () => {
    it('返回 qa 类型的 AI 指令模板', () => {
      const result = generateQaPrompt(baseInput);
      expect(result.type).toBe('qa');
      expect(result.filename).toBe('qa.md');
      expect(result.content).toContain('问答');
    });
  });

  describe('generateRetrievalPrompt', () => {
    it('返回 retrieval 类型的 AI 指令模板', () => {
      const result = generateRetrievalPrompt(baseInput);
      expect(result.type).toBe('retrieval');
      expect(result.filename).toBe('retrieval.md');
      expect(result.content).toContain('检索');
    });
  });

  describe('generateCommandPrompt', () => {
    it('返回 command 类型的 AI 指令模板', () => {
      const result = generateCommandPrompt(baseInput);
      expect(result.type).toBe('command');
      expect(result.filename).toBe('command.md');
      expect(result.content).toContain('指令');
    });
  });

  describe('generateAllAiPrompts', () => {
    it('返回 5 类模板', () => {
      const results = generateAllAiPrompts(baseInput);
      expect(results).toHaveLength(5);
      const types = results.map((r) => r.type);
      expect(types).toEqual(['writing', 'reading', 'qa', 'retrieval', 'command']);
    });

    it('所有模板都含 KB 名称', () => {
      const results = generateAllAiPrompts(baseInput);
      results.forEach((r) => {
        expect(r.content).toContain('研发知识库');
      });
    });
  });

  describe('变量注入', () => {
    it('支持自定义 description', () => {
      const result = generateWritingPrompt({ ...baseInput, description: 'AI 研发助手' });
      expect(result.content).toContain('AI 研发助手');
    });

    it('accessToken 缺失时不替换占位符', () => {
      const result = generateWritingPrompt({ ...baseInput, accessToken: '' });
      expect(result.content).not.toContain('u-test-token-123');
    });
  });
});
