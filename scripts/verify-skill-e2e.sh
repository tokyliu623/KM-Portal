#!/bin/bash
# ============================================================
# KM-Portal Skill 包端到端验证脚本
# 用途:服务器上一键完成 生成 → 解析 → 复核 → 清理
# 适用:KM-Portal v1.7.1+(已部署 src/shared/types/kb.ts + 模块 7 zip 规范化)
# 用法:
#   KEEP_ARTIFACT=no  bash scripts/verify-skill-e2e.sh   # 验证后自动清理(默认)
#   KEEP_ARTIFACT=yes bash scripts/verify-skill-e2e.sh   # 保留产物到 /tmp/km-skill-verify-XXX/
# 环境变量覆盖(可选):
#   PORT=5053 KB_ID=34754 KB_NAME=xxx TOKEN=xxx bash scripts/verify-skill-e2e.sh
# ============================================================
set -e

# ========== 配置 ==========
PORT="${PORT:-5053}"
BASE="http://127.0.0.1:${PORT}"
WORK_DIR="/tmp/km-skill-verify-$$"
KEEP_ARTIFACT="${KEEP_ARTIFACT:-no}"

# 测试数据(默认值可被环境变量覆盖)
KB_ID="${KB_ID:-34754}"
KB_NAME="${KB_NAME:-个人知识库测试_LRX}"
TOKEN="${TOKEN:-u-46311a0f761a4d7fac562df2b789c96e}"
SKILL_DESC="${SKILL_DESC:-v1.7.1 E2E 验证测试 Skill}"
TEST_NAME_CN="${TEST_NAME_CN:-验证测试库_$$}"
PERMISSION="${PERMISSION:-read}"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

echo "=== KM-Portal Skill 包端到端验证 ==="
echo "工作目录: $WORK_DIR"
echo "KB_ID=$KB_ID KB_NAME=$KB_NAME"
echo "KEEP_ARTIFACT=$KEEP_ARTIFACT"
echo

# ========== Step 1: 前置检查 ==========
echo "=== [1/8] 前置检查 ==="
curl -fsS -m 5 "$BASE/api/health" -o /dev/null || { echo "❌ FAIL: 服务未启动或不可达"; exit 1; }
echo "✅ 服务健康 (http://127.0.0.1:$PORT)"

TRANS_HEALTH=$(curl -fsS -m 10 "$BASE/api/diag/translate-health" 2>/dev/null || echo '{}')
if echo "$TRANS_HEALTH" | grep -q '"reachable":true'; then
  echo "✅ 翻译服务可达 (模块 6 探针通过)"
elif echo "$TRANS_HEALTH" | grep -q '"llm_configured":true'; then
  echo "⚠️  WARN: 翻译服务配置了但不可达,后续将触发降级"
else
  echo "⚠️  WARN: 翻译服务未配置/不可达,后续将触发降级 warning"
fi
echo

# ========== Step 2: 创建测试 Skill(模块 4 翻译兜底) ==========
echo "=== [2/8] 创建测试 Skill (POST /api/skill) ==="
CREATE_RESP=$(curl -fsS -m 30 -X POST "$BASE/api/skill/" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"$TEST_NAME_CN\",
    \"description\": \"$SKILL_DESC\",
    \"kbId\": $KB_ID,
    \"kbName\": \"$KB_NAME\",
    \"permission\": \"$PERMISSION\"
  }")
echo "Response: $(echo "$CREATE_RESP" | head -c 300)"

SKILL_ID=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])" 2>/dev/null || echo "")
SKILL_NAME_EN=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['name'])" 2>/dev/null || echo "")
WARNING=$(echo "$CREATE_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('warning',''))" 2>/dev/null || echo "")

if [ -z "$SKILL_ID" ]; then
  echo "❌ FAIL: Skill 创建失败"
  echo "$CREATE_RESP"
  exit 1
fi
echo "✅ Skill 创建成功"
echo "  ID:      $SKILL_ID"
echo "  nameEn:  $SKILL_NAME_EN"
[ -n "$WARNING" ] && echo "  ⚠️  warning: $WARNING"
echo

# ========== Step 3: 下载 zip ==========
echo "=== [3/8] 下载 zip 包 (GET /api/skill/:id/export) ==="
ZIP_FILE="$WORK_DIR/skill.zip"
curl -fsS -m 30 -o "$ZIP_FILE" "$BASE/api/skill/$SKILL_ID/export" || { echo "❌ FAIL: 下载 zip 失败"; exit 1; }
SIZE=$(stat -c%s "$ZIP_FILE" 2>/dev/null || stat -f%z "$ZIP_FILE")
[ "$SIZE" -lt 100 ] && { echo "❌ FAIL: zip 太小($SIZE bytes)"; exit 1; }
echo "✅ zip 下载成功: $SIZE bytes"
echo

# ========== Step 4: 解压 ==========
echo "=== [4/8] 解压并列出文件 ==="
unzip -qo "$ZIP_FILE" -d "$WORK_DIR/extracted" || { echo "❌ FAIL: 解压失败"; exit 1; }
echo "文件清单:"
unzip -l "$ZIP_FILE" | awk 'NR>3 && NF>=4 && $NF!~/^$/ {print "  " $NF}' | grep -v "^  files$" | grep -v "^  ----"
echo

# ========== Step 5: 复核 SKILL.md frontmatter(模块 7 验收) ==========
echo "=== [5/8] 复核 SKILL.md YAML frontmatter(模块 7) ==="
SKILL_DIR=$(ls "$WORK_DIR/extracted" | head -1)
SKILL_MD="$WORK_DIR/extracted/$SKILL_DIR/SKILL.md"
[ -f "$SKILL_MD" ] || { echo "❌ FAIL: SKILL.md 不存在"; exit 1; }

head -1 "$SKILL_MD" | grep -q "^---$" && echo "✅ YAML frontmatter 起始标记存在" || { echo "❌ FAIL: 缺少 frontmatter"; exit 1; }
LAST_LINE=$(grep -n "^---$" "$SKILL_MD" | tail -1 | cut -d: -f1)
[ "$LAST_LINE" -gt 1 ] && echo "✅ YAML frontmatter 结束标记存在 (第 $LAST_LINE 行)" || { echo "❌ FAIL: frontmatter 未闭合"; exit 1; }

if grep -A 5 "^trigger:" "$SKILL_MD" | grep -q "^  - "; then
  echo "✅ trigger 是 YAML 列表(模块 7 修复生效)"
elif grep -q "^trigger:\s*\[\s*\]" "$SKILL_MD"; then
  echo "✅ trigger 是空列表(合法 YAML,v1.7.4 默认值兜底)"
else
  echo "❌ FAIL: trigger 既不是列表也不是空数组"
  exit 1
fi

grep -E '^description: ".*"$' "$SKILL_MD" > /dev/null && echo "✅ description 用双引号包裹" || echo "⚠️  description 未用引号"

python3 - <<PYEOF || { echo "❌ FAIL: frontmatter 解析失败"; exit 1; }
import re
content = open("$SKILL_MD", encoding="utf-8").read()
m = re.match(r"^---\n(.*?)\n---", content, re.DOTALL)
if not m:
    print("❌ FAIL: frontmatter 不完整"); raise SystemExit(1)
fm = m.group(1)
print(f"✅ Python 正则解析 frontmatter 成功({len(fm)} 字符)")
required = ["name:", "description:", "trigger:"]
for k in required:
    if k not in fm:
        print(f"❌ FAIL: frontmatter 缺字段 {k}"); raise SystemExit(1)
print("✅ 必填字段齐全: name / description / trigger")
PYEOF
echo

# ========== Step 6: 复核 zip 结构(模块 7 验收) ==========
echo "=== [6/8] 复核 zip 结构(模块 7:无空 init + 目录一致) ==="

INIT_PY="$WORK_DIR/extracted/$SKILL_DIR/scripts/__init__.py"
if [ -f "$INIT_PY" ]; then
  INIT_SIZE=$(stat -c%s "$INIT_PY" 2>/dev/null || stat -f%z "$INIT_PY")
  if [ "$INIT_SIZE" = "0" ]; then
    echo "❌ FAIL: scripts/__init__.py 是空文件(v1.7.1 应跳过)"
    exit 1
  else
    echo "✅ scripts/__init__.py 非空($INIT_SIZE bytes)"
  fi
else
  echo "✅ scripts/__init__.py 未被写入(v1.7.1 跳过空文件)"
fi

ROOT_DIRS=$(unzip -l "$ZIP_FILE" | awk 'NR>3 && NF>=4 && $NF!~/^$/ {print $NF}' | awk -F/ '{print $1}' | sort -u | grep -v '^$')
DIR_COUNT=$(echo "$ROOT_DIRS" | wc -l | tr -d ' ')
if [ "$DIR_COUNT" = "1" ]; then
  echo "✅ zip 内部目录统一: $ROOT_DIRS"
else
  echo "❌ FAIL: zip 包含多个根目录: $ROOT_DIRS"
  exit 1
fi
[ -f "$WORK_DIR/extracted/$SKILL_DIR/SKILL.md" ] && echo "✅ SKILL.md 在正确目录" || { echo "❌ FAIL: SKILL.md 路径异常"; exit 1; }
[ -f "$WORK_DIR/extracted/$SKILL_DIR/README.md" ] && echo "✅ README.md 在正确目录" || echo "⚠️  README.md 缺失"
[ -f "$WORK_DIR/extracted/$SKILL_DIR/requirements.txt" ] && echo "✅ requirements.txt 在正确目录" || echo "⚠️  requirements.txt 缺失"
[ -f "$WORK_DIR/extracted/$SKILL_DIR/config/user.json" ] && echo "✅ config/user.json 在正确目录" || echo "⚠️  config/user.json 缺失"
[ -f "$WORK_DIR/extracted/$SKILL_DIR/scripts/kb_client.py" ] && echo "✅ scripts/kb_client.py 在正确目录" || echo "⚠️  scripts/kb_client.py 缺失"
echo

# ========== Step 7: 字段兼容验证(模块 2+3) ==========
echo "=== [7/8] 字段兼容验证(snake_case 旧字段 kb_id 仍可用) ==="
COMPAT_RESP=$(curl -fsS -m 30 -X POST "$BASE/api/skill/" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"兼容测试_$$\",
    \"description\": \"snake_case 字段验证\",
    \"kb_id\": $KB_ID,
    \"kb_name\": \"$KB_NAME\",
    \"permission\": \"$PERMISSION\"
  }")
COMPAT_ID=$(echo "$COMPAT_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['data']['id'])" 2>/dev/null || echo "")
if [ -n "$COMPAT_ID" ]; then
  echo "✅ snake_case 字段兼容通过(模块 3): ID=$COMPAT_ID"
else
  echo "❌ FAIL: snake_case 字段不兼容"
  echo "$COMPAT_RESP"
  exit 1
fi
echo

# ========== Step 8: 报告 + 清理 ==========
echo "=== [8/8] 验证总结 ==="
echo "✅ 全部 8 个验收点通过"
echo
echo "测试数据:"
echo "  Skill ID (cn):  $SKILL_ID"
echo "  Skill ID (en):  $COMPAT_ID"
echo "  ZIP 大小:       $SIZE bytes"
echo "  ZIP 内部目录:   $SKILL_DIR"
echo "  工作目录:       $WORK_DIR"
echo

if [ "$KEEP_ARTIFACT" = "yes" ]; then
  cat > "$WORK_DIR/cleanup.sh" << EOF
#!/bin/bash
set -e
echo "=== 清理测试数据 ==="
curl -fsS -m 5 -X DELETE "$BASE/api/skill/$SKILL_ID" -o /dev/null && echo "✅ 删除 Skill $SKILL_ID"
curl -fsS -m 5 -X DELETE "$BASE/api/skill/$COMPAT_ID" -o /dev/null && echo "✅ 删除 Skill $COMPAT_ID"
rm -rf "$WORK_DIR"
echo "✅ 清理完成"
EOF
  chmod +x "$WORK_DIR/cleanup.sh"
  echo "KEEP_ARTIFACT=yes,产物保留在: $WORK_DIR"
  echo "清理命令: $WORK_DIR/cleanup.sh"
else
  echo "自动清理(KEEP_ARTIFACT=no)..."
  curl -fsS -m 5 -X DELETE "$BASE/api/skill/$SKILL_ID" -o /dev/null 2>/dev/null || true
  curl -fsS -m 5 -X DELETE "$BASE/api/skill/$COMPAT_ID" -o /dev/null 2>/dev/null || true
  rm -rf "$WORK_DIR"
  echo "✅ 已清理测试数据"
fi
echo
echo "=== 验证完成 ==="
