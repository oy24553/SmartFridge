# Backend (Django + DRF)

## 本地开发
1. Python 3.11+，进入目录并创建虚拟环境：
   - macOS/Linux: `python -m venv .venv && source .venv/bin/activate`
   - Windows: `py -m venv .venv && .venv\\Scripts\\activate`
2. 安装依赖：`pip install -r requirements.txt`
3. 生成环境文件：复制 `.env.example` 为 `.env` 并填写。
4. 初始化项目（待生成后可用）：`python manage.py migrate && python manage.py runserver`

## 依赖
- Django 5、Django REST Framework
- SimpleJWT、django-cors-headers
- drf-spectacular（API 文档）
- psycopg（可选，生产使用 Postgres）
