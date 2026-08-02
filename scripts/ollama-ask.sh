#!/usr/bin/env bash
# Ask Ollama via HTTP API — Cursor agent + terminal can call this.
#
# Usage:
#   ./scripts/ollama-ask.sh "Your question"
#   npm run ollama:ask -- "Summarize GraphQL BFF in 2 sentences"
#   OLLAMA_MODEL=mistral ./scripts/ollama-ask.sh "Hello"
#
# Options:
#   --model NAME     Model (default: OLLAMA_MODEL or llama3.2)
#   --system TEXT    System prompt prepended once per session file
#   --json           Print raw JSON response
#   --no-context     Skip default Cursor/Ollama context system message
set -euo pipefail

OLLAMA_URL="${OLLAMA_URL:-http://127.0.0.1:11434}"
OLLAMA_URL="${OLLAMA_URL%/}"
MODEL="${OLLAMA_MODEL:-llama3.2}"
USE_CONTEXT=1
JSON_OUT=0
SYSTEM=""
PROMPT=""

usage() {
  sed -n '2,14p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --model) MODEL="${2:-}"; shift 2 ;;
    --system) SYSTEM="${2:-}"; shift 2 ;;
    --json) JSON_OUT=1; shift ;;
    --no-context) USE_CONTEXT=0; shift ;;
    -h|--help) usage 0 ;;
    -*) echo "Unknown option: $1" >&2; usage 1 ;;
    *) PROMPT="$1"; shift ;;
  esac
done

if [ -z "$PROMPT" ]; then
  echo "Missing prompt. Example: ollama-ask.sh \"What is GraphQL?\"" >&2
  usage 1
fi

if ! curl -sS -m 3 "$OLLAMA_URL/" | grep -q running; then
  echo "Ollama not running at $OLLAMA_URL — open Ollama.app first." >&2
  exit 1
fi

DEFAULT_SYSTEM="You are Ollama, a local LLM on Serge's Mac (API $OLLAMA_URL). When the user says Cursor, they mean the Cursor IDE code editor by Anysphere—not the mouse pointer. The Cursor AI agent can call you via this API using scripts/ollama-ask.sh. Answer clearly and concisely."

if [ "$USE_CONTEXT" -eq 1 ] && [ -z "$SYSTEM" ]; then
  SYSTEM="$DEFAULT_SYSTEM"
elif [ -n "$SYSTEM" ] && [ "$USE_CONTEXT" -eq 1 ]; then
  SYSTEM="$DEFAULT_SYSTEM

$SYSTEM"
fi

json_escape() {
  printf '%s' "$1" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read()))"
}

PROMPT_JSON=$(json_escape "$PROMPT")
BODY="{\"model\":\"$MODEL\",\"messages\":["
if [ -n "$SYSTEM" ]; then
  SYS_JSON=$(json_escape "$SYSTEM")
  BODY="$BODY{\"role\":\"system\",\"content\":$SYS_JSON},"
fi
BODY="$BODY{\"role\":\"user\",\"content\":$PROMPT_JSON}],\"stream\":false}"

RESP=$(curl -sS -m 120 -X POST "$OLLAMA_URL/api/chat" \
  -H 'Content-Type: application/json' \
  -d "$BODY") || { echo "Ollama request failed" >&2; exit 1; }

if [ "$JSON_OUT" -eq 1 ]; then
  echo "$RESP" | python3 -m json.tool
  exit 0
fi

echo "$RESP" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('error'):
    print('ERROR:', d['error'], file=sys.stderr)
    sys.exit(1)
print(d.get('message', {}).get('content', '').strip())
"
