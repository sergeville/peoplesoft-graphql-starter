#!/usr/bin/env bash
# Serve the lightweight Archon presence viewer (works in Cursor Simple Browser).
#
# Usage: ./scripts/archon-presence-view.sh
#   npm run archon:presence
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${ARCHON_PRESENCE_VIEW_PORT:-3877}"
ARCHON_URL="${ARCHON_URL:-http://127.0.0.1:8181}"
ARCHON_URL="${ARCHON_URL%/}"

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Presence viewer already on :$PORT"
else
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/scripts" &
  echo "Started presence viewer on :$PORT (pid $!)"
  sleep 0.3
fi

ENC_ARCHON=$(printf '%s' "$ARCHON_URL" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))")
URL="http://127.0.0.1:${PORT}/archon-presence-view.html?archon=${ENC_ARCHON}"
echo "$URL"
command -v open >/dev/null 2>&1 && open "$URL"
