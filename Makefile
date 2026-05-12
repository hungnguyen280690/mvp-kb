.DEFAULT_GOAL := help
.PHONY: help up down clean ba sa dev

help: ## Hiển thị các lệnh hỗ trợ
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

up: ## Khởi động hạ tầng Docker (Oracle, MQ)
	docker compose up -d --build

down: ## Dừng toàn bộ hạ tầng
	docker compose down

clean: ## Dọn dẹp build artifacts và node_modules
	rm -rf backend/target frontend/dist frontend/node_modules
	@echo "🧹 Cleaned."

ba: ## Chạy Agent BA (Review đặc tả)
	cd workspaces/ba && claude code .

sa: ## Chạy Agent SA (Thiết kế OpenAPI)
	cd workspaces/sa && claude code .

dev: ## Chạy Agent Dev (Lập trình Fullstack & TDD)
	cd workspaces/dev && claude code .
