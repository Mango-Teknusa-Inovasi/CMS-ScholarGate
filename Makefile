# CMS Scholargate — Makefile shortcuts
# Usage: make <command>

.PHONY: install update fresh up down logs shell artisan migrate seed help

## ── Deploy ──────────────────────────────────────────────────
install:   ## First-time install
	./deploy.sh install

update:    ## Update (git pull + rebuild + migrate)
	./deploy.sh update

fresh:     ## Reset semua data dan install ulang
	./deploy.sh fresh

## ── Container ───────────────────────────────────────────────
up:        ## Start containers
	docker compose up -d

down:      ## Stop containers
	docker compose down

restart:   ## Restart containers
	docker compose restart

logs:      ## Lihat logs
	docker compose logs -f

logs-app:  ## Logs app container
	docker compose logs -f app

## ── Shell ────────────────────────────────────────────────────
shell:     ## Shell ke app container
	docker compose exec app sh

## ── Laravel artisan ─────────────────────────────────────────
artisan:   ## Run artisan. Contoh: make artisan CMD="route:list"
	docker compose exec app php artisan $(CMD)

migrate:   ## Migrasi
	docker compose exec app php artisan migrate --force

seed:      ## Seeder
	docker compose exec app php artisan db:seed --force

cache-clear: ## Clear cache Laravel
	docker compose exec app php artisan optimize:clear

cache-build: ## Build cache Laravel
	docker compose exec app php artisan config:cache
	docker compose exec app php artisan route:cache
	docker compose exec app php artisan view:cache

## ── Assets (host) ───────────────────────────────────────────
assets:    ## Build Vite assets di host
	npm ci --legacy-peer-deps && npm run build

## ── Info ─────────────────────────────────────────────────────
ps:        ## Status containers
	docker compose ps

help:      ## Bantuan
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
