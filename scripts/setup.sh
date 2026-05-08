#!/usr/bin/env bash
# Bootstrap dev environment cho mvp-kho-bac
# Chạy 1 lần khi bạn join project. Idempotent — chạy lại không hỏng.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

cyan()   { printf '\033[36m%s\033[0m\n' "$*"; }
green()  { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red()    { printf '\033[31m%s\033[0m\n' "$*"; }

cyan "🚀 Bootstrap mvp-kho-bac"
cyan "========================"
echo "Project root: $PROJECT_ROOT"
echo

# ─────────────────────────────────────────────────
# 1. mise — language/tool version manager
# ─────────────────────────────────────────────────
cyan "[1/7] Check mise"
if ! command -v mise >/dev/null 2>&1; then
    yellow "→ mise chưa cài. Install:"
    echo "       curl https://mise.run | sh"
    echo "       echo 'eval \"\$(mise activate bash)\"' >> ~/.bashrc"
    echo "       (zsh: ~/.zshrc, fish: dùng mise activate fish)"
    echo "       Restart shell rồi chạy lại setup.sh"
    exit 1
fi
green "✅ mise: $(mise --version)"
echo

# ─────────────────────────────────────────────────
# 2. Cài tools theo .mise.toml
# ─────────────────────────────────────────────────
cyan "[2/7] Install tools từ .mise.toml"
mise install
green "✅ Tools installed"
echo

# ─────────────────────────────────────────────────
# 3. Frontend deps (nếu có)
# ─────────────────────────────────────────────────
cyan "[3/7] Frontend dependencies"
if [[ -d frontend ]] && [[ -f frontend/pnpm-lock.yaml ]]; then
    (cd frontend && pnpm install --frozen-lockfile)
    green "✅ pnpm install done"
elif [[ -d frontend ]]; then
    yellow "→ frontend/ tồn tại nhưng chưa có pnpm-lock.yaml — bỏ qua"
else
    echo "   (frontend/ chưa có — sẽ tạo ở Stage 3)"
fi
echo

# ─────────────────────────────────────────────────
# 4. Maven warmup (nếu có)
# ─────────────────────────────────────────────────
cyan "[4/7] Maven dependencies"
if find services -name pom.xml 2>/dev/null | head -1 | grep -q .; then
    ./mvnw -B dependency:resolve -DskipTests -q || yellow "→ Maven warmup gặp warning (bỏ qua được)"
    green "✅ Maven deps ready"
else
    echo "   (services/*/pom.xml chưa có — sẽ tạo ở Stage 3)"
fi
echo

# ─────────────────────────────────────────────────
# 5. Pre-commit hooks
# ─────────────────────────────────────────────────
cyan "[5/7] Pre-commit hooks"
if command -v pre-commit >/dev/null 2>&1; then
    if [[ -d .git ]]; then
        pre-commit install
        pre-commit install --hook-type commit-msg
        green "✅ Pre-commit hooks installed"
    else
        yellow "→ Git chưa init — chạy 'make git-init' trước rồi 'make git-hooks'"
    fi
else
    yellow "→ pre-commit chưa có (lạ vì .mise.toml có) — chạy: mise install"
fi
echo

# ─────────────────────────────────────────────────
# 6. Git config recommendations
# ─────────────────────────────────────────────────
cyan "[6/7] Git config check"
if ! git config user.email >/dev/null 2>&1; then
    yellow "→ git user.email chưa set:"
    echo "       git config --global user.email 'you@example.com'"
fi
if ! git config user.signingkey >/dev/null 2>&1; then
    yellow "→ Signing key chưa set (cần cho signed commit):"
    echo "       git config --global user.signingkey <KEY_ID>"
    echo "       git config --global commit.gpgsign true"
fi
echo

# ─────────────────────────────────────────────────
# 7. Verify
# ─────────────────────────────────────────────────
cyan "[7/7] Verify"
"$SCRIPT_DIR/verify-env.sh" || true
echo

# ─────────────────────────────────────────────────
# Done
# ─────────────────────────────────────────────────
cyan "🎉 Setup done"
echo
echo "Next steps:"
echo "  1. Cài Claude Code plugin:    ./scripts/install-claude-plugins.sh"
echo "  2. Khởi động infra (optional): make infra-up"
echo "  3. Mở workspace của bạn:       cd workspaces/<role> && claude code ."
echo "     <role> ∈ {ba, sa, dev-be, dev-fe, qa, devops}"
echo
echo "Đọc thêm: README.md hoặc docs/WORKFLOW.md"
