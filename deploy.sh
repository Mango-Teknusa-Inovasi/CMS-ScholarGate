#!/usr/bin/env bash
# =============================================================================
# CMS Scholargate — Docker deploy (monolith)
# Usage:
#   ./deploy.sh          → update (pull + rebuild + restart)
#   ./deploy.sh install  → first-time install
#   ./deploy.sh fresh    → reset (HAPUS DATA!) lalu install ulang
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*"; exit 1; }

COMMAND="${1:-update}"

if [ -f docker-compose.prod.yml ]; then
  COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
else
  COMPOSE_CMD="docker compose"
fi

command -v docker >/dev/null 2>&1 || error "Docker belum terinstall"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 belum terinstall"

ensure_env() {
  if [ ! -f .env ]; then
    if [ -f .env.example ]; then
      warn ".env tidak ditemukan — menyalin dari .env.example"
      cp .env.example .env
      warn "Edit .env (APP_KEY, DB_*, R2_*, dll) lalu jalankan ulang: ./deploy.sh install"
      exit 0
    fi
    error ".env.example tidak ditemukan"
  fi
}

build_and_start() {
  info "Building dan starting containers..."
  $COMPOSE_CMD up -d --build --remove-orphans
  success "Containers berjalan"
}

wait_app() {
  info "Menunggu app siap..."
  for i in {1..30}; do
    if $COMPOSE_CMD exec -T app php artisan --version >/dev/null 2>&1; then
      success "App siap"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  error "App tidak merespons setelah 60 detik"
}

run_artisan() {
  $COMPOSE_CMD exec -T app php artisan "$@"
}

cmd_install() {
  info "=== FIRST-TIME INSTALL ==="
  ensure_env
  build_and_start
  wait_app

  info "Generating APP_KEY..."
  run_artisan key:generate --force

  info "Migrasi..."
  run_artisan migrate --force

  info "Seeder..."
  run_artisan db:seed --force || true

  run_artisan storage:link || true
  $COMPOSE_CMD exec -T app touch storage/app/installed || true

  run_artisan config:cache
  run_artisan route:cache
  run_artisan view:cache

  success "=== INSTALASI SELESAI ==="
  echo -e "${GREEN}App:${NC} http://localhost:8080"
}

cmd_update() {
  info "=== DEPLOY UPDATE ==="
  ensure_env

  if [ -d .git ]; then
    info "git pull..."
    git pull || warn "git pull gagal — lanjut rebuild"
  fi

  build_and_start
  wait_app

  run_artisan migrate --force
  run_artisan optimize:clear
  run_artisan config:cache
  run_artisan route:cache
  run_artisan view:cache

  success "=== UPDATE SELESAI ==="
}

cmd_fresh() {
  warn "=== FRESH — SEMUA DATA VOLUME AKAN DIHAPUS ==="
  read -rp "Ketik 'yes' untuk konfirmasi: " confirm
  [ "$confirm" = "yes" ] || error "Dibatalkan"

  $COMPOSE_CMD down -v 2>/dev/null || true
  rm -f storage/app/installed
  cmd_install
}

case "$COMMAND" in
  install) cmd_install ;;
  fresh)   cmd_fresh ;;
  update)  cmd_update ;;
  *)       error "Command: install | update | fresh" ;;
esac
