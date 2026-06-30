#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
TEST_DIR="/tmp/km-verify-test-$$"
KM_PATH="/data/KM-Portal"

echo "=== 测试 verify-deploy.sh 的 5 大检测项 ==="

mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

PASS=0
FAIL=0

test_check() {
    local name="$1"
    local cmd="$2"
    local expected="$3"

    echo -n "[$name] "
    if eval "$cmd" > /dev/null 2>&1; then
        if [ "$expected" = "pass" ]; then
            echo "✅ PASS"
            ((PASS++))
        else
            echo "❌ FAIL (expected to fail)"
            ((FAIL++))
        fi
    else
        if [ "$expected" = "fail" ]; then
            echo "✅ PASS (correctly failed)"
            ((PASS++))
        else
            echo "❌ FAIL"
            ((FAIL++))
        fi
    fi
}

echo ""
echo "--- 测试 1: safe.directory 检测 ---"
test_check "safe.directory 已配置" \
    "git config --global --list | grep -q 'safe.directory=/data/KM-Portal'" \
    "pass"

echo ""
echo "--- 测试 2: .git 写权限检测 ---"
touch "$TEST_DIR/.git/FETCH_HEAD" 2>/dev/null && {
    echo "✅ PASS (可创建 FETCH_HEAD)"
    ((PASS++))
} || {
    echo "❌ FAIL (无法创建 FETCH_HEAD)"
    ((FAIL++))
}

echo ""
echo "--- 测试 3: .env 读权限检测 ---"
if [ -f "$KM_PATH/.env" ]; then
    if grep -q "." "$KM_PATH/.env" 2>/dev/null; then
        echo "✅ PASS (可读 .env)"
        ((PASS++))
    else
        echo "❌ FAIL (.env 存在但不可读)"
        ((FAIL++))
    fi
else
    echo "❌ FAIL (.env 不存在)"
    ((FAIL++))
fi

echo ""
echo "--- 测试 4: 网络可达检测 ---"
if curl -fsS --max-time 5 https://github.com > /dev/null 2>&1; then
    echo "✅ PASS (网络可达)"
    ((PASS++))
else
    echo "❌ FAIL (网络不可达)"
    ((FAIL++))
fi

echo ""
echo "--- 测试 5: 端口 5053 空闲检测 ---"
if lsof -i:5053 > /dev/null 2>&1; then
    echo "❌ FAIL (端口被占用)"
    ((FAIL++))
else
    echo "✅ PASS (端口空闲)"
    ((PASS++))
fi

echo ""
echo "=== 测试结果: $PASS/5 通过 ==="

rm -rf "$TEST_DIR"

if [ $FAIL -eq 0 ]; then
    echo "所有测试通过"
    exit 0
else
    echo "有 $FAIL 项测试失败"
    exit 1
fi