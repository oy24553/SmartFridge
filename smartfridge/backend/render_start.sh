#!/usr/bin/env bash
set -euo pipefail

# Render sets $PORT. Default to 8000 for local runs.
: "${PORT:=8000}"

# Some managed Postgres providers (or cold starts) can briefly refuse/close
# connections. Since our Render start command runs migrations, we retry here
# to avoid the service crash-looping on transient DB errors.
: "${MIGRATE_RETRIES:=12}"
: "${MIGRATE_RETRY_DELAY_SECONDS:=5}"

attempt=1
while true; do
  echo "[render_start] Running migrations (attempt ${attempt}/${MIGRATE_RETRIES})..."
  if python manage.py migrate --noinput; then
    echo "[render_start] Migrations complete."
    break
  fi

  if [ "${attempt}" -ge "${MIGRATE_RETRIES}" ]; then
    echo "[render_start] Migrations failed after ${attempt} attempts."
    exit 1
  fi

  echo "[render_start] Migrations failed; retrying in ${MIGRATE_RETRY_DELAY_SECONDS}s..."
  sleep "${MIGRATE_RETRY_DELAY_SECONDS}"
  attempt=$((attempt + 1))
done

echo "[render_start] Starting gunicorn on 0.0.0.0:${PORT}..."
exec gunicorn server.wsgi:application \
  --bind "0.0.0.0:${PORT}" \
  --workers "${WEB_CONCURRENCY:-2}" \
  --timeout "${GUNICORN_TIMEOUT:-120}" \
  --access-logfile "-" \
  --error-logfile "-"
