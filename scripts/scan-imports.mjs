// 扫描 src/server 下所有 .ts 文件,找出 ESM 兼容问题:
// 1. import 相对路径未带 .js 后缀
// 2. typecheck 验证
import { readdir, readFile, stat } from 'fs/promises'
import path from 'path'

const ROOT = 'D:/Users/11033406/【01】Projects/KM-Portal'
const SCAN_DIRS = ['src/server']
const issues = []

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      await walk(full)
    } else if (/\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) && !/\.d\.ts$/.test(e.name)) {
      const content = await readFile(full, 'utf8')
      // 匹配 from '../...' 或 from './...'  但末尾不是 .js/.json
      const re = /from\s+['"](\.\.?\/[^'"]+?)['"]/g
      let m
      while ((m = re.exec(content))) {
        const spec = m[1]
        // 跳过已经带 .js / .json 的
        if (/\.(js|json|cjs|mjs)$/.test(spec)) continue
        // 跳过目录（/utils）也算相对路径,问题一样
        const lineNo = content.slice(0, m.index).split('\n').length
        issues.push({ file: full.replace(ROOT + '\\', ''), line: lineNo, spec })
      }
    }
  }
}

for (const d of SCAN_DIRS) {
  await walk(path.join(ROOT, d))
}

console.log('=== Missing .js suffix in imports ===')
if (issues.length === 0) {
  console.log('OK: no missing .js suffix found')
} else {
  for (const i of issues) console.log(`  ${i.file}:${i.line}  from '${i.spec}'`)
  console.log(`Total: ${issues.length} issues`)
  process.exitCode = 1
}
