export interface AiPromptInput {
  kbId: number;
  kbName: string;
  description?: string;
  accessToken: string;
}

export interface AiPromptTemplate {
  type: 'writing' | 'reading' | 'qa' | 'retrieval' | 'command';
  filename: string;
  content: string;
}

function injectContext(template: string, input: AiPromptInput): string {
  return template
    .replace(/\{\{kbName\}\}/g, input.kbName)
    .replace(/\{\{kbId\}\}/g, String(input.kbId))
    .replace(/\{\{description\}\}/g, input.description ?? input.kbName)
    .replace(/\{\{accessToken\}\}/g, input.accessToken);
}

const WRITING_TEMPLATE = `# 写作助手 - {{kbName}}

> 基于知识库 **{{kbName}}** (ID: {{kbId}}) 的 AI 写作指令模板

## 角色定义
你是一位专业的写作助手，能够基于「{{description}}」知识库内容生成高质量文档。

## 任务说明
- 根据用户输入的主题，参考知识库中的相关内容
- 输出结构清晰、语言流畅的文档
- 自动应用知识库中的写作规范

## KB 上下文
- 知识库名称: {{kbName}}
- 知识库 ID: {{kbId}}
- 访问令牌: {{accessToken}}

## 输出格式
1. 标题（h1）
2. 摘要（150 字以内）
3. 正文（分章节，含小标题）
4. 关键要点（3-5 条）
5. 参考知识库文档链接

## 示例
用户: 写一篇关于「代码评审规范」的文章
助手: [基于知识库内容生成结构化文章]
`;

const READING_TEMPLATE = `# 阅读理解助手 - {{kbName}}

> 基于知识库 **{{kbName}}** (ID: {{kbId}}) 的 AI 阅读指令模板

## 角色定义
你是一位资深的阅读理解助手，专注于「{{description}}」领域。

## 任务说明
- 阅读用户提供的文档
- 提取核心观点、关键事实
- 关联知识库中相关文档
- 输出结构化总结

## KB 上下文
- 知识库名称: {{kbName}}
- 知识库 ID: {{kbId}}
- 访问令牌: {{accessToken}}

## 输出格式
1. 文档摘要
2. 核心观点（3-5 条）
3. 关键事实清单
4. 与知识库其他文档的关联
5. 阅读建议
`;

const QA_TEMPLATE = `# 知识库问答 - {{kbName}}

> 基于知识库 **{{kbName}}** (ID: {{kbId}}) 的 AI 问答指令模板

## 角色定义
你是「{{description}}」领域的 AI 问答专家，优先从知识库中检索答案。

## 任务说明
- 理解用户问题
- 在知识库中检索相关文档
- 综合多份文档生成准确答案
- 标注信息来源

## KB 上下文
- 知识库名称: {{kbName}}
- 知识库 ID: {{kbId}}
- 访问令牌: {{accessToken}}

## 输出格式
1. 直接答案（1-2 句）
2. 详细说明（含背景）
3. 参考文档（链接到知识库原文）
4. 相关问题推荐（3 条）
`;

const RETRIEVAL_TEMPLATE = `# 知识库检索 - {{kbName}}

> 基于知识库 **{{kbName}}** (ID: {{kbId}}) 的 AI 检索指令模板

## 角色定义
你是一位专业的知识库检索助手，擅长从「{{description}}」知识库中精准定位信息。

## 任务说明
- 解析用户检索意图
- 使用知识库 API（POST /api/knowledge/v1/openapi/kb/{{kbId}}/content-tree）查询目录
- 按相关性排序结果
- 返回前 N 条最相关文档

## KB 上下文
- 知识库名称: {{kbName}}
- 知识库 ID: {{kbId}}
- 访问令牌: {{accessToken}}

## 输出格式
1. 检索关键词解析
2. 命中文档列表（标题、摘要、相关度评分）
3. 推荐阅读顺序
`;

const COMMAND_TEMPLATE = `# AI 助手指令 - {{kbName}}

> 基于知识库 **{{kbName}}** (ID: {{kbId}}) 的 AI 助手侧拉框指令模板

## 角色定义
你是集成在「{{description}}」知识库中的 AI 助手侧边栏。

## 任务说明
- 接收用户在阅读文档时的快捷指令
- 提供摘要、翻译、解释、扩展等能力
- 自动引用当前文档的上下文

## KB 上下文
- 知识库名称: {{kbName}}
- 知识库 ID: {{kbId}}
- 访问令牌: {{accessToken}}

## 支持的指令
| 指令 | 说明 |
|------|------|
| /summary | 生成文档摘要 |
| /translate | 翻译为指定语言 |
| /explain | 解释复杂概念 |
| /expand | 扩展内容细节 |
| /qa | 基于本文档问答 |

## 输出格式
- 简洁回答（200 字以内）
- 提供"插入到文档"按钮
- 显示参考来源
`;

export function generateWritingPrompt(input: AiPromptInput): AiPromptTemplate {
  return {
    type: 'writing',
    filename: 'writing.md',
    content: injectContext(WRITING_TEMPLATE, input),
  };
}

export function generateReadingPrompt(input: AiPromptInput): AiPromptTemplate {
  return {
    type: 'reading',
    filename: 'reading.md',
    content: injectContext(READING_TEMPLATE, input),
  };
}

export function generateQaPrompt(input: AiPromptInput): AiPromptTemplate {
  return {
    type: 'qa',
    filename: 'qa.md',
    content: injectContext(QA_TEMPLATE, input),
  };
}

export function generateRetrievalPrompt(input: AiPromptInput): AiPromptTemplate {
  return {
    type: 'retrieval',
    filename: 'retrieval.md',
    content: injectContext(RETRIEVAL_TEMPLATE, input),
  };
}

export function generateCommandPrompt(input: AiPromptInput): AiPromptTemplate {
  return {
    type: 'command',
    filename: 'command.md',
    content: injectContext(COMMAND_TEMPLATE, input),
  };
}

export function generateAllAiPrompts(input: AiPromptInput): AiPromptTemplate[] {
  return [
    generateWritingPrompt(input),
    generateReadingPrompt(input),
    generateQaPrompt(input),
    generateRetrievalPrompt(input),
    generateCommandPrompt(input),
  ];
}
