#!/usr/bin/env bash
# Verify môi trường dev khớp tiêu chuẩn dự án mvp-kho-bac (3-Agent MVP)
# Chạy: ./scripts/verify-env.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

PASS=0
FAIL=0
WARN=0

check_pass() { printf '  \033[32m✅\033[0m %s\n' "$1"; ((PASS++)); }
check_fail() { printf '  \033[31m❌\033[0m %s\n' "$1"; ((FAIL++)); }
check_warn() { printf '  \033[33m⚠️ \033[0m %s\n' "$1"; ((WARN++)); }

check() {
    local name="$1"
    local cmd="$2"
    local expected="${3:-}"

    local output
    if output=$(eval "$cmd" 2>/dev/null); then
        if [[ -n "$expected" ]]; then
            if echo "$output" | grep -q "$expected"; then
                check_pass "$name"
            else
                local short
                short=$(echo "$output" | head -1 | cut -c1-60)
                check_warn "$name (expected '$expected', got: $short)"
            fi
        else
            check_pass "$name"
        fi
    else
        check_fail "$name"
    fi
}

echo "🔍 Verify môi trường dev — mvp-kho-bac (3-Agent MVP)"
echo "======================================================"
echo

# ─────────────────────────────────────────────────
echo "[Tool versions]"
check "mise installed" "mise --version"
check "Java 21" "java -version 2>&1" "21"
check "Node 26" "node --version" "v26"
check "pnpm 9" "pnpm --version" "9"
check "Maven 3.9" "mvn --version" "3.9"
check "Git" "git --version"
check "Docker" "command -v docker"
check "gh CLI" "command -v gh"
check "Claude Code CLI" "claude --version"
check "pre-commit" "pre-commit --version"
echo

# ─────────────────────────────────────────────────
echo "[Claude Code Plugins]"
check "claude CLI" "command -v claude"

CLAUDE_DIR="$HOME/.claude"
PLUGIN_DIR="$CLAUDE_DIR/plugins"

if [[ -d "$PLUGIN_DIR" ]]; then
    check_pass "Plugin directory exists ($PLUGIN_DIR)"

    INSTALLED_JSON="$PLUGIN_DIR/installed_plugins.json"
    LOCK_FILE="$PROJECT_ROOT/.claude/plugins.lock"

    # Hardcoded list — single source of truth cho team
    EXPECTED=("superpowers" "security-scanning")

    # Cross-check: nếu plugins.lock có nhiều hơn list trên → cảnh báo
    if [[ -f "$LOCK_FILE" ]]; then
        LOCK_COUNT=$(grep -c "^  - name:" "$LOCK_FILE" 2>/dev/null || echo 0)
        if [[ "$LOCK_COUNT" -ne "${#EXPECTED[@]}" ]]; then
            check_warn "plugins.lock có $LOCK_COUNT plugin nhưng verify chỉ check ${#EXPECTED[@]} — cần update verify-env.sh"
        fi
    fi

    for plugin in "${EXPECTED[@]}"; do
        if [[ -f "$INSTALLED_JSON" ]] && grep -q "\"$plugin@" "$INSTALLED_JSON" 2>/dev/null; then
            check_pass "Plugin: $plugin"
        else
            check_fail "Plugin missing: $plugin (chạy scripts/install-claude-plugins.sh)"
        fi
    done
else
    check_fail "Plugin dir chưa có — chạy scripts/setup.sh hoặc mở Claude Code lần đầu"
fi
echo

# ─────────────────────────────────────────────────
echo "[Project files — root]"
check "CLAUDE.md" "test -f CLAUDE.md"
check "README.md" "test -f README.md"
check ".claude/settings.json" "test -f .claude/settings.json"
check ".claude/plugins.lock" "test -f .claude/plugins.lock"
check ".mise.toml" "test -f .mise.toml"
check ".gitignore" "test -f .gitignore"
check ".editorconfig" "test -f .editorconfig"
check "Makefile" "test -f Makefile"
check "docker-compose.yml" "test -f docker-compose.yml"
check ".pre-commit-config.yaml" "test -f .pre-commit-config.yaml"
echo

# ─────────────────────────────────────────────────
echo "[Project files — docs]"
for doc in CONTEXT.md ARCHITECTURE.md CONVENTIONS.md RULES.md WORKFLOW.md; do
    check "docs/$doc" "test -f docs/$doc"
done
echo

# ─────────────────────────────────────────────────
echo "[3-Agent directories]"
check "features/" "test -d features"
check "features/TEMPLATE.md" "test -f features/TEMPLATE.md"
check "contracts/" "test -d contracts"
check "gates/" "test -d gates"
echo

# ─────────────────────────────────────────────────
echo "[Workspaces — 3 Agent roles]"
for role in ba sa dev; do
    check "workspaces/$role/CLAUDE.md" "test -f workspaces/$role/CLAUDE.md"
done
echo

# ─────────────────────────────────────────────────
echo "[Git]"
if [[ -d .git ]]; then
    check_pass "Git initialized"
    if git config user.signingkey >/dev/null 2>&1; then
        check_pass "Signing key configured"
    else
        check_warn "Signing key chưa cấu hình (cần cho commit signed)"
    fi
    if git remote -v 2>/dev/null | grep -q origin; then
        check_pass "Remote origin set"
    else
        check_warn "Chưa add remote origin (GitHub/GitLab)"
    fi
else
    check_warn "Git chưa init — chạy: make git-init"
fi
echo

# ─────────────────────────────────────────────────
echo "======================================================"
printf "✅ Pass: %d   ⚠️  Warn: %d   ❌ Fail: %d\n" "$PASS" "$WARN" "$FAIL"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
