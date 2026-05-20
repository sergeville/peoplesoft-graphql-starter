#!/usr/bin/env sh
# Print all dev stack log files to the console (historical snapshot).
# Live stream: npm run logs:follow
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "=== peoplesoft-graphql-starter dev logs ==="
echo ""

for f in \
  "$ROOT/logs/mock-ib.log" \
  "$ROOT/logs/backend.log" \
  "$ROOT/logs/frontend.log" \
  "$ROOT/logs/combined.log" \
  /tmp/ps-mock-ib.log \
  /tmp/ps-backend.log \
  /tmp/ps-server-direct.log
do
  if [ -f "$f" ]; then
    echo "────────── $f ──────────"
    cat "$f"
    echo ""
  fi
done

TERMS="$ROOT/../.cursor/projects" 2>/dev/null || true
# Cursor terminal captures (when present)
CURSOR_TERMS="$HOME/.cursor/projects/Users-sergevilleneuve-Documents-Projects-peoplesoft-graphql-starter/terminals"
if [ -d "$CURSOR_TERMS" ]; then
  for f in "$CURSOR_TERMS"/*.txt; do
    [ -f "$f" ] || continue
    echo "────────── $f ──────────"
    tail -80 "$f"
    echo ""
  done
fi

echo "Done. Start stack with logs: npm run dev:mock-ps"
