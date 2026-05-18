#!/usr/bin/env bash
# Block edits to gate signoff files
git diff --cached --name-status | awk '/^M/ && $2 ~ /gates\/FT.*-G[0-9].*-signoff\.md/ {print "Blocked: gate signoff edit: " $2; exit 1}'
