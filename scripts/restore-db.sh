#!/usr/bin/env bash
# Restore database Scholargate (PostgreSQL / MySQL / MariaDB) dari file dump .sql atau .sql.gz menggunakan .env
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"

if [[ $# -lt 1 ]]; then
  echo "Penggunaan: $0 <path-ke-file-dump.sql[.gz]> [--force]" >&2
  exit 1
fi

DUMP_FILE="$1"
FORCE="${2:-}"

if [[ ! -f "$DUMP_FILE" ]]; then
  echo "File dump tidak ditemukan: $DUMP_FILE" >&2
  exit 1
fi

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

if [[ "$FORCE" != "--force" ]]; then
  echo "PERINGATAN: Tindakan ini akan menimpa data pada database '${DB_DATABASE}' di '${DB_HOST:-127.0.0.1}'!"
  read -r -p "Ketik 'RESTORE' untuk melanjutkan: " CONFIRM
  if [[ "$CONFIRM" != "RESTORE" ]]; then
    echo "Dibatalkan."
    exit 1
  fi
fi

echo "Memulai restore database [${DB_CONNECTION}] dari: ${DUMP_FILE} ..."

case "${DB_CONNECTION:-pgsql}" in
  pgsql|postgres|postgresql)
    DB_PORT="${DB_PORT:-5432}"
    if [[ "$DUMP_FILE" == *.gz ]]; then
      gzip -dc "$DUMP_FILE" | PGPASSWORD="$DB_PASSWORD" psql \
        -h "${DB_HOST:-127.0.0.1}" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$DB_DATABASE"
    else
      PGPASSWORD="$DB_PASSWORD" psql \
        -h "${DB_HOST:-127.0.0.1}" \
        -p "$DB_PORT" \
        -U "$DB_USERNAME" \
        -d "$DB_DATABASE" < "$DUMP_FILE"
    fi
    ;;
  mysql|mariadb)
    DB_PORT="${DB_PORT:-3306}"
    if [[ "$DUMP_FILE" == *.gz ]]; then
      gzip -dc "$DUMP_FILE" | mysql \
        -h "${DB_HOST:-127.0.0.1}" \
        -P "$DB_PORT" \
        -u "$DB_USERNAME" \
        -p"$DB_PASSWORD" \
        "$DB_DATABASE"
    else
      mysql \
        -h "${DB_HOST:-127.0.0.1}" \
        -P "$DB_PORT" \
        -u "$DB_USERNAME" \
        -p"$DB_PASSWORD" \
        "$DB_DATABASE" < "$DUMP_FILE"
    fi
    ;;
  *)
    echo "Unsupported DB_CONNECTION=$DB_CONNECTION" >&2
    exit 1
    ;;
esac

echo "Restore database berhasil diselesaikan."
