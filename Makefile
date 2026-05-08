.DEFAULT_GOAL := help
.PHONY: help setup verify dev test lint format build clean \
        infra-up infra-down infra-logs infra-status \
        plugin-install plugin-verify \
        stage1 stage2 stage3-be stage3-fe stage4 stage5 \
        gate-status \
        git-init git-hooks ci-local save push commit

# ─────────────────────────────────────────────────
# Help
# ─────────────────────────────────────────────────
help: ## Hiển thị danh sách lệnh
	@awk 'BEGIN {FS = ":.*##"; printf "Usage: make \033[36m<target>\033[0m\n\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)

# ─────────────────────────────────────────────────
# Setup & verify
# ─────────────────────────────────────────────────
setup: ## Bootstrap dev env (mise + pnpm + maven + pre-commit) — chạy 1 lần khi onboard
	@./scripts/setup.sh

verify: ## Verify môi trường khớp tiêu chuẩn (.mise.toml + plugin Claude)
	@./scripts/verify-env.sh

plugin-install: ## Cài Claude Code plugin theo .claude/plugins.lock
	@./scripts/install-claude-plugins.sh

plugin-verify: ## Check plugin Claude khớp lock file
	@./scripts/verify-env.sh | grep -A 20 'Claude Code'

# ─────────────────────────────────────────────────
# Lifecycle
# ─────────────────────────────────────────────────
dev: infra-up ## Chạy stack local (infra + service)
	@echo "🚀 Local stack ready"
	@echo "   Oracle:      localhost:1521  (sys/testpass, app: vdbas/vdbaspass)"
	@echo "   IBM MQ:      localhost:1414  (QM1, app/testpass; web 9443)"
	@echo "   Pact broker: http://localhost:9292"
	@echo "   Mailhog:     http://localhost:8025"
	@echo "   Jaeger:      http://localhost:16686"
	@echo "   Legacy mock: http://localhost:8089"

clean: ## Dọn build artifact + cache
	@find . -type d \( -name target -o -name dist -o -name .turbo -o -name coverage -o -name node_modules \) \
		-not -path '*/.git/*' -prune -exec rm -rf {} + 2>/dev/null || true
	@echo "🧹 Cleaned"

# ─────────────────────────────────────────────────
# Test & lint
# ─────────────────────────────────────────────────
test: ## Chạy unit + integration test
	@if find services -name pom.xml 2>/dev/null | head -1 | grep -q .; then \
		./mvnw -B verify; \
	fi
	@if [ -d frontend ]; then \
		cd frontend && pnpm test:coverage; \
	fi

lint: ## Chạy lint toàn bộ (Java + TS + YAML + Dockerfile + shell)
	@if find services -name pom.xml 2>/dev/null | head -1 | grep -q .; then \
		./mvnw -B spotless:check; \
	fi
	@if [ -d frontend ]; then \
		cd frontend && pnpm lint && pnpm format:check; \
	fi
	@find . -name '*.yml' -o -name '*.yaml' 2>/dev/null \
		| grep -v node_modules | grep -v target \
		| xargs -r yamllint -d relaxed 2>/dev/null || true
	@find . -name 'Dockerfile*' 2>/dev/null \
		| xargs -r hadolint 2>/dev/null || true
	@find scripts -name '*.sh' 2>/dev/null | xargs -r shellcheck 2>/dev/null || true

format: ## Auto-fix format (Spotless + Prettier)
	@if find services -name pom.xml 2>/dev/null | head -1 | grep -q .; then \
		./mvnw -B spotless:apply; \
	fi
	@if [ -d frontend ]; then \
		cd frontend && pnpm format; \
	fi

# ─────────────────────────────────────────────────
# Local infra (Docker compose)
# ─────────────────────────────────────────────────
infra-up: ## Khởi động Oracle + IBM MQ + Pact + Mailhog + Jaeger
	@docker compose -f docker-compose.dev.yml up -d --wait

infra-down: ## Dừng infra
	@docker compose -f docker-compose.dev.yml down

infra-logs: ## Xem log infra (follow)
	@docker compose -f docker-compose.dev.yml logs -f

infra-status: ## Status các service infra
	@docker compose -f docker-compose.dev.yml ps

# ─────────────────────────────────────────────────
# Pipeline stage runners (gợi ý cho từng role)
# ─────────────────────────────────────────────────
stage1: ## [BA] Mở workspace BA + nhắc agent ba-parser
	@echo "→ cd workspaces/ba && claude code ."
	@echo "  Trong Claude Code: gọi agent 'ba-parser'"

stage2: ## [SA] Verify G1 sign + mở workspace SA
	@test -f gates/G1-ba-signoff.md || (echo "❌ G1 chưa sign-off, chạy stage1 trước" && exit 1)
	@echo "→ cd workspaces/sa && claude code ."

stage3-be: ## [Dev BE] Verify G2 + mở workspace dev-be
	@test -f gates/G2-sa-signoff.md || (echo "❌ G2 chưa sign-off" && exit 1)
	@echo "→ cd workspaces/dev-be && claude code ."

stage3-fe: ## [Dev FE] Verify G2 + mở workspace dev-fe
	@test -f gates/G2-sa-signoff.md || (echo "❌ G2 chưa sign-off" && exit 1)
	@echo "→ cd workspaces/dev-fe && claude code ."

stage4: ## [QA] Verify G3 + mở workspace qa
	@test -f gates/G3-dev-signoff.md || (echo "❌ G3 chưa sign-off" && exit 1)
	@echo "→ cd workspaces/qa && claude code ."

stage5: ## [DevOps] Verify G4 + mở workspace devops
	@test -f gates/G4-test-signoff.md || (echo "❌ G4 chưa sign-off" && exit 1)
	@echo "→ cd workspaces/devops && claude code ."

gate-status: ## Hiển thị trạng thái 5 gate
	@echo "Gate status:"
	@for g in G1-ba G2-sa G3-dev G3-fe G4-test G5-devops; do \
		if [ -f "gates/$$g-signoff.md" ]; then \
			echo "  ✅ $$g  (signed: $$(stat -c %y gates/$$g-signoff.md 2>/dev/null | cut -d' ' -f1))"; \
		else \
			echo "  ⏳ $$g  (pending)"; \
		fi \
	done

# ─────────────────────────────────────────────────
# Git helper
# ─────────────────────────────────────────────────
git-init: ## Init git repo local (chưa có remote)
	@if [ -d .git ]; then echo "Git đã init"; exit 0; fi
	@git init -b main
	@git add .
	@git commit -m "chore: initial vibe-code foundation" \
		-m "Multi-role workspace + 5-stage pipeline + safety + CI/CD foundation."
	@echo "✅ Git init xong. Add remote khi sẵn sàng:"
	@echo "   GitHub: git remote add origin git@github.com:ORG/mvp-kho-bac.git"
	@echo "   GitLab: git remote add origin git@gitlab.local:ORG/mvp-kho-bac.git"

git-hooks: ## Cài pre-commit hook (gitleaks, prettier, yamllint, ...)
	@pre-commit install
	@pre-commit install --hook-type commit-msg
	@echo "✅ Pre-commit hooks installed"

# ─────────────────────────────────────────────────
# CI helper (chạy giống GitHub Actions local)
# ─────────────────────────────────────────────────
ci-local: ## Chạy CI pipeline cục bộ (cần `act`)
	@command -v act >/dev/null || (echo "Install: brew install act / scoop install act" && exit 1)
	@act -W .github/workflows/ci.yml --container-architecture linux/amd64

# ─────────────────────────────────────────────────
# Quick git workflow
# ─────────────────────────────────────────────────
commit: ## Commit staged changes. Usage: make commit msg="mô tả"
	@test -n "$(msg)" || (echo "❌ Cần message: make commit msg=\"mô tả\"" && exit 1)
	@git commit -m "$(msg)" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
	@echo "✅ Committed: $(msg)"

push: ## Push current branch to remote
	@git push
	@echo "✅ Pushed to origin/$(shell git branch --show-current)"

save: ## Quick add + commit + push. Usage: make save msg="mô tả"
	@test -n "$(msg)" || (echo "❌ Cần message: make save msg=\"mô tả\"" && exit 1)
	@git add -A
	@git status -s | grep -q . || (echo "ℹ️  Không có thay đổi để commit" && exit 0)
	@git commit -m "$(msg)" -m "Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
	@git push
	@echo "✅ Saved + pushed: $(msg)"
