#!/usr/bin/env bash
# Verify môi trường dev khớp tiêu chuẩn dự án mvp-kho-bac
# Chạy: ./scripts/verify-env.sh

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

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

echo "🔍 Verify môi trường dev — mvp-kho-bac"
echo "======================================"
echo

# ─────────────────────────────────────────────────
echo "[Tool versions]"
check "mise installed" "mise --version"
check "Java 21" "java -version 2>&1" "21"
check "Node 20" "node --version" "v20"
check "pnpm 9" "pnpm --version" "9"
check "Maven 3.9" "mvn --version" "3.9"
check "Docker" "docker --version"
check "gh CLI" "gh --version"
check "Claude Code CLI" "claude --version"
check "pre-commit" "pre-commit --version"
check "shellcheck" "shellcheck --version"
echo

# ─────────────────────────────────────────────────
echo "[Claude Code]"
check "claude CLI" "command -v claude"

CLAUDE_DIR="$HOME/.claude"
PLUGIN_DIR="$CLAUDE_DIR/plugins"

if [[ -d "$PLUGIN_DIR" ]]; then
    check_pass "Plugin directory exists ($PLUGIN_DIR)"
    PLUGIN_COUNT=$(find "$PLUGIN_DIR" -mindepth 1 -maxdepth 1 -type d 2>/dev/null | wc -l)
    echo "      Installed: $PLUGIN_COUNT plugin"
    ls -1 "$PLUGIN_DIR" 2>/dev/null | sed 's/^/        • /'

    # Check expected plugins from plugins.lock
    EXPECTED=("superpowers" "kubernetes-operations" "security-scanning" "java-development")
    for plugin in "${EXPECTED[@]}"; do
        if ls "$PLUGIN_DIR" 2>/dev/null | grep -qi "$plugin"; then
            check_pass "Plugin: $plugin"
        else
            check_warn "Plugin missing: $plugin (chạy install-claude-plugins.sh)"
        fi
    done
else
    check_warn "Plugin dir chưa có — Claude Code chưa khởi động lần đầu hoặc chưa cài plugin"
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
check "docker-compose.dev.yml" "test -f docker-compose.dev.yml"
check ".pre-commit-config.yaml" "test -f .pre-commit-config.yaml"
check "scripts/git-auto-push.sh" "test -x scripts/git-auto-push.sh"
echo

# ─────────────────────────────────────────────────
echo "[Project files — docs]"
for doc in CONTEXT.md GATEKEEPERS.md WORKFLOW.md SAFETY.md QUALITY_GATES.md branch-protection-setup.md; do
    check "docs/$doc" "test -f docs/$doc"
done
echo

# ─────────────────────────────────────────────────
echo "[Workspaces]"
for role in ba sa dev-be dev-fe qa devops; do
    check "workspaces/$role/CLAUDE.md" "test -f workspaces/$role/CLAUDE.md"
done
echo

# ─────────────────────────────────────────────────
echo "[Per-workspace agents]"
[[ -f workspaces/ba/.claude/agents/ba-parser.md ]] && check_pass "ba: ba-parser" || check_fail "ba: ba-parser"
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
echo "======================================"
printf "✅ Pass: %d   ⚠️  Warn: %d   ❌ Fail: %d\n" "$PASS" "$WARN" "$FAIL"
[[ $FAIL -eq 0 ]] && exit 0 || exit 1
