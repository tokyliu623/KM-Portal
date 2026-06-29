#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== KM-Portal Docker 部署开始 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

echo ">>> 拉取最新代码..."
git pull origin main

echo ">>> 构建 Docker 镜像..."
docker build -t km-portal .

echo ">>> 停止旧容器..."
docker stop km-portal 2>/dev/null || true
docker rm km-portal 2>/dev/null || true

echo ">>> 启动新容器..."
docker run -d \
  --name km-portal \
  -p 5053:5053 \
  -e PORT=5053 \
  -v "$SCRIPT_DIR/data:/app/data" \
  km-portal

sleep 3

if docker ps | grep -q km-portal; then
    echo "=== 部署成功 ==="
    echo "服务地址: http://localhost:5053/api/health"
    echo "容器日志: docker logs km-portal"
else
    echo "=== 部署失败 ==="
    echo "docker logs km-portal"
    exit 1
fi