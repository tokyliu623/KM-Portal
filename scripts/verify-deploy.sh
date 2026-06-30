#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
KM_PATH="${KM_PATH:-/data/KM-Portal}"
PASS=0
FAIL=0

print_check() {
    local num=$1
    local name=$2
    local status=$3

    if [ "$status" = "pass" ]; then
        echo "[$num/5] $name: ✅"
        ((PASS++))
    else
        echo "[$num/5] $name: ❌"
        ((FAIL++))
    fi
}

echo "=== KM-Portal 部署预检 ==="
echo ""

cd "$KM_PATH"

if git config --global --list 2>/dev/null | grep -q "safe.directory=$KM_PATH"; then
    print_check 1 "safe.directory" "pass"
else
    print_check 1 "safe.directory" "fail"
fi

if touch "$KM_PATH/.git/FETCH_HEAD" 2>/dev/null; then
    rm -f "$KM_PATH/.git/FETCH_HEAD"
    print_check 2 ".git 写权限" "pass"
else
    print_check 2 ".git 写权限" "fail"
fi

if [ -f "$KM_PATH/.env" ] && grep -q "." "$KM_PATH/.env" 2>/dev/null; then
    print_check 3 ".env 读权限" "pass"
else
    print_check 3 ".env 读权限" "fail"
fi

if curl -fsS --max-time 5 https://github.com > /dev/null 2>&1; then
    print_check 4 "网络可达" "pass"
else
    print_check 4 "网络可达" "fail"
fi

if lsof -i:5053 > /dev/null 2>&1; then
    print_check 5 "端口空闲(5053)" "fail"
else
    print_check 5 "端口空闲(5053)" "pass"
fi

echo ""
echo "=== 预检结果: $PASS/5 通过 ==="

if [ $FAIL -gt 0 ]; then
    echo "❌ 存在 $FAIL 项检测失败，阻止部署"
    exit 1
fi

echo "✅ 所有检测通过，允许部署"
exit 0