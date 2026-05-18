#!/usr/bin/env bash
# Block edits to gate signoff files
# Also block any gate file that contains "auto-signed" text (unsigned/automated signoffs)
set -euo pipefail

blocked=0

# 1. Block modifications to existing gate signoff files
git diff --cached --name-status | awk '/^M/ && $2 ~ /gates\/FT.*-G[0-9].*-signoff\.md/ {print "Blocked: gate signoff edit: " $2; exit 1}' || blocked=1

# 2. Block any staged gate file containing "auto-signed" text
staged_gate_files=$(git diff --cached --name-only | grep 'gates/FT.*-G[0-9]' || true)
for f in $staged_gate_files; do
  if git show ":$f" 2>/dev/null | grep -qi 'auto-signed'; then
    echo "Blocked: gate file contains 'auto-signed' text: $f"
    blocked=1
  fi
done

exit $blocked
