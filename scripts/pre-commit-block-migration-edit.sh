#!/usr/bin/env bash
# Block edits to merged migration SQL files
git diff --cached --name-status | awk '/^M/ && $2 ~ /db\/.*\.sql/ {print "Blocked: migration edit: " $2; exit 1}'
