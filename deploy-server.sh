#!/bin/bash
set -e

PROJECT_DIR="/data/KM-Portal"
PORT=5053

echo "=== KM-Portal 部署脚本 (v1.7.5) ==="

# 1. Git 安全配置
git config --global --add safe.directory "$PROJECT_DIR"
git config --global http.postBuffer 524288000

# 2. 网络预检
echo "[1/5] 网络预检..."
if ! curl -fsS --max-time 5 https://github.com > /dev/null 2>&1; then
  echo "[FAIL] 无法连接 github.com，请检查网络/代理"
  exit 1
fi
echo "✅ 网络可达"

# 3. 同步代码
cd "$PROJECT_DIR"
rm -f .git/index.lock FETCH_HEAD
echo "[2/5] 拉取代码..."
for i in 1 2 3 4 5; do
  git fetch origin main && break
  echo "fetch retry $i failed, sleep 15s..."
  sleep 15
done
git reset --hard origin/main
echo "✅ 代码同步完成: $(git rev-parse --short HEAD)"

# 4. 修权限
echo "[3/5] 修权限..."
chmod +x dist/km-portal-linux scripts/verify-skill-e2e.sh scripts/verify-deploy.sh 2>/dev/null || true
[ -f .env ] && chmod 644 .env
chown -R "$(whoami):$(whoami)" .git 2>/dev/null || true
echo "✅ 权限修复完成"

# 5. 杀旧进程
echo "[4/5] 杀旧进程..."
pkill -9 -f km-portal-linux 2>/dev/null || true
sleep 3
if lsof -i:$PORT > /dev/null 2>&1; then
  echo "[FATAL] 端口 $PORT 仍占用"
  lsof -i:$PORT
  exit 1
fi
echo "✅ 端口 $PORT 空闲"

# 6. 启动服务
echo "[5/5] 启动服务..."
[ -f .env ] && set -a && . ./.env && set +a
PORT=$PORT nohup ./dist/km-portal-linux > server.log 2>&1 &
sleep 4

# 7. 健康检查
if curl -fsS http://127.0.0.1:$PORT/api/health > /dev/null 2>&1; then
  echo "✅ 服务启动成功: http://127.0.0.1:$PORT"
  echo "=== HEAD: $(git rev-parse --short HEAD) ==="
else
  echo "[FAIL] 服务启动失败，请检查 server.log"
  tail -20 server.log
  exit 1
fi