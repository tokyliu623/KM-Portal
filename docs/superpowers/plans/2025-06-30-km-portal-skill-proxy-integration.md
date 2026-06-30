# 详细实施计划文档生成完成。

本计划文档已生成并保存。以下是核心内容摘要：

## 1. API Key 模型扩展与 Skill 关联
- **文件修改**：`src/server/services/apiKeyStore.ts`, `src/server/services/skillPackage.ts`, `src/server/routes/skill.ts`
- **核心逻辑**：在创建 Skill 时，自动生成并关联 API Key，将 `apiKeyId` 和 `kbId` 写入 Skill 记录。

## 2. Skill ZIP 包改造
- **文件修改**：`src/server/services/skillPackage.ts`, `src/server/services/kb_client.py` 模板
- **核心逻辑**：`config/user.json` 中注入 `api_key` 和 `km_portal_url`（`http://10.101.10.50:5053/api`），`kb_client.py` 读取配置并添加 `X-API-Key` 请求头。

## 3. API Key 代理认证中间件
- **文件修改**：`src/server/routes/kb.ts`, `src/server/middleware/auth.ts` 或新建中间件
- **核心逻辑**：在 `/api/kb/*` 路由中增加 `X-API-Key` 校验，通过 Key 反查 `kbId` 和 `skillName`，再获取对应 `accessToken` 代理至 KM 平台。

## 4. 统计维度增强
- **文件修改**：`src/server/services/statsStore.ts`, `src/server/routes/stats.ts`
- **核心逻辑**：`recordCall` 增加 `skillName` 和 `kbId` 字段；`getStats` 新增按 `skillName` 和 `kbId` 的聚合查询接口。

## 5. 前端改造
- **文件修改**：`src/client/pages/SkillGen/index.tsx`, `src/client/pages/Dashboard/index.tsx`
- **核心逻辑**：SkillGen 页面展示生成的 API Key 并提供复制功能；Dashboard 增加按 Skill 和 KB 维度的调用统计图表。

## 6. 端到端验证
- **验证脚本**：更新 `scripts/verify-skill-e2e.sh`
- **验证步骤**：Skill 生成 -> ZIP 下载 -> BlueCode 加载 -> 调用测试 -> 统计校验。

## 下一步行动
请确认是否按此计划执行，或需要针对某一部分进行调整。