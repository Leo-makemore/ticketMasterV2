# 运行说明 / How to Run

## 前置要求 / Prerequisites

- Python 3.11+ (已包含 venv)
- Node.js 18+ 和 npm
- Ticketmaster API Key (在 `.env` 中配置)

## 后端启动 / Backend Setup

1. 激活虚拟环境并安装依赖：
```bash
cd "/Users/leo/Documents/csci 571/ticketmasterV2"
source .venv/bin/activate
pip install -r requirements.txt
```

2. 创建 `.env` 文件（如果不存在）：
```bash
# .env
TM_API_KEY=你的_ticketmaster_api_key
GOOGLE_API_KEY=你的_google_geocoding_key  # 可选，用于地名转经纬度
CORS_ORIGINS=http://localhost:3000  # 可选，限制前端域名
```

3. 启动后端服务器：
```bash
python main.py
```

后端将在 `http://localhost:8080` 运行

## 前端启动 / Frontend Setup

1. 进入前端目录并安装依赖：
```bash
cd "/Users/leo/Documents/csci 571/ticketmasterV2/frontend"
npm install
```

2. 创建 `.env.local` 文件：
```bash
# frontend/.env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

3. 启动开发服务器：
```bash
npm run dev
```

前端将在 `http://localhost:3000` 运行

## 测试流程 / Testing

1. **确保后端运行**：访问 `http://localhost:8080/api/health` 应返回 `{"status":"ok"}`

2. **访问前端**：
   - 首页：`http://localhost:3000`
   - 搜索页：`http://localhost:3000/search`
   - 健康检查：`http://localhost:3000/health`

3. **测试搜索功能**：
   - 在首页输入关键词（如 "music"）
   - 选择位置（城市或使用当前位置）
   - 点击 Search 或使用快捷标签
   - 查看搜索结果卡片

4. **测试新功能**：
   - **搜索建议**：在搜索页面的关键词输入框输入时，会显示建议下拉（热门+最近搜索）
   - **收藏功能**：点击卡片右上角的心形图标
   - **分享功能**：点击卡片右下角的 Share 按钮
   - **最近搜索**：在首页会显示最近搜索的快捷标签

## 常见问题 / Troubleshooting

- **后端无法启动**：检查 `.env` 中是否配置了 `TM_API_KEY`
- **前端无法连接后端**：确认 `frontend/.env.local` 中的 `NEXT_PUBLIC_API_BASE_URL` 正确
- **搜索无结果**：检查后端日志，确保 API Key 有效
- **CORS 错误**：确认后端已安装 `flask-cors` 并在 `main.py` 中启用

## 开发模式 / Development

- 后端：修改代码后需重启 `python main.py`
- 前端：Next.js 支持热重载，修改代码后自动刷新

## 生产部署 / Production

- 后端：使用 `gunicorn` 部署（见 `app.yaml`）
- 前端：运行 `npm run build` 后部署到 Vercel/Netlify 等平台

