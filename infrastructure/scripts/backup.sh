#!/usr/bin/env bash
# Dump lógico do PostgreSQL de produção, comprimido e com expurgo por idade.
set -euo pipefail

INFRA_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE_FILE="$INFRA_DIR/docker-compose.prod.yml"
ENV_FILE="$INFRA_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "erro: $ENV_FILE não encontrado (copie de .env.example)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

BACKUP_DIR="${BACKUP_DIR:-./backups}"
case "$BACKUP_DIR" in
  /*) ;;
  *) BACKUP_DIR="$INFRA_DIR/${BACKUP_DIR#./}" ;;
esac
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
TARGET="$BACKUP_DIR/${POSTGRES_DB}-${STAMP}.sql.gz"

echo "[backup] gerando $TARGET"
# O arquivo parcial fica com sufixo até o dump terminar, para nunca
# confundir um backup interrompido com um válido.
docker compose -f "$COMPOSE_FILE" exec -T postgres \
  pg_dump --clean --if-exists --username "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip -9 > "$TARGET.partial"
mv "$TARGET.partial" "$TARGET"

echo "[backup] expurgando dumps com mais de $RETENTION_DAYS dias"
find "$BACKUP_DIR" -name "${POSTGRES_DB}-*.sql.gz" -type f \
  -mtime "+$RETENTION_DAYS" -print -delete

echo "[backup] concluído: $(du -h "$TARGET" | cut -f1) em $TARGET"
