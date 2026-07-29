# CMS ScholarGate — Makefile shortcuts
# Usage: make <command>

.PHONY: install update fresh up down logs shell-backend shell-frontend artisan migrate seed

## ── Deploy ──────────────────────────────────────────────────
install:   ## First-time install
	./deploy.sh install

update:    ## Update (git pull + rebuild + migrate)
	./deploy.sh update

fresh:     ## Reset semua data dan install ulang
	./deploy.sh fresh

## ── Container ───────────────────────────────────────────────
up:        ## Start containers (tanpa rebuild)
	docker compose up -d

down:      ## Stop containers
	docker compose down

restart:   ## Restart semua containers
	docker compose restart

logs:      ## Lihat logs semua containers
	docker compose logs -f

logs-backend: ## Lihat logs backend
	docker compose logs -f backend

logs-frontend: ## Lihat logs frontend
	docker compose logs -f frontend

## ── Shell ────────────────────────────────────────────────────
shell:     ## Shell ke backend container
	docker compose exec backend sh

shell-frontend: ## Shell ke frontend container
	docker compose exec frontend sh

## ── Laravel artisan ─────────────────────────────────────────
artisan:   ## Run artisan command. Contoh: make artisan CMD="route:list"
	docker compose exec backend php artisan $(CMD)

migrate:   ## Jalankan migrasi
	docker compose exec backend php artisan migrate --force

seed:      ## Jalankan seeder
	docker compose exec backend php artisan db:seed --force

cache-clear: ## Clear semua cache Laravel
	docker compose exec backend php artisan optimize:clear

cache-build: ## Build semua cache Laravel
	docker compose exec backend php artisan config:cache
	docker compose exec backend php artisan route:cache
	docker compose exec backend php artisan view:cache

## ── Info ─────────────────────────────────────────────────────
ps:        ## Status containers
	docker compose ps

help:      ## Tampilkan bantuan ini
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
