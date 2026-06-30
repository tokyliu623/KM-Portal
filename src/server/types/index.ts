export interface ApiKey {
  id: string;
  name: string;
  key: string;
  /** KB ID this API key is associated with (v1.9.0) */
  kbId?: string | number;
  /** Skill ID this API key is associated with (v1.9.0) */
  skillId?: string;
  /** Skill display name for quick lookup (v1.9.0) */
  skillName?: string;
  createdAt: string;
  /** ISO 8601 timestamp of last API key usage */
  lastUsed?: string;
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