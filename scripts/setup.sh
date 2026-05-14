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
# 0. Prerequisites check
# ─────────────────────────────────────────────────
cyan "[0/8] Prerequisites check"

PREREQ_FAIL=0

if ! command -v mise >/dev/null 2>&1; then
    red "❌ mise chưa cài. Install: curl https://mise.run | sh"
    echo "   Sau đó: echo 'eval \"\$(mise activate bash)\"' >> ~/.bashrc && restart shell"
    PREREQ_FAIL=1
else
    green "✅ mise: $(mise --version)"
fi

if ! command -v docker >/dev/null 2>&1; then
    yellow "⚠️  Docker chưa cài. Cần để chạy Oracle/Artemis local."
else
    green "✅ Docker: $(docker --version)"
fi

if ! command -v gh >/dev/null 2>&1; then
    yellow "⚠️  gh CLI chưa cài. Ubuntu: sudo apt install gh -y · Mac: brew install gh"
    yellow "   Sau đó: gh auth login"
else
    if gh auth status >/dev/null 2>&1; then
        green "✅ gh CLI: $(gh --version | head -1) (authenticated)"
    else
        yellow "⚠️  gh CLI đã cài nhưng chưa auth. Chạy: gh auth login"
    fi
fi

if ! command -v claude >/dev/null 2>&1; then
    yellow "⚠️  Claude Code CLI chưa cài. Tải: https://claude.com/claude-code hoặc npm install -g @anthropic-ai/claude-code"
else
    green "✅ Claude Code: $(claude --version 2>/dev/null || echo 'installed')"
fi

if [[ $PREREQ_FAIL -eq 1 ]]; then
    red "❌ Thiếu prerequisites bắt buộc. Cài xong chạy lại setup.sh."
    exit 1
fi

# SSH host key cho GitHub
if ! grep -q "github.com" ~/.ssh/known_hosts 2>/dev/null; then
    cyan "→ Thêm GitHub SSH host key..."
    mkdir -p ~/.ssh
    ssh-keyscan -t ed25519 github.com >> ~/.ssh/known_hosts 2>/dev/null
    green "✅ GitHub SSH host key added"
else
    green "✅ GitHub SSH host key đã có"
fi

echo

# ─────────────────────────────────────────────────
# 1. mise — language/tool version manager
# ─────────────────────────────────────────────────
cyan "[1/8] Check mise"
green "✅ mise: $(mise --version)"
echo

# ─────────────────────────────────────────────────
# 2. Cài tools theo .mise.toml
# ─────────────────────────────────────────────────
cyan "[2/8] Install tools từ .mise.toml"
mise install
green "✅ Tools installed"
echo

# ─────────────────────────────────────────────────
# 3. Frontend deps (nếu có)
# ─────────────────────────────────────────────────
cyan "[3/8] Frontend dependencies"
if [[ -d frontend ]] && [[ -f frontend/pnpm-lock.yaml ]]; then
    (cd frontend && pnpm install --frozen-lockfile)
    green "✅ pnpm install done"
elif [[ -d frontend ]]; then
    yellow "→ frontend/ tồn tại nhưng chưa có pnpm-lock.yaml — bỏ qua"
else
    echo "   (frontend/ chưa có — sẽ tạo khi Dev Agent sinh code)"
fi
echo

# ─────────────────────────────────────────────────
# 4. Maven warmup (nếu có)
# ─────────────────────────────────────────────────
cyan "[4/8] Maven dependencies"
if [[ -f backend/pom.xml ]]; then
    (cd backend && mvn -B dependency:resolve -DskipTests -q) || yellow "→ Maven warmup gặp warning (bỏ qua được)"
    green "✅ Maven deps ready"
else
    echo "   (backend/pom.xml chưa có — sẽ tạo khi Dev Agent sinh code)"
fi
echo

# ─────────────────────────────────────────────────
# 5. Pre-commit hooks
# ─────────────────────────────────────────────────
cyan "[5/8] Pre-commit hooks"
if command -v pre-commit >/dev/null 2>&1; then
    if [[ -d .git ]]; then
        pre-commit install
        pre-commit install --hook-type commit-msg
        green "✅ Pre-commit hooks installed"
    else
        yellow "→ Git chưa init — chạy git init trước rồi chạy lại setup.sh"
    fi
else
    yellow "→ pre-commit chưa có — chạy: mise install"
fi
echo

# ─────────────────────────────────────────────────
# 6. Plugin install (bắt buộc cho đồng nhất team)
# ─────────────────────────────────────────────────
cyan "[6/8] Plugin install"
if command -v claude >/dev/null 2>&1; then
    "$SCRIPT_DIR/install-claude-plugins.sh"
else
    yellow "Claude Code CLI chưa cài — bỏ qua. Cài xong chạy: ./scripts/install-claude-plugins.sh"
fi
echo

# ─────────────────────────────────────────────────
# 7. Workspace initialization (3-agent: BA, SA, Dev)
# ─────────────────────────────────────────────────
cyan "[7/8] Initialize workspaces"

mkdir -p workspaces/ba workspaces/sa workspaces/dev
mkdir -p gates features contracts

for role in ba sa dev; do
    if [[ -f "workspaces/$role/CLAUDE.md" ]]; then
        green "✅ workspaces/$role/CLAUDE.md exists"
    else
        red "❌ workspaces/$role/CLAUDE.md missing — cần commit file này vào repo"
    fi
done

green "✅ Directories ready"
echo

# ─────────────────────────────────────────────────
# 8. Verify
# ─────────────────────────────────────────────────
cyan "[8/8] Verify"
if "$SCRIPT_DIR/verify-env.sh"; then
    echo
    cyan "🎉 Setup done — môi trường sẵn sàng."
    echo
    echo "Mở workspace theo vai trò:"
    echo "  cd workspaces/ba  && claude   (BA Agent — thẩm định nghiệp vụ)"
    echo "  cd workspaces/sa  && claude   (SA Agent — thiết kế OpenAPI)"
    echo "  cd workspaces/dev && claude   (Dev Agent — lập trình logic)"
    echo ""
    echo "Đọc thêm: docs/WORKFLOW.md"
else
    echo
    red "❌ Setup KHÔNG hoàn tất. Xem danh sách Fail ở trên và khắc phục."
    echo "   Sau khi fix, chạy lại: ./scripts/verify-env.sh"
    exit 1
fi
echo
echo "Next steps:"
echo "  Mở workspace theo vai trò:"
echo "    cd workspaces/ba  && claude   (BA Agent — thẩm định nghiệp vụ)"
echo "    cd workspaces/sa  && claude   (SA Agent — thiết kế OpenAPI)"
echo "    cd workspaces/dev && claude   (Dev Agent — lập trình logic)"
echo ""
echo "Đọc thêm: docs/WORKFLOW.md"
