# MVP Kho Bạc - Orchestration Makefile

.DEFAULT_GOAL := help
.PHONY: help setup verify dev test lint format clean stage0 stage1 stage2 stage3

help: ## Hiển thị danh sách lệnh
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

setup: ## Khởi tạo môi trường phát triển
	@echo "🔧 Setting up environment..."
	@mkdir -p backend frontend contracts docs features gates workspaces

verify: ## Kiểm tra tính tuân thủ của cấu trúc
	@echo "🔍 Verifying project structure..."
	@test -f docs/PROJECT_STRUCTURE.md || (echo "❌ Missing PROJECT_STRUCTURE.md" && exit 1)
	@echo "✅ Structure is valid"

dev: ## Chạy hệ thống local (Placeholder)
	@echo "🚀 Starting local stack (PostgreSQL/ActiveMQ)..."

test: ## Chạy toàn bộ Unit Test
	@cd backend && ./mvnw test

lint: ## Kiểm tra định dạng code
	@cd backend && ./mvnw spotless:check

stage0: ## [SA] Khởi tạo Base Project
	@echo "→ cd workspaces/sa && gemini code ."

stage1: ## [BA] Rã nghiệp vụ chi tiết
	@echo "→ cd workspaces/ba && gemini code ."

stage2: ## [SA] Thiết kế API & DB
	@echo "→ cd workspaces/sa && gemini code ."

stage3: ## [Dev] Thực thi mã nguồn
	@echo "→ cd workspaces/dev-be && gemini code ."
