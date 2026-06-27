# KM-Portal 部署指南

## 服务器要求

- Node.js 18+
- Nginx (用于前端静态托管和 API 代理)
- Git

## 部署步骤

### 1. 安装 Node.js (如未安装)

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 验证
node -v  # 应显示 v18.x.x
npm -v
```

### 2. 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt-get install -y nginx
```

### 3. 克隆项目

```bash
cd /opt
sudo git clone https://github.com/tokyliu623/KM-Portal.git
sudo chown -R $USER:$USER KM-Portal
cd KM-Portal
```

### 4. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 根据需要调整
nano .env
```

### 5. 一键部署

```bash
chmod +x deploy.sh
./deploy.sh
```

### 6. 配置 Nginx

```bash
sudo cp nginx.conf.example /etc/nginx/sites-available/km-portal
sudo ln -s /etc/nginx/sites-available/km-portal /etc/nginx/sites-enabled/
# 编辑 /etc/nginx/sites-available/km-portal 修改 server_name 和 root 路径
sudo nginx -t
sudo systemctl reload nginx
```

### 7. 配置 HTTPS (可选但推荐)

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 验证部署

- 后端健康检查: `http://your-domain.com/api/health`
- 前端访问: `http://your-domain.com`

## 常用命令

```bash
# 查看服务状态
pgrep -f "node.*dist/server/index.js"

# 查看日志
tail -f server.log

# 重启服务
pkill -f "node.*dist/server/index.js" && npm start &

# 更新代码后重新部署
./deploy.sh
```

## 目录结构

```
KM-Portal/
├── dist/client/      # 前端构建产物 (Nginx 托管)
├── dist/server/      # 后端构建产物
├── data/             # 数据存储 (tokens.json, skills.json)
├── server.log        # 服务日志
└── deploy.sh         # 部署脚本
```