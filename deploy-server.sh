#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== KM-Portal 服务器部署开始 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

echo ">>> 清理可能的锁定文件..."
rm -f .git/index.lock FETCH_HEAD

echo ">>> 配置 Git 缓冲区（解决大文件下载问题）..."
git config --global http.postBuffer 524288000 2>/dev/null || true
git config --global http.lowSpeedLimit 1000 2>/dev/null || true
git config --global http.lowSpeedTime 300 2>/dev/null || true

echo ">>> 忽略本地文件权限变更（防止 chmod 后 pull 失败）..."
git config core.fileMode false

echo ">>> 强制同步远程代码..."
git fetch origin main
git reset --hard origin/main

echo ">>> 检查静态可执行文件..."
if [ ! -f "$SCRIPT_DIR/dist/km-portal-linux" ]; then
    echo "错误: 找不到 dist/km-portal-linux 文件"
    echo "请确保已执行 npm run pkg:linux 生成了可执行文件"
    exit 1
fi

chmod +x "$SCRIPT_DIR/dist/km-portal-linux"
chmod +x "$SCRIPT_DIR/deploy-server.sh"

echo ">>> 检查服务进程..."
if pgrep -f "km-portal-linux" > /dev/null; then
    echo ">>> 发现旧进程，正在重启..."
    pkill -f "km-portal-linux"
    sleep 2
else
    echo ">>> 无旧进程，直接启动"
fi

echo ">>> 启动后端服务..."
PORT=5053 nohup "$SCRIPT_DIR/dist/km-portal-linux" > server.log 2>&1 &
sleep 3

if pgrep -f "km-portal-linux" > /dev/null; then
    echo "=== 部署成功，服务运行中 ==="
    echo "PID: $(pgrep -f 'km-portal-linux')"
    echo "健康检查: http://localhost:5053/api/health"
    echo "日志: $SCRIPT_DIR/server.log"

    if curl -s http://localhost:5053/api/health | grep -q "ok"; then
        echo "✅ 服务健康检查通过"
    else
        echo "⚠️ 服务可能未正常启动，请检查日志"
    fi
else
    echo "=== 部署失败，请检查日志 ==="
    echo "tail -50 server.log"
    exit 1
fi