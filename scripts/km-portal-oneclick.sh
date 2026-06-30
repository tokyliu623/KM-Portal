#!/bin/bash
# ============================================================
# KM-Portal 服务器一键启动（v1.9.0 + GitLab main 分支）
# ============================================================
# 用途:
#   - 用户只需在服务器上执行本脚本一次
#   - 包含: 环境预检 + 仓库同步 + .env 恢复 + 部署 + 验证 + 清理
#   - 失败有清晰提示，可重复执行
#
# 用法（在服务器上）:
#   bash /tmp/km-portal-oneclick.sh
#
# 特点:
#   - 幂等: 可重复执行，重复执行 = 重新拉取最新代码并重启
#   - 自检: 端口占用 / 网络 / .env 都有明确报错
#   - 回滚: 启动失败时显示 server.log 最后 30 行
# ============================================================
set -e

REPO_DIR="${REPO_DIR:-/data/KM-Portal}"
BRANCH="${BRANCH:-main}"
SERVICE_PORT="${SERVICE_PORT:-5053}"
REMOTE="${REMOTE:-origin}"
EXPECTED_BIN_SIZE=40000000

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()  { echo -e "${GREEN}[$(date +%H:%M:%S)]${NC} ▶ $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
fail() { echo -e "${RED}[FAIL]${NC} $1"; }
info() { echo -e "${BLUE}[INFO]${NC} $1"; }

# ==================== 步骤 0: 用户确认 ====================
echo "=========================================="
echo "  KM-Portal v1.9.0 服务器一键启动"
echo "=========================================="
echo "  部署路径:   $REPO_DIR"
echo "  Git 分支:   $BRANCH"
echo "  远程:       $REMOTE (gitlab.vmic.xyz)"
echo "  服务端口:   $SERVICE_PORT"
echo "=========================================="
echo ""

# ==================== 步骤 1: 环境预检 ====================
log "步骤 1/6: 环境预检"

# 1.1 git 可用
if ! command -v git >/dev/null 2>&1; then
    fail "git 命令未找到，请先安装 git"
    exit 1
fi
info "  ✓ git: $(git --version | head -1)"

# 1.2 root 用户（部署脚本需要写权限）
if [ "$(id -u)" != "0" ]; then
    fail "请用 root 用户执行（当前 uid=$(id -u)）"
    exit 1
fi
info "  ✓ 当前用户: root"

# 1.3 仓库目录
if [ ! -d "$REPO_DIR" ]; then
    fail "目录 $REPO_DIR 不存在"
    info "  请先执行: cd /data && git clone https://gitlab.vmic.xyz/11033406/km-portal.git KM-Portal && cd KM-Portal && git checkout $BRANCH"
    exit 1
fi
cd "$REPO_DIR"
info "  ✓ 仓库目录: $REPO_DIR"

# 1.4 网络可达
if ! curl -fsS --max-time 10 https://gitlab.vmic.xyz > /dev/null 2>&1; then
    fail "gitlab.vmic.xyz 不可达，请检查网络"
    exit 1
fi
info "  ✓ 网络可达 gitlab.vmic.xyz"

# 1.5 端口空闲
if command -v lsof >/dev/null 2>&1; then
    if lsof -i:"$SERVICE_PORT" > /dev/null 2>&1; then
        warn "端口 $SERVICE_PORT 已被占用，将终止旧进程"
        pkill -9 -f km-portal-linux 2>/dev/null || true
        sleep 3
        if lsof -i:"$SERVICE_PORT" > /dev/null 2>&1; then
            fail "端口 $SERVICE_PORT 仍被占用（PID: $(lsof -ti:$SERVICE_PORT)），请手动处理"
            exit 1
        fi
    fi
elif command -v ss >/dev/null 2>&1; then
    if ss -ltn | grep -q ":$SERVICE_PORT "; then
        warn "端口 $SERVICE_PORT 已被占用（ss 检测），将终止旧进程"
        pkill -9 -f km-portal-linux 2>/dev/null || true
        sleep 3
    fi
fi
info "  ✓ 端口 $SERVICE_PORT 空闲"

# 1.6 git 配置
git config --global --add safe.directory "$REPO_DIR" 2>/dev/null || true
git config --global http.postBuffer 524288000
info "  ✓ git safe.directory + postBuffer 已配"

# ==================== 步骤 2: 同步代码 ====================
log "步骤 2/6: 同步代码到 $BRANCH"

chown -R root:root .git 2>/dev/null || true
chmod -R u+rwX .git 2>/dev/null || true
rm -f .git/index.lock FETCH_HEAD

for i in 1 2 3 4 5; do
    if git fetch "$REMOTE" "$BRANCH" 2>&1 | tail -3; then
        log "  ✓ git fetch 成功（尝试 $i/5）"
        break
    fi
    warn "  git fetch 失败，等待 15s 重试（$i/5）"
    sleep 15
    if [ $i -eq 5 ]; then
        fail "git fetch 5 次均失败，中止"
        exit 1
    fi
done

CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "DETACHED")
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    warn "  当前分支: $CURRENT_BRANCH，切换到 $BRANCH"
    git checkout "$BRANCH" 2>&1 | tail -3
fi
git reset --hard "$REMOTE/$BRANCH"
LOCAL_HEAD=$(git rev-parse --short HEAD)
REMOTE_HEAD=$(git rev-parse --short "$REMOTE/$BRANCH")
if [ "$LOCAL_HEAD" != "$REMOTE_HEAD" ]; then
    fail "本地 HEAD=$LOCAL_HEAD 与 $REMOTE/$BRANCH=$REMOTE_HEAD 不一致"
    exit 1
fi
info "  ✓ HEAD=$LOCAL_HEAD ($(git log -1 --oneline))"

# ==================== 步骤 3: 准备 .env ====================
log "步骤 3/6: 准备 .env 凭证文件"

if [ ! -f ".env" ]; then
    warn "  .env 缺失，从 .env.example 生成"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        log "  ✓ 已从 .env.example 生成 .env"
        warn "  ⚠  提示: .env.example 包含共享 LLM 密钥，Skill 翻译可工作"
        warn "  ⚠  如需修改 KM_API_BASE_URL / TOKEN，请编辑 .env 后重启"
    else
        fail "  .env.example 不存在，无法生成 .env"
        exit 1
    fi
else
    info "  ✓ .env 已存在"
fi
chmod 644 .env
info "  ✓ .env 权限 644"

# ==================== 步骤 4: 准备二进制 ====================
log "步骤 4/6: 准备 KM-Portal 二进制"

if [ ! -f "dist/km-portal-linux" ]; then
    fail "  dist/km-portal-linux 不存在（需要先在 Windows 本地构建并 push）"
    info "  本地构建: npm run pkg:linux"
    info "  推送: git add dist/km-portal-linux && git commit && git push"
    exit 1
fi
KM_SIZE=$(stat -c%s "dist/km-portal-linux" 2>/dev/null || stat -f%z "dist/km-portal-linux" 2>/dev/null)
if [ "$KM_SIZE" -lt "$EXPECTED_BIN_SIZE" ]; then
    fail "  km-portal-linux 大小异常: $KM_SIZE bytes（期望 40MB+）"
    exit 1
fi
chmod +x dist/km-portal-linux
info "  ✓ dist/km-portal-linux: $KM_SIZE bytes (~$(($KM_SIZE/1024/1024))MB)"

# ==================== 步骤 5: 启动服务 ====================
log "步骤 5/6: 启动 KM-Portal 服务（端口 $SERVICE_PORT）"

pkill -9 -f km-portal-linux 2>/dev/null || true
sleep 2

# 显式 source .env 注入凭证（dotenv 也会读，但显式更稳）
set -a
. ./.env
set +a

nohup ./dist/km-portal-linux > server.log 2>&1 &
SERVICE_PID=$!
log "  ✓ 服务已启动, PID=$SERVICE_PID"

# 等待就绪（最多 20s）
log "  等待服务就绪..."
READY=0
for i in 1 2 3 4 5 6 7 8 9 10; do
    sleep 2
    if curl -fsS "http://127.0.0.1:$SERVICE_PORT/api/health" > /tmp/km-health.json 2>/dev/null; then
        VERSION=$(grep -o '"version":"[^"]*"' /tmp/km-health.json | head -1 || echo "")
        log "  ✓ 服务就绪 $VERSION（第 $((i*2))s）"
        READY=1
        break
    fi
    echo -n "."
done
echo ""

if [ "$READY" != "1" ]; then
    fail "  服务 20s 内未就绪，日志末尾："
    tail -30 server.log
    exit 1
fi

# ==================== 步骤 6: 验证 + 清理 ====================
log "步骤 6/6: 验证 v1.9.0 部署 + 清理旧引用"

# 6.1 翻译探针
echo ""
echo "── 翻译探针 ──"
curl -fsS "http://127.0.0.1:$SERVICE_PORT/api/diag/translate-health" 2>&1 || warn "翻译探针失败"
echo ""

# 6.2 端到端验证
if command -v python3 >/dev/null 2>&1; then
    echo ""
    echo "── 端到端验证 ──"
    python3 scripts/verify-all-v190.py 2>&1 | tail -30 || warn "端到端验证失败（可手动跑：python3 scripts/verify-all-v190.py）"
elif command -v python >/dev/null 2>&1; then
    echo ""
    echo "── 端到端验证 ──"
    python scripts/verify-all-v190.py 2>&1 | tail -30 || warn "端到端验证失败"
else
    warn "python 未安装，跳过端到端验证"
fi

# 6.3 清理旧 master 引用
git remote set-head "$REMOTE" main 2>/dev/null || true
git remote prune "$REMOTE" 2>/dev/null || true

# ==================== 总结 ====================
echo ""
echo "=========================================="
log "✅ KM-Portal v1.9.0 部署完成"
echo "  PID:        $SERVICE_PID"
echo "  Port:       $SERVICE_PORT"
echo "  Health:     http://127.0.0.1:$SERVICE_PORT/api/health"
echo "  Translate:  http://127.0.0.1:$SERVICE_PORT/api/diag/translate-health"
echo "  Server log: $REPO_DIR/server.log"
echo "=========================================="
echo ""
echo "常用命令:"
echo "  tail -f $REPO_DIR/server.log                    # 实时日志"
echo "  curl http://127.0.0.1:$SERVICE_PORT/api/health  # 健康检查"
echo "  pkill -9 -f km-portal-linux && cd $REPO_DIR && set -a && . ./.env && set +a && PORT=$SERVICE_PORT nohup ./dist/km-portal-linux > server.log 2>&1 &"
echo "=========================================="
