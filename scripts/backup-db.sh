#!/usr/bin/env bash
# Backup database Scholargate (PostgreSQL / MySQL) dari .env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
OUT_DIR="${ROOT}/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

get_env() {
  local key="$1"
  grep -E "^${key}=" "$ENV_FILE" | tail -n1 | cut -d= -f2- | sed 's/^"//;s/"$//'
}

DB_CONNECTION="$(get_env DB_CONNECTION)"
DB_HOST="$(get_env DB_HOST)"
DB_PORT="$(get_env DB_PORT)"
DB_DATABASE="$(get_env DB_DATABASE)"
DB_USERNAME="$(get_env DB_USERNAME)"
DB_PASSWORD="$(get_env DB_PASSWORD)"

mkdir -p "$OUT_DIR"

case "${DB_CONNECTION:-pgsql}" in
  pgsql|postgres|postgresql)
    DB_PORT="${DB_PORT:-5432}"
    OUT="${OUT_DIR}/scholargate_${STAMP}.sql.gz"
    echo "PostgreSQL dump → $OUT"
    PGPASSWORD="$DB_PASSWORD" pg_dump \
      -h "${DB_HOST:-127.0.0.1}" \
      -p "$DB_PORT" \
      -U "$DB_USERNAME" \
      -d "$DB_DATABASE" \
      --no-owner --no-acl | gzip > "$OUT"
    ;;
  mysql|mariadb)
    DB_PORT="${DB_PORT:-3306}"
    OUT="${OUT_DIR}/scholargate_${STAMP}.sql.gz"
    echo "MySQL dump → $OUT"
    mysqldump \
      -h "${DB_HOST:-127.0.0.1}" \
      -P "$DB_PORT" \
      -u "$DB_USERNAME" \
      -p"$DB_PASSWORD" \
      "$DB_DATABASE" | gzip > "$OUT"
    ;;
  *)
    echo "Unsupported DB_CONNECTION=$DB_CONNECTION" >&2
    exit 1
    ;;
esac

echo "OK: $OUT ($(du -h "$OUT" | cut -f1))"
