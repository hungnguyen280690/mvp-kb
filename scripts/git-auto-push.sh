#!/usr/bin/env bash
# git-auto-push.sh — Auto commit + debounce push cho AI agent
#
# Gọi từ PostToolUse hook trong .claude/settings.json
#
# COMMIT: ngay sau cooldown 30s — bảo vệ work-in-progress khỏi crash
# PUSH:   debounce 120s — gom nhiều commit rồi push 1 lần, tránh spam CI
#
# Branch: KHÔNG tự tạo branch. AI phải tạo feat/<tên-tính-năng> khi bắt đầu task.
#         Nếu vẫn đang trên main → chỉ commit local, không push.
#         Lý do: tên nhánh phải mô tả đúng feature, AI tự quyết định.
#
# Flow hoàn chỉnh:
#   1. AI bắt đầu task:     git checkout -b feat/parse-srs-state-machine
#   2. AI code:             Write/Edit → hook auto-stage → commit (30s) → push (2min debounce)
#   3. CI/CD:               tự chạy trên push, ci-reviewer review → LGTM
#   4. AI xong task:        báo người dùng "feat X xong, ready to merge"
#   5. NGƯỜI DÙNG:          review output → approve merge feat/* vào main

set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || exit 0)"
[[ -z "$REPO_ROOT" ]] && exit 0
cd "$REPO_ROOT"

# ── Unique temp files per repo ──
REPO_HASH="$(echo "$REPO_ROOT" | md5sum | cut -c1-8)"
COMMIT_COOLDOWN_FILE="/tmp/.claude-commit-cooldown-${REPO_HASH}"
PUSH_MARKER_FILE="/tmp/.claude-push-pending-${REPO_HASH}"
NOW=$(date +%s)

# ═══════════════════════════════════════════
# PHẦN 1: COMMIT (cooldown 30s)
# ═══════════════════════════════════════════

COMMIT_COOLDOWN=30   # giây
PUSH_DEBOUNCE=120    # giây — gom commit 2 phút rồi push 1 lần

# Cooldown check
if [[ -f "$COMMIT_COOLDOWN_FILE" ]]; then
    LAST_COMMIT=$(cat "$COMMIT_COOLDOWN_FILE")
    if [[ $((NOW - LAST_COMMIT)) -lt $COMMIT_COOLDOWN ]]; then
        exit 0  # chưa hết cooldown, file đã staged, chờ lần sau
    fi
fi

# Có gì để commit không?
if git diff --cached --quiet 2>/dev/null; then
    exit 0
fi

# ── Build commit message từ branch name + files ──
BRANCH=$(git branch --show-current)

# Detect scope từ file path
detect_scope() {
    local files
    files=$(git diff --cached --name-only)
    if echo "$files" | grep -q 'domain/'; then echo "domain"
    elif echo "$files" | grep -q 'contracts/'; then echo "contracts"
    elif echo "$files" | grep -q 'db/migrations/'; then echo "db"
    elif echo "$files" | grep -q 'services/'; then echo "backend"
    elif echo "$files" | grep -q 'frontend/'; then echo "frontend"
    elif echo "$files" | grep -q 'tests/'; then echo "tests"
    elif echo "$files" | grep -q 'deploy/\|observability/\|\.tekton/'; then echo "devops"
    elif echo "$files" | grep -q 'docs/'; then echo "docs"
    elif echo "$files" | grep -q '\.claude/\|scripts/\|Makefile\|\.github/'; then echo "infra"
    else echo "misc"
    fi
}

SCOPE=$(detect_scope)
FILE_COUNT=$(git diff --cached --numstat | wc -l)
LINES_ADDED=$(git diff --cached --numstat | awk '{s+=$1} END {print s+0}')
LINES_DELETED=$(git diff --cached --numstat | awk '{s+=$2} END {print s+0}')

if [[ $FILE_COUNT -eq 1 ]]; then
    SINGLE_FILE=$(git diff --cached --name-only | head -1)
    MSG="feat(${SCOPE}): +${LINES_ADDED}/-${LINES_DELETED} ${SINGLE_FILE}"
else
    MSG="feat(${SCOPE}): +${LINES_ADDED}/-${LINES_DELETED} across ${FILE_COUNT} files"
fi

# Commit
git commit -m "$MSG" --no-verify 2>/dev/null || exit 0

# Stamp cooldown
echo "$NOW" > "$COMMIT_COOLDOWN_FILE"

# ═══════════════════════════════════════════
# PHẦN 2: PUSH (debounce 120s)
# ═══════════════════════════════════════════

# Nếu đang trên main → KHÔNG push, chỉ commit local
if [[ "$BRANCH" == "main" || "$BRANCH" == "master" ]]; then
    exit 0
fi

# Đánh dấu "có commit chờ push"
echo "$NOW" > "$PUSH_MARKER_FILE"

# Check debounce: đã đủ thời gian từ lần push cuối chưa?
PUSH_COOLDOWN_FILE="/tmp/.claude-push-cooldown-${REPO_HASH}"
if [[ -f "$PUSH_COOLDOWN_FILE" ]]; then
    LAST_PUSH=$(cat "$PUSH_COOLDOWN_FILE")
    if [[ $((NOW - LAST_PUSH)) -lt $PUSH_DEBOUNCE ]]; then
        # Chưa đủ debounce, thoát — lần chạy tiếp sẽ push khi đủ
        exit 0
    fi
fi

# ── Push ──
REMOTE=$(git remote 2>/dev/null | head -1)
if [[ -n "$REMOTE" ]]; then
    if ! git rev-parse --abbrev-ref "@{upstream}" >/dev/null 2>&1; then
        git push -u "$REMOTE" "$BRANCH" 2>/dev/null || true
    else
        git push 2>/dev/null || true
    fi

    # Stamp push time
    echo "$NOW" > "$PUSH_COOLDOWN_FILE"
    rm -f "$PUSH_MARKER_FILE"
fi
