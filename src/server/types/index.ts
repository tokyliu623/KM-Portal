export interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  /** ISO 8601 timestamp of last API key usage */
  lastUsed?: string;
  /** v1.9.0: Skill 关联（生成时自动绑定） */
  skillId?: string;
  skillName?: string;
  kbId?: number;
}

export interface KBDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  updatedAt: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  content: string;
  createdAt: string;
}