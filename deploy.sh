#!/usr/bin/env bash
# =============================================================================
# CMS ScholarGate — Easy Docker Deploy Script
# Usage:
#   ./deploy.sh          → update (pull + rebuild + restart)
#   ./deploy.sh install  → first-time install (setup .env, migrate, seed)
#   ./deploy.sh fresh    → reset semua (HAPUS DATA!) lalu install ulang
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERR]${NC}  $*"; exit 1; }

COMMAND="${1:-update}"

# Pakai image dari Docker Hub jika ada docker-compose.prod.yml
if [ -f docker-compose.prod.yml ]; then
  COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.prod.yml"
else
  COMPOSE_CMD="docker compose"
fi

# ── Cek prerequisite ─────────────────────────────────────────────────────────
command -v docker >/dev/null 2>&1 || error "Docker belum terinstall"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 belum terinstall"

# ── Fungsi helper ─────────────────────────────────────────────────────────────
ensure_env() {
  if [ ! -f backend/.env ]; then
    if [ -f backend/.env.example ]; then
      warn "backend/.env tidak ditemukan, menyalin dari .env.example..."
      cp backend/.env.example backend/.env
      warn "PENTING: Edit backend/.env dan isi nilai yang kosong (APP_KEY, DB_PASSWORD, dll)"
      warn "Lalu jalankan ulang: ./deploy.sh install"
      exit 0
    else
      error "backend/.env.example tidak ditemukan"
    fi
  fi
}

ensure_docker_env() {
  if [ ! -f .env ]; then
    info "Membuat .env untuk docker-compose dari .env.docker.example..."
    if [ -f .env.docker.example ]; then
      cp .env.docker.example .env
    else
      # Buat .env minimal dari backend/.env
      DB_PASS=$(grep '^DB_PASSWORD=' backend/.env | cut -d'=' -f2-)
      DB_USER=$(grep '^DB_USERNAME=' backend/.env | cut -d'=' -f2-)
      DB_NAME=$(grep '^DB_DATABASE=' backend/.env | cut -d'=' -f2-)
      cat > .env << ENVEOF
DB_DATABASE=${DB_NAME:-scholargate}
DB_USERNAME=${DB_USER:-scholargate}
DB_PASSWORD=${DB_PASS:-secret}
ENVEOF
      success ".env untuk docker-compose dibuat otomatis"
    fi
  fi
}

build_and_start() {
  info "Building dan starting containers..."
  $COMPOSE_CMD pull && $COMPOSE_CMD up -d --build --remove-orphans
  success "Containers berjalan!"
}

wait_backend() {
  info "Menunggu backend siap..."
  for i in {1..30}; do
    if $COMPOSE_CMD exec -T backend php artisan --version >/dev/null 2>&1; then
      success "Backend siap!"
      return 0
    fi
    echo -n "."
    sleep 2
  done
  error "Backend tidak merespons setelah 60 detik"
}

run_artisan() {
  $COMPOSE_CMD exec -T backend php artisan "$@"
}

# ── Command: install (first time) ─────────────────────────────────────────────
cmd_install() {
  info "=== FIRST-TIME INSTALL ==="
  ensure_env
  ensure_docker_env
  build_and_start
  wait_backend

  info "Generating APP_KEY..."
  run_artisan key:generate --force

  info "Menjalankan migrasi database..."
  run_artisan migrate --force

  info "Menjalankan seeder..."
  run_artisan db:seed --force

  info "Menandai aplikasi sebagai terinstall..."
  run_artisan storage:link || true
  $COMPOSE_CMD exec -T backend touch storage/app/installed

  info "Optimisasi cache..."
  run_artisan config:cache
  run_artisan route:cache
  run_artisan view:cache

  success "=== INSTALASI SELESAI! ==="
  echo ""
  echo -e "${GREEN}Frontend:${NC} http://localhost:3000  (atau smage.my.id via reverse proxy)"
  echo -e "${GREEN}API:${NC}      http://localhost:8080  (atau api-cms.smage.my.id via reverse proxy)"
  echo ""
}

# ── Command: update ───────────────────────────────────────────────────────────
cmd_update() {
  info "=== DEPLOY UPDATE ==="
  ensure_env
  ensure_docker_env

  info "Pull kode terbaru..."
  git pull

  build_and_start
  wait_backend

  info "Migrasi database (jika ada yang baru)..."
  run_artisan migrate --force

  info "Clear & rebuild cache..."
  run_artisan config:cache
  run_artisan route:cache
  run_artisan view:cache
  run_artisan optimize:clear

  success "=== UPDATE SELESAI! ==="
}

# ── Command: fresh (reset) ─────────────────────────────────────────────────────
cmd_fresh() {
  warn "=== FRESH INSTALL — SEMUA DATA AKAN DIHAPUS! ==="
  read -rp "Ketik 'yes' untuk konfirmasi: " confirm
  [ "$confirm" = "yes" ] || error "Dibatalkan"

  $COMPOSE_CMD down -v 2>/dev/null || true
  rm -f backend/storage/app/installed
  cmd_install
}

# ── Main ──────────────────────────────────────────────────────────────────────
case "$COMMAND" in
  install) cmd_install ;;
  fresh)   cmd_fresh ;;
  update)  cmd_update ;;
  *)       error "Command tidak dikenal: $COMMAND. Gunakan: install | update | fresh" ;;
esac
