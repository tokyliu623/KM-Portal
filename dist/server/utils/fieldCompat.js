/**
 * v1.7.3 字段兼容工具
 * 用于兼容 camelCase (kbId) 与 snake_case (kb_id) 双字段名
 *
 * 用法:
 *   const kbId = getField(req.body, 'kbId', 'kb_id')
 *   if (!kbId) return res.status(400).json({ error: 'kbId is required' })
 *
 * 优先级:从前往后找,返回第一个非 undefined/null 的值
 */
export function getField(body, ...keys) {
    for (const key of keys) {
        if (body[key] !== undefined && body[key] !== null)
            return body[key];
    }
    return undefined;
}
