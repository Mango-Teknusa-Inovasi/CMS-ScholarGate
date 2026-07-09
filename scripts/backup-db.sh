#!/usr/bin/env bash
# Backup database Scholargate (PostgreSQL / MySQL) dari backend/.env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/backend/.env"
OUT_DIR="${ROOT}/backups"
STAMP="$(date +%Y%m%d_%H%M%S)"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Missing $ENV_FILE" >&2
  exit 1
fi

# shellcheck disable=SC1090
set -a
# parse KEY=VAL without sourcing full file (avoid special chars issues)
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
FILE="${OUT_DIR}/scholargate_${DB_DATABASE}_${STAMP}"

case "${DB_CONNECTION}" in
  pgsql|postgres|postgresql)
    export PGPASSWORD="${DB_PASSWORD}"
    FILE="${FILE}.sql.gz"
    echo "Backing up PostgreSQL ${DB_DATABASE}@${DB_HOST}:${DB_PORT:-5432} → ${FILE}"
    pg_dump -h "${DB_HOST:-127.0.0.1}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" \
      --no-owner --no-acl | gzip > "${FILE}"
    ;;
  mysql|mariadb)
    FILE="${FILE}.sql.gz"
    echo "Backing up MySQL ${DB_DATABASE}@${DB_HOST}:${DB_PORT:-3306} → ${FILE}"
    mysqldump -h "${DB_HOST:-127.0.0.1}" -P "${DB_PORT:-3306}" -u "${DB_USERNAME}" \
      ${DB_PASSWORD:+-p"${DB_PASSWORD}"} \
      --single-transaction --routines --triggers "${DB_DATABASE}" | gzip > "${FILE}"
    ;;
  *)
    echo "Unsupported DB_CONNECTION=${DB_CONNECTION}" >&2
    exit 1
    ;;
esac

ls -lh "${FILE}"
echo "OK: ${FILE}"
