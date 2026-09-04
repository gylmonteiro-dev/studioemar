#!/bin/sh
# Entrypoint da API: aplica as migrations pendentes e sobe o Nest.
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[api] aplicando migrations"
  cd /repo/apps/api
  ./node_modules/.bin/prisma migrate deploy
fi

cd /repo
echo "[api] iniciando NestJS na porta ${PORT:-3001}"
exec node apps/api/dist/main.js
