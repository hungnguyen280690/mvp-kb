#!/usr/bin/env bash
# Cài Claude Code plugin theo .claude/plugins.lock
# Một số plugin install qua npm (auto), một số qua slash command Claude Code (interactive).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
LOCK="$PROJECT_ROOT/.claude/plugins.lock"

[[ -f "$LOCK" ]] || { echo "❌ Không tìm thấy $LOCK"; exit 1; }

cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }

cyan "🔧 Claude Code Plugin Installer"
cyan "================================"
echo "Lock file: $LOCK"
echo

# ─────────────────────────────────────────────────
# Check tools needed
# ─────────────────────────────────────────────────
command -v npx >/dev/null 2>&1 || { red "❌ npx chưa cài. Cài Node.js + pnpm trước (mise install)."; exit 1; }
command -v claude >/dev/null 2>&1 || { yellow "⚠️  Claude Code CLI chưa cài. Tải tại https://claude.com/claude-code"; }

# ─────────────────────────────────────────────────
# Step 1 — npm-based plugins (auto)
# ─────────────────────────────────────────────────
cyan "Step 1: Cài plugin npm-based (tự động)"
echo "------------------------------------"

cyan "→ mattpocock/skills"
if npx -y skills@latest add mattpocock/skills 2>&1; then
    green "✅ mattpocock/skills installed"
else
    red "❌ Cài mattpocock/skills thất bại"
    exit 1
fi
echo

# ─────────────────────────────────────────────────
# Step 2 — Claude marketplace plugins (interactive)
# ─────────────────────────────────────────────────
cyan "Step 2: Cài plugin Claude marketplace"
echo "--------------------------------------"
yellow "⚠️  Bước này cần thao tác trong Claude Code (slash command interactive)."
echo
echo "Mở 1 cửa sổ Claude Code mới ở thư mục $PROJECT_ROOT, chạy lần lượt các lệnh:"
echo
cat <<'EOF'
  ┌────────────────────────────────────────────────────────────────┐
  │  /plugin marketplace add obra/superpowers                      │
  │  /plugin install superpowers                                   │
  │                                                                │
  │  /plugin marketplace add wshobson/agents                       │
  │  /plugin install kubernetes-operations                         │
  │  /plugin install security-scanning                             │
  │  /plugin install java-development                              │
  └────────────────────────────────────────────────────────────────┘
EOF
echo
read -r -p "Đã chạy xong các lệnh trên? Bấm Enter để verify... "

# ─────────────────────────────────────────────────
# Step 3 — Verify
# ─────────────────────────────────────────────────
cyan "Step 3: Verify"
echo "----------------"

PLUGIN_DIR="$HOME/.claude/plugins"
if [[ -d "$PLUGIN_DIR" ]]; then
    green "✅ Plugin directory: $PLUGIN_DIR"
    echo "   Installed plugins:"
    ls -1 "$PLUGIN_DIR" 2>/dev/null | sed 's/^/      • /' || echo "   (empty)"
else
    yellow "⚠️  $PLUGIN_DIR chưa tồn tại — Claude Code có thể chưa khởi động lần đầu"
fi
echo

# Check expected plugins
EXPECTED=("superpowers" "kubernetes-operations" "security-scanning" "java-development")
MISSING=()
for plugin in "${EXPECTED[@]}"; do
    if ! ls "$PLUGIN_DIR" 2>/dev/null | grep -qi "$plugin"; then
        MISSING+=("$plugin")
    fi
done

if [[ ${#MISSING[@]} -eq 0 ]]; then
    green "✅ Tất cả plugin đã cài khớp plugins.lock"
else
    yellow "⚠️  Plugin thiếu: ${MISSING[*]}"
    yellow "    Quay lại Claude Code và cài tiếp."
fi

echo
cyan "🎉 Done. Tiếp theo:"
echo "   • Chạy: ./scripts/verify-env.sh"
echo "   • Mở workspace của bạn:  cd workspaces/<role> && claude code ."
