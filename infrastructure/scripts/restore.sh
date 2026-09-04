#!/usr/bin/env bash
# Restaura um dump gerado por backup.sh. Sobrescreve os dados atuais.
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$INFRA_DIR/docker-compose.prod.yml"
ENV_FILE="$INFRA_DIR/.env"

DUMP="${1:-}"
if [ -z "$DUMP" ]; then
  echo "uso: $0 caminho/do/dump.sql.gz" >&2
  exit 1
fi
if [ ! -f "$DUMP" ]; then
  echo "erro: $DUMP não encontrado" >&2
  exit 1
fi
if [ ! -f "$ENV_FILE" ]; then
  echo "erro: $ENV_FILE não encontrado (copie de .env.example)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

echo "Isto sobrescreve o banco '$POSTGRES_DB' com $DUMP."
read -r -p "Digite RESTAURAR para confirmar: " CONFIRM
if [ "$CONFIRM" != "RESTAURAR" ]; then
  echo "cancelado"
  exit 1
fi

# A API precisa estar parada: o dump derruba e recria as tabelas.
echo "[restore] parando a API"
docker compose -f "$COMPOSE_FILE" stop api

echo "[restore] aplicando $DUMP"
gunzip -c "$DUMP" | docker compose -f "$COMPOSE_FILE" exec -T postgres \
  psql --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" --set ON_ERROR_STOP=on

echo "[restore] subindo a API"
docker compose -f "$COMPOSE_FILE" start api

echo "[restore] concluído"
