#!/usr/bin/env sh
# Live tail of logs/*.log (run in a second terminal while dev:mock-ps is up).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/logs"
touch "$ROOT/logs/mock-ib.log" "$ROOT/logs/backend.log" "$ROOT/logs/frontend.log"

echo "Following logs/*.log — Ctrl+C to stop"
tail -f "$ROOT/logs/mock-ib.log" "$ROOT/logs/backend.log" "$ROOT/logs/frontend.log"
