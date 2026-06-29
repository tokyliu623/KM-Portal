import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { buildSkillZip } from '../services/skillPackage';
const router = Router();
const DATA_DIR = path.join(process.cwd(), 'data');
const SKILLS_FILE = path.join(DATA_DIR, 'skills.json');
const locks = new Set();
async function withLock(key, fn) {
    while (locks.has(key)) {
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    locks.add(key);
    try {
        return await fn();
    }
    finally {
        locks.delete(key);
    }
}
async function readStore() {
    try {
        const content = await fs.readFile(SKILLS_FILE, 'utf-8');
        return JSON.parse(content);
    }
    catch {
        return { skills: [] };
    }
}
async function writeStore(store) {
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(SKILLS_FILE, JSON.stringify(store, null, 2), 'utf-8');
}
function generateSkillContent(name, kbId, kbName, permission) {
    const permissionNote = permission === 'write'
        ? '- **Capabilities**: Full read/write access to knowledge base'
        : '- **Capabilities**: Read-only access to knowledge base';
    return `# ${name}

## Skill Information

- **Knowledge Base ID**: ${kbId}
- **Knowledge Base Name**: ${kbName}
- **Permission Level**: ${permission.toUpperCase()}
- **Generated**: ${new Date().toISOString()}

## Description

${name} is a specialized assistant skill for interacting with the ${kbName} knowledge base.

## Capabilities

${permissionNote}
- Query documents and information
- Search across knowledge base content
${permission === 'write' ? '- Create and update documents\n- Manage knowledge base content' : ''}

## Usage

This skill can be used by AI assistants to:
1. Answer questions based on knowledge base content
2. Retrieve relevant documents and information
3. ${permission === 'write' ? 'Modify and extend knowledge base content' : 'Provide read-only access to information'}

## Notes

- Ensure the knowledge base token is valid before use
- ${permission === 'write' ? 'Write operations require explicit user confirmation' : 'This skill provides read-only access'}
`;
}
router.get('/', async (_req, res) => {
    try {
        const store = await readStore();
        res.json({ success: true, data: store.skills });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch skills' });
    }
});
router.get('/:id', async (req, res) => {
    try {
        const store = await readStore();
        const skill = store.skills.find((s) => s.id === req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }
        res.json({ success: true, data: skill });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to fetch skill' });
    }
});
router.post('/', async (req, res) => {
    try {
        const { name, description, kbId, kbName, permission } = req.body;
        if (!name || !kbId || !kbName) {
            return res.status(400).json({ success: false, error: 'name, kbId and kbName are required' });
        }
        if (isNaN(Number(kbId)) || Number(kbId) <= 0) {
            return res.status(400).json({ success: false, error: 'Invalid kbId: must be a positive number' });
        }
        const validPermission = permission === 'write' ? 'write' : 'read';
        const skill = {
            id: uuidv4(),
            name,
            description: description || `Skill for ${kbName || 'knowledge base'}`,
            kbId: Number(kbId),
            kbName: kbName || `KB-${kbId}`,
            permission: validPermission,
            content: generateSkillContent(name, Number(kbId), kbName || `KB-${kbId}`, validPermission),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await withLock('skill', async () => {
            const store = await readStore();
            store.skills.push(skill);
            await writeStore(store);
        });
        res.json({ success: true, data: skill });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to create skill' });
    }
});
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, permission } = req.body;
        await withLock('skill', async () => {
            const store = await readStore();
            const index = store.skills.findIndex((s) => s.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Skill not found' });
            }
            const skill = store.skills[index];
            const updatedSkill = {
                ...skill,
                name: name || skill.name,
                description: description || skill.description,
                permission: permission || skill.permission,
                content: generateSkillContent(name || skill.name, skill.kbId, skill.kbName, permission || skill.permission),
                updatedAt: new Date().toISOString(),
            };
            store.skills[index] = updatedSkill;
            await writeStore(store);
            res.json({ success: true, data: updatedSkill });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update skill' });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await withLock('skill', async () => {
            const store = await readStore();
            const index = store.skills.findIndex((s) => s.id === id);
            if (index === -1) {
                return res.status(404).json({ success: false, error: 'Skill not found' });
            }
            store.skills.splice(index, 1);
            await writeStore(store);
            res.json({ success: true, message: 'Skill deleted' });
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to delete skill' });
    }
});
router.get('/:id/export', async (req, res) => {
    try {
        const store = await readStore();
        const skill = store.skills.find((s) => s.id === req.params.id);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }
        const zipBuffer = await buildSkillZip({
            skillId: skill.id,
            skillName: skill.name,
            description: skill.description || '',
            triggerWords: [],
            kbId: skill.kbId,
            kbName: skill.kbName,
            content: skill.content,
        });
        const filename = `kb-${skill.name.toLowerCase().replace(/\s+/g, '-')}-v1.0.0.zip`;
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(zipBuffer);
    }
    catch (error) {
        res.status(500).json({ success: false, error: 'Failed to export skill' });
    }
});
export default router;
