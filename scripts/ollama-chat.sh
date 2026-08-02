#!/usr/bin/env bash
# Serve local Ollama browser chat (works in Cursor Simple Browser).
# Usage: ./scripts/ollama-chat.sh   OR   npm run ollama:chat
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PORT="${OLLAMA_CHAT_PORT:-3878}"
OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
MODEL="${OLLAMA_CHAT_MODEL:-llama3.2:latest}"

if ! curl -sS -m 3 "$OLLAMA_URL/" | grep -q running; then
  echo "Ollama not running at $OLLAMA_URL — open Ollama.app first" >&2
  exit 1
fi

if ! lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --bind 127.0.0.1 --directory "$ROOT/scripts" &
  echo "Chat server on :$PORT (pid $!)"
  sleep 0.3
fi

ENC=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$OLLAMA_URL', safe=''))")
URL="http://127.0.0.1:${PORT}/ollama-chat.html?ollama=${ENC}&model=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$MODEL', safe=''))")"
echo "$URL"
command -v open >/dev/null && open "$URL"
