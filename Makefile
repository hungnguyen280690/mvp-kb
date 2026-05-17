# MVP Kho Bac - Orchestration Makefile

.DEFAULT_GOAL := help
.PHONY: help setup verify dev test lint format clean infra stage0 stage1 stage2 stage3 stage4

help: ## Hien thi danh sach lenh
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## Khoi tao moi truong phat trien
	@echo "Setting up environment..."
	@mkdir -p backend frontend contracts docs features gates workspaces

verify: ## Kiem tra tinh tuan thu cua cau truc
	@echo "Verifying project structure..."
	@test -f docs/ARCHITECTURE.md || (echo "Missing ARCHITECTURE.md" && exit 1)
	@test -f docs/RULES.md || (echo "Missing RULES.md" && exit 1)
	@test -f backend/pom.xml || (echo "Missing backend/pom.xml" && exit 1)
	@test -f frontend/package.json || (echo "Missing frontend/package.json" && exit 1)
	@echo "Structure is valid"

infra: ## Chay infrastructure (Oracle + Artemis)
	docker compose up -d

infra-full: ## Chay toan bo stack (infra + app)
	docker compose --profile app up -d --build

dev: ## Chay backend + frontend local
	@echo "Starting backend..."
	@cd backend && ./mvnw spring-boot:run -pl ltt-core &
	@echo "Starting frontend..."
	@cd frontend && pnpm dev &

test: ## Chay toan bo Unit Test
	cd backend && ./mvnw test

test-fe: ## Chay frontend build
	cd frontend && pnpm build

lint: ## Kiem tra dinh dang code
	cd backend && ./mvnw spotless:check

clean: ## Don sach build artifacts
	cd backend && ./mvnw clean
	rm -rf frontend/node_modules frontend/apps/*/node_modules frontend/packages/*/node_modules

stage0: ## [SA] Khoi tao Base Project
	@echo "cd workspaces/sa"

stage1: ## [BA] Phan tich nghiep vu
	@echo "cd workspaces/ba"

stage2: ## [SA] Thiet ke API & DB
	@echo "cd workspaces/sa"

stage3: ## [Dev] Thuc thi ma nguon
	@echo "cd workspaces/dev"

stage4: ## [QA] Kiem thu
	@echo "cd workspaces/qa"
