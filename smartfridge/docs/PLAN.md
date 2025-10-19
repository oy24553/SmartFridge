# 分步实施计划（MVP）

- 阶段 1：仓库结构与后端脚手架
  - 建立 `backend/`、`frontend/` 目录与 README
  - 后端依赖与 Django 项目初始化
  - 健康检查 `/api/v1/health`、CORS、环境变量
- 阶段 2：认证与基础模型
  - `SimpleJWT`，用户/家庭/偏好基础模型
  - 自动 API 文档（drf-spectacular）
- 阶段 3：库存与采购
  - `InventoryItem`、`ConsumptionEvent`、`ShoppingTask` API
- 阶段 4：AI 服务封装
  - OpenAI service + prompt 模板与调用日志
- 阶段 5：前端
  - 登录、库存列表、购物清单、AI 建议面板
- 阶段 6：部署
  - Render/Railway（后端）+ Vercel（前端）+ Managed Postgres
