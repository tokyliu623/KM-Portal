#!/bin/bash
# ============================================================
# KM-Portal v1.9.0 一键部署脚本（用户自行执行）
# ============================================================
# 用途:
#   - 部署 v1.9.0 一站式知识运营管理中台
#   - 规避 v1.7.5 五大漏洞（dubious ownership / .git 权限 / .env 权限 / 网络超时 / 旧进程残留）
#   - 部署后自动跑 verify-all-v190.py 验证
#
# 使用:
#   # 服务器 root 用户
#   cd /data/KM-Portal
#   bash scripts/deploy-server-v190.sh
#
# 必备:
#   - /data/KM-Portal 仓库（已 git pull 或即将拉取）
#   - .env 文件存在（KM_API_KEY 已配置）
#   - 端口 5053 空闲
#   - 网络可达 github.com:443
# ============================================================
set -e

REPO_DIR="${REPO_DIR:-/data/KM-Portal}"
BRANCH="${BRANCH:-main}"
SERVICE_PORT="${SERVICE_PORT:-5053}"
LOG_DIR="${LOG_DIR:-$REPO_DIR}"
BACKUP_DIR="${BACKUP_DIR:-$REPO_DIR/data/.backup-deploy-$(date +%Y%m%d-%H%M%S)}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_step() {
    echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ▶ $1"
}
log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}
log_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# ==================== 漏洞 1: dubious ownership ====================
log_step "规避漏洞 1/5: dubious ownership"
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
git config --global http.postBuffer 524288000
log_step "  ✓ safe.directory + postBuffer 已配"

# ==================== 漏洞 5: 网络可达性预检 ====================
log_step "规避漏洞 5/5: 网络可达性预检"
if ! curl -fsS --max-time 10 https://github.com > /dev/null 2>&1; then
    log_warn "github.com 网络不可达,稍后重试 (3 次)"
    for i in 1 2 3; do
        sleep 10
        if curl -fsS --max-time 10 https://github.com > /dev/null 2>&1; then
            log_step "  ✓ 第 $i 次重试网络可达"
            break
        fi
    done
    if ! curl -fsS --max-time 10 https://github.com > /dev/null 2>&1; then
        log_fail "github.com 持续不可达,中止部署"
        exit 1
    fi
else
    log_step "  ✓ github.com 可达"
fi

# ==================== 进入仓库 ====================
cd "$REPO_DIR" || { log_fail "无法进入 $REPO_DIR"; exit 1; }
log_step "当前目录: $REPO_DIR"

# ==================== 备份 data (避免部署丢失) ====================
log_step "[新功能] 备份 data/ 目录到 $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"
for f in tokens.json skills.json api-logs.json api-keys.json operation-stats.json; do
    if [ -f "data/$f" ]; then
        cp "data/$f" "$BACKUP_DIR/$f.bak"
        log_step "  ✓ 备份 data/$f"
    fi
done

# ==================== 漏洞 2: .git 写权限 ====================
log_step "规避漏洞 2/5: .git 写权限"
chown -R $(whoami):$(whoami) .git 2>/dev/null || true
chmod -R u+rwX .git 2>/dev/null || true

# ==================== 漏洞 3: 清理 .git 锁定 ====================
log_step "规避漏洞 3/5: 清理 .git 锁"
rm -f .git/index.lock FETCH_HEAD

# ==================== 漏洞 4: 网络超时 - git pull 重试 ====================
log_step "规避漏洞 4/5: git pull 多次重试"
for i in 1 2 3 4 5; do
    if git fetch origin "$BRANCH" 2>&1 | tail -3; then
        log_step "  ✓ git fetch 成功 (尝试 $i)"
        break
    fi
    log_warn "  git fetch 失败,等待 15s 后重试 (尝试 $i/5)"
    sleep 15
    if [ $i -eq 5 ]; then
        log_fail "git fetch 5 次均失败,中止"
        exit 1
    fi
done
git reset --hard "origin/$BRANCH"
log_step "  ✓ git reset --hard origin/$BRANCH 完成"

# ==================== 验证 v1.9.0 产物 ====================
log_step "验证 v1.9.0 部署产物"
if [ ! -f "dist/km-portal-linux" ]; then
    log_fail "dist/km-portal-linux 不存在,需要本地构建并 push"
    exit 1
fi
KM_SIZE=$(stat -c%s "dist/km-portal-linux" 2>/dev/null || stat -f%z "dist/km-portal-linux" 2>/dev/null)
if [ "$KM_SIZE" -lt 40000000 ]; then
    log_fail "km-portal-linux 大小异常: $KM_SIZE bytes (期望 40MB+)"
    exit 1
fi
log_step "  ✓ km-portal-linux: $KM_SIZE bytes (~$(($KM_SIZE/1024/1024))MB)"

if [ ! -f ".env" ]; then
    log_warn ".env 不存在,将跳过凭证注入（服务可能 MISSING API key）"
else
    log_step "  ✓ .env 存在"
    # 漏洞: .env 权限
    chmod 644 .env
    log_step "  ✓ .env 权限 644"
fi

# ==================== 漏洞 5: 旧进程残留 ====================
log_step "规避漏洞 5/5: 旧进程清理"
pkill -9 -f km-portal-linux 2>/dev/null || true
sleep 3
# 端口空闲检查
if command -v lsof >/dev/null 2>&1; then
    if lsof -i:"$SERVICE_PORT" > /dev/null 2>&1; then
        log_fail "端口 $SERVICE_PORT 仍被占用,无法部署"
        lsof -i:"$SERVICE_PORT" || true
        exit 1
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -q ":$SERVICE_PORT "; then
        log_fail "端口 $SERVICE_PORT 仍被占用"
        exit 1
    fi
fi
log_step "  ✓ 端口 $SERVICE_PORT 空闲"

# ==================== 启动服务 (dotenv 自动加载) ====================
log_step "启动 KM-Portal 服务 (端口 $SERVICE_PORT)"
chmod +x dist/km-portal-linux
cd "$REPO_DIR"
# 关键: 启动时 cwd 必须是仓库根,这样 dotenv.config() 才能找到 .env
nohup ./dist/km-portal-linux > "$LOG_DIR/server.log" 2>&1 &
SERVICE_PID=$!
log_step "  ✓ 服务已启动, PID=$SERVICE_PID"

# 等待就绪
log_step "等待服务就绪 (心跳检查)..."
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 2
    if curl -fsS "http://127.0.0.1:$SERVICE_PORT/api/health" > /tmp/km-health.json 2>/dev/null; then
        VERSION=$(grep -o '"version":"[^"]*"' /tmp/km-health.json | head -1)
        log_step "  ✓ 服务就绪 $VERSION (第 $((i*2))s)"
        break
    fi
    if [ $i -eq 10 ]; then
        log_fail "服务 20s 内未就绪,日志末尾:"
        tail -30 "$LOG_DIR/server.log" || true
        exit 1
    fi
    echo -n "."
done
echo ""

# ==================== 启动后自检 ====================
log_step "启动后自检: 跑 verify-all-v190.py"
if command -v python3 >/dev/null 2>&1; then
    python3 scripts/verify-all-v190.py || {
        log_warn "verify-all-v190.py 失败,查看日志"
        tail -50 "$LOG_DIR/server.log"
    }
elif command -v python >/dev/null 2>&1; then
    python scripts/verify-all-v190.py || {
        log_warn "verify-all-v190.py 失败"
    }
else
    log_warn "python 未安装,跳过端到端验证 (请手动跑 verify-all-v190.py)"
fi

# ==================== 总结 ====================
echo ""
echo "============================================"
log_step "✅ v1.9.0 部署完成"
echo "  PID:           $SERVICE_PID"
echo "  Port:          $SERVICE_PORT"
echo "  Health:        http://127.0.0.1:$SERVICE_PORT/api/health"
echo "  Server log:    $LOG_DIR/server.log"
echo "  Data backup:   $BACKUP_DIR"
echo ""
echo "  常用命令:"
echo "    ps -p $SERVICE_PID              # 查看进程"
echo "    tail -f $LOG_DIR/server.log     # 实时日志"
echo "    curl http://127.0.0.1:$SERVICE_PORT/api/health   # 健康检查"
echo "    python3 scripts/verify-all-v190.py                # 端到端验证"
echo "============================================"
