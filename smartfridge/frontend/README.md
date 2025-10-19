# SmartPantry Frontend (Vite + React + Tailwind)

## 开发
- 复制 `.env.local.example` 为 `.env.local` 并设置 `VITE_API_BASE_URL`。
- 安装依赖并启动：
  - `npm i`
  - `npm run dev`

## 结构
- `src/lib/apiClient.js` — Axios 客户端，支持 JWT 刷新与重试。
- `src/lib/auth.js` — 令牌存储（Zustand）。
- `src/pages/Login.jsx` — 登录页，调用 `/api/auth/jwt/create/`。
- `src/pages/Inventory.jsx` — 库存列表，调用 `/api/v1/inventory/items/`。

> 默认受保护路由：未登录会跳转到 `/login`。
