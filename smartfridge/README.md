# SmartFridge (SmartPantry AI)

[![Python](https://img.shields.io/badge/Python-3.12-blue?logo=python&logoColor=white)](https://www.python.org/)
[![Django](https://img.shields.io/badge/Django-5.0-success?logo=django&logoColor=white)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Live](https://img.shields.io/badge/Live-App-0EA5E9?logo=vercel&logoColor=white)](https://smart-fridge-xi.vercel.app)
[![API Docs](https://img.shields.io/badge/API-docs-10B981?logo=swagger&logoColor=white)](https://smart-fridge-xi.vercel.app/api/docs)
[![Repo](https://img.shields.io/badge/GitHub-Repo-181717?logo=github&logoColor=white)](https://github.com/oy24553/SmartFridge)

Full‑stack pantry/fridge manager with AI assistance. Django + DRF for the backend, React + Vite for the frontend. Track inventory, low‑stock/near‑expiry, build shopping tasks, generate AI menus, parse free‑text into items, and deduct stock when “cooking”.

UK-first defaults:
- Locale: `en-GB` + `Europe/London`
- Expiry label: `Use by` (near-expiry window: 2 days) and `Best before` (near-expiry window: 5 days)

## Features
- Auth: register/login (JWT); OpenAPI docs.
- Inventory: list/search/filter; qty + unit; min_stock; **expiry label (`Use by`/`Best before`)**; notes; barcode/brand/tags; batch import; quick “+1/−1”; **Quick Add presets (editable + batch add)**.
- Awareness: dashboard low‑stock/near‑expiry (Use by ≤2d, Best before ≤5d); priority list by days‑to‑expiry vs. estimated days‑to‑empty.
- Shopping: tasks CRUD; generate from low‑stock; AI suggestions; one‑click purchase (single/batch); sources (manual/low_stock/ai/plan); grouped view/filters.
- AI:
  - Menu generator (days × meals/day) → structured JSON + shopping diff.
  - Free‑text → items parsing; optional one‑click import.
  - Assistant: “add to shopping / import / suggest”.
  - Shelf‑life: rules first, fallback to model if unknown.
- Cooking: confirm meal → deduct inventory; cook history (list/delete).

## Tech Stack
- Backend: Python 3.12+, Django 5, DRF, SimpleJWT, drf‑spectacular, django‑cors‑headers, dj‑database‑url.
- DB: PostgreSQL.
- Frontend: React 18, Vite, TailwindCSS, Axios, Zustand.

## Structure
```
Project/smartfridge/
  backend/   # Django project (server/, inventory/, accounts/, aiapi/, ai/)
  frontend/  # Vite + React app (src/)
  docs/
```

## Local Development
1) Backend
```
cd Project/smartfridge/backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env   # set values below
python manage.py migrate
python manage.py runserver
```

2) Frontend
```
cd Project/smartfridge/frontend
npm i
cp .env.local.example .env.local  # VITE_API_BASE_URL=http://127.0.0.1:8000
npm run dev
```

## Backend Env Vars
- `DJANGO_SECRET_KEY` (required)
- `DJANGO_DEBUG` (True/False)
- `ALLOWED_HOSTS` (comma list)
- `ALLOWED_ORIGINS` (comma list of frontends)
- `DATABASE_URL` (`sqlite:///db.sqlite3` locally; Postgres in prod)
- `OPENAI_API_KEY`, `OPENAI_MODEL` (e.g. `gpt-4o`), `OPENAI_MAX_OUTPUT_TOKENS`
- `OPENAI_BASE_URL` (optional; for compatible gateways/proxies)
- `SHELF_LIFE_AI_MAX_DAYS` (e.g. 365)

## Frontend Env
- `VITE_API_BASE_URL` = backend origin (no `/api`), e.g. `https://your‑app.onrender.com`

## API Quick Reference (under `/api`)
- Auth: POST `/auth/register/`, `/auth/jwt/create/`, `/auth/jwt/refresh/`
- Health: GET `/v1/health/`
- Inventory: CRUD `/v1/inventory/items/`; POST `/v1/inventory/items/{id}/adjust/`; `/v1/inventory/items/bulk/`; POST `/v1/inventory/items/quick-add/`
- Summary: GET `/v1/inventory/summary/?window_days=14` (near-expiry uses fixed thresholds: Use by ≤2d, Best before ≤5d)
- Shopping: REST `/v1/inventory/shopping/`; generate `/shopping/generate/`; purchase `/shopping/{id}/purchase/`; batch `/shopping/purchase-batch/`
- AI: POST `/v1/ai/menu/`, `/v1/ai/parse-items/`, `/v1/ai/parse-items-import/`, `/v1/ai/assistant/`
- Cooking: POST `/v1/inventory/cook/`; GET/DELETE `/v1/inventory/cook-history/`

## Deploy
### Render (Backend)
- Root directory: `Project/smartfridge/backend`
- Build: `pip install -r requirements.txt && pip install gunicorn`
- Start: `bash render_start.sh`
- Env: see above. Prefer Postgres for persistence.

Troubleshooting (Render)
- If the service crash-loops with a Postgres `OperationalError`, check your `DATABASE_URL` and the database status. The start script runs `migrate` first, so DB connectivity issues will prevent boot.

### Vercel (Frontend)
- Env: `VITE_API_BASE_URL=https://<render-domain>` (no `/api`)
- Redeploy after env changes.

## Roadmap
- Household & preferences, unit conversions, Celery reminders, AI call metrics dashboard.

## Demo Mode
- Click "Login as Demo User" on the login page to enter instantly.
- Endpoint (issues tokens): `POST /api/auth/demo-token/`.
- Defaults (override in Django settings or env): `DEMO_USERNAME=demo`, `DEMO_PASSWORD=123456`, `DEMO_EMAIL=demo@example.com`.
