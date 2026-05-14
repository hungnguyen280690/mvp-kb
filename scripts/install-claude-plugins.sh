#!/usr/bin/env bash
# Cài Claude Code plugin theo .claude/plugins.lock
# Chạy: ./scripts/install-claude-plugins.sh
# Non-interactive — dùng CLI trực tiếp.

set -euo pipefail

cyan() { printf '\033[36m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
yellow() { printf '\033[33m%s\033[0m\n' "$*"; }
red() { printf '\033[31m%s\033[0m\n' "$*"; }

cyan "Claude Code Plugin Installer"
cyan "============================="
echo

command -v claude >/dev/null 2>&1 || { red "Claude Code CLI chưa cài. Tải tại https://claude.com/claude-code"; exit 1; }

# Danh sách plugin bắt buộc — sync với verify-env.sh EXPECTED và plugins.lock
PLUGINS=("superpowers" "security-scanning")

FAIL=0
for plugin in "${PLUGINS[@]}"; do
    if claude plugin list 2>/dev/null | grep -q "$plugin"; then
        green "✅ $plugin — đã cài"
    else
        cyan "→ Đang cài $plugin..."
        if claude plugin install "$plugin" 2>&1; then
            green "✅ $plugin — cài xong"
        else
            red "❌ $plugin — cài thất bại (cần marketplace? chạy: claude plugin marketplace list)"
            FAIL=1
        fi
    fi
done

echo
if [[ $FAIL -eq 1 ]]; then
    red "❌ Có plugin chưa cài được. Dev BẮT BUỘC cài đủ trước khi làm việc."
    echo "   Marketplace có thể thiếu. Kiểm tra: claude plugin marketplace list"
    exit 1
fi

green "✅ Tất cả plugin đã sẵn sàng. Đội đã đồng nhất skill."
