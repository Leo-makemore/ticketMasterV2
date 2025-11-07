# 项目配置说明

## 环境变量配置

### 后端配置 (`.env` 文件在项目根目录)

创建或编辑 `.env` 文件，添加以下内容：

```bash
# Ticketmaster API Key (必需)
TM_API_KEY=你的_ticketmaster_api_key

# Google Geocoding API Key (可选，用于地名转经纬度和反向地理编码)
GOOGLE_API_KEY=你的_google_geocoding_key

# IPInfo Token (可选，用于自动检测位置，如果使用 static/index.html)
IPINFO_TOKEN=你的_ipinfo_token

# CORS 配置 (可选，限制前端域名)
CORS_ORIGINS=http://localhost:3000
```

### 前端配置 (`frontend/.env.local` 文件)

创建或编辑 `frontend/.env.local` 文件，添加以下内容：

```bash
# 后端 API 地址
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

## 如何获取 API Keys

### 1. Ticketmaster API Key
1. 访问 [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. 注册账号并创建应用
3. 获取 API Key

### 2. Google Geocoding API Key
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目或选择现有项目
3. 启用 **Geocoding API**
4. 创建凭据 > API Key
5. 复制 API Key

### 3. IPInfo Token (可选)
1. 访问 [IPInfo](https://ipinfo.io/)
2. 注册账号并获取 API Token
3. 用于自动检测用户位置功能（仅在 static/index.html 中使用）

## 数据存储位置

### Favorites (收藏)
- **存储位置**：浏览器的 `localStorage`
- **存储键**：`tmv2:favorites`
- **存储格式**：JSON 对象
- **首次添加提示**：用户首次添加收藏时，会显示一个对话框说明收藏数据存储在浏览器本地
- **查看方式**：
  1. 打开浏览器开发者工具 (F12)
  2. 转到 Application/存储 标签
  3. 找到 Local Storage
  4. 查看 `tmv2:favorites` 键的值

### 最近搜索
- **存储位置**：浏览器的 `localStorage`
- **存储键**：`tmv2:recent`
- **存储格式**：JSON 数组

## 启动项目

### 1. 安装依赖

**后端**：
```bash
# 创建虚拟环境（如果还没有）
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate  # macOS/Linux
# 或
.venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt
```

**前端**：
```bash
cd frontend
npm install
```

### 2. 配置环境变量

按照上面的说明配置 `.env` 和 `frontend/.env.local` 文件。

### 3. 启动服务

**后端**（在项目根目录）：
```bash
python main.py
```
后端将在 `http://localhost:8080` 运行

**前端**（在 `frontend` 目录）：
```bash
npm run dev
```
前端将在 `http://localhost:3000` 运行

## 常见问题

### 反向地理编码不工作

**原因**：
- 没有配置 `GOOGLE_API_KEY` 环境变量

**解决方法**：
- 在 `.env` 文件中添加 `GOOGLE_API_KEY=你的_google_api_key`
- 重启后端服务器

