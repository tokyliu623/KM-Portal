# KM-Portal 服务器部署方案

> 基于 KM-API 部署经验，针对 GLIBC 版本受限服务器的完整部署方案

## 一、服务器环境分析

### 1.1 当前服务器问题

```
node: /lib64/libm.so.6: version `GLIBC_2.27' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.25' not found (required by node)
node: /lib64/libc.so.6: version `GLIBC_2.28' not found (required by node)
```

**根本原因**：服务器 GLIBC 版本过低（< 2.25），无法运行标准 Node.js 二进制文件。

### 1.2 KM-API 部署经验总结

| 项目 | KM-API | KM-Portal |
|------|--------|-----------|
| 端口 | 5052 | 5053 |
| 编译输出 | `dist/` | `dist/` |
| dist 提交 git | ✅ 是 | ✅ 已修复 |
| 前端构建 | ❌ 无 | ✅ Vite |
| 启动命令 | `node dist/server.js` | `node dist/server/index.js` |

**关键发现**：KM-API 将 `dist/` 目录提交到 git，服务器直接运行预编译代码，无需在服务器编译。

## 二、解决方案：本地预编译 + 服务器运行

**原理**：在本地（Windows）编译后，将 `dist/` 目录和源代码一起推送到 GitHub，服务器直接运行预编译代码。

**优点**：
- 服务器无需编译，不受 GLIBC 版本限制
- 部署速度快
- 与 KM-API 部署方式一致

## 三、服务器部署命令

```bash
# 1. 进入工作目录
cd /data/KM-Portal

# 2. 拉取最新代码
git pull origin master

# 3. 安装生产依赖
npm install --production

# 4. 启动服务
PORT=5053 nohup npm start > server.log 2>&1 &

# 5. 验证服务
sleep 3
curl http://localhost:5053/api/health
```

## 四、一键部署脚本

创建 `deploy-server.sh`：

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== KM-Portal 服务器部署开始 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"

echo ">>> 拉取最新代码..."
git pull origin master

echo ">>> 安装生产依赖..."
npm install --production

echo ">>> 检查服务进程..."
if pgrep -f "node.*dist/server/index.js" > /dev/null; then
    echo ">>> 发现旧进程，正在重启..."
    pkill -f "node.*dist/server/index.js"
    sleep 2
else
    echo ">>> 无旧进程，直接启动"
fi

echo ">>> 启动后端服务..."
PORT=5053 nohup npm start > server.log 2>&1 &
sleep 3

if pgrep -f "node.*dist/server/index.js" > /dev/null; then
    echo "=== 部署成功，服务运行中 ==="
    echo "PID: $(pgrep -f 'node.*dist/server/index.js')"
    echo "健康检查: http://localhost:5053/api/health"
    echo "日志: $SCRIPT_DIR/server.log"
    
    # 验证服务
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
```

## 五、Nginx 配置

```nginx
server {
    listen 80;
    server_name km-portal.vivo.xyz;

    # 前端静态文件
    root /data/KM-Portal/dist/client;
    index index.html;

    # 前端路由 (SPA)
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:5053/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 静态资源缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 六、运维命令

```bash
# 查看服务状态
pgrep -f "node.*dist/server/index.js"

# 查看日志
tail -f /data/KM-Portal/server.log

# 重启服务
cd /data/KM-Portal && ./deploy-server.sh

# 查看端口占用
netstat -tlnp | grep 5053

# 查看 Node.js 版本
node -v
```

## 七、环境变量配置

创建 `.env` 文件：

```bash
PORT=5053
KM_API_BASE_URL=https://wiki.vivo.xyz
TOKEN_STORE_FILE=./data/tokens.json
SKILL_STORE_FILE=./data/skills.json
STATS_STORE_FILE=./data/api-logs.json
```

## 八、故障排查

### 8.1 服务启动失败

```bash
# 查看错误日志
cat server.log

# 检查端口占用
lsof -i :5053

# 手动启动查看错误
node dist/server/index.js
```

### 8.2 前端无法访问

```bash
# 检查 dist/client 目录
ls -la dist/client/

# 检查 Nginx 配置
nginx -t
systemctl reload nginx
```

### 8.3 API 请求失败

```bash
# 检查后端服务
curl http://localhost:5053/api/health

# 检查 Nginx 代理配置
tail -f /var/log/nginx/error.log
```

## 九、部署检查清单

- [ ] 服务器 `git pull` 成功
- [ ] `npm install --production` 成功
- [ ] 服务启动成功 (`pgrep` 确认进程存在)
- [ ] 健康检查通过 (`curl /api/health`)
- [ ] 前端页面可访问
- [ ] API 接口可正常调用

## 十、相关文件清单

```
KM-Portal/
├── dist/                    # 预编译产物（已提交 git）
│   ├── client/              # 前端构建产物
│   └── server/              # 后端编译产物
├── src/                     # 源代码
├── package.json             # 依赖和脚本
├── .env.example             # 环境变量模板
├── deploy.sh                # 传统部署脚本
├── deploy-server.sh         # 服务器部署脚本（新建）
├── nginx.conf.example       # Nginx 配置模板
└── DEPLOY.md                # 部署文档
```