# SmartPantry AI (SmartFridge)

一个采用 Django + DRF（后端）与 React + Vite（前端）的全栈项目骨架，用于实现电子储藏柜/冰箱管理与 AI 辅助菜单/购物清单。

## 目录结构
- `backend/` — Django 5 + DRF 服务（JWT、CORS、OpenAI 调用封装）
- `frontend/` — React 18 + Vite + Tailwind 应用
- `docs/` — 设计与接口文档

## 快速开始（路线图）
1) 初始化后端：创建虚拟环境、安装 `requirements.txt`，启动空项目和健康检查接口。
2) 接入 JWT、CORS 与环境变量（`.env`）。
3) 初始化前端脚手架（Vite），完成登录页与库存列表占位。
4) 打通首个端到端流程：录入食材 → 获取低库/临期提醒 → 生成 AI 菜谱/购物建议（后端先提供占位 API）。

## 环境变量
参考根目录 `.env.example` 与 `backend/.env.example`。

## 运行（预期）
- 后端：`cd backend && python -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && python manage.py runserver`
- 前端：`cd frontend && npm i && npm run dev`

> 本仓库当前只包含目录与说明。下一步会逐步生成后端与前端脚手架。
