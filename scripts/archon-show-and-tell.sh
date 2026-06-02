#!/usr/bin/env bash
# Publish Cursor presence to Archon (agent heartbeat + workflow:cursor context).
#
# Usage:
#   ./scripts/archon-show-and-tell.sh --activity "Short live activity" [--task "current task"] [--status busy]
#   npm run archon:show -- --activity "Working on Module 8"
#
# Options:
#   --activity   Operator-visible activity (workflow balloon + metadata context) [required]
#   --task       current_task / task_summary (default: same as --activity)
#   --status     Agent status: busy|active|waiting|validating|blocked|inactive (default: busy)
#   --phase      current_phase metadata (optional)
#   --ttl        activity_ttl_seconds for Ops Center balloon (default: 300)
#   --archon-url Archon API base URL (default: ARCHON_URL or http://127.0.0.1:8181)
#   --open       Open lightweight presence viewer in browser (default on macOS)
#   --no-open    Skip opening browser
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHON_URL="${ARCHON_URL:-http://127.0.0.1:8181}"
ARCHON_URL="${ARCHON_URL%/}"
PRESENCE_VIEW_PORT="${ARCHON_PRESENCE_VIEW_PORT:-3877}"

ACTIVITY=""
TASK=""
STATUS="busy"
PHASE=""
TTL=300
OPEN_BROWSER=""

usage() {
  sed -n '2,16p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --activity) ACTIVITY="${2:-}"; shift 2 ;;
    --task) TASK="${2:-}"; shift 2 ;;
    --status) STATUS="${2:-}"; shift 2 ;;
    --phase) PHASE="${2:-}"; shift 2 ;;
    --ttl) TTL="${2:-}"; shift 2 ;;
    --archon-url) ARCHON_URL="${2:-}"; ARCHON_URL="${ARCHON_URL%/}"; shift 2 ;;
    --open) OPEN_BROWSER=1; shift ;;
    --no-open) OPEN_BROWSER=0; shift ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

if [ -z "$OPEN_BROWSER" ]; then
  case "$(uname -s)" in
    Darwin) OPEN_BROWSER=1 ;;
    *) OPEN_BROWSER=0 ;;
  esac
fi

if [ -z "$ACTIVITY" ]; then
  echo "Missing required --activity" >&2
  usage 1
fi

if [ -z "$TASK" ]; then
  TASK="$ACTIVITY"
fi

json_escape() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a' -e 's/\t/\\t/g' -e 's/\r/\\r/g' -e 's/\n/\\n/g' -e 'ta'
}

BRANCH="$(git -C "$ROOT" rev-parse --abbrev-ref HEAD 2>/dev/null || true)"
REPO="$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)"
PROJECT_PATH="$ROOT"
LAST_BEAT="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
ACTIVITY_STARTED_AT="$LAST_BEAT"

register_cursor_agent() {
  curl -sS -m 10 -X POST "$ARCHON_URL/api/agents/register" \
    -H 'Content-Type: application/json' \
    -d '{"name":"cursor","role":"IDE Agent","capabilities":["edit","run","review"],"metadata":{"executor_type":"cursor"}}' \
    >/dev/null 2>&1 || true
}

HEARTBEAT_BODY=$(cat <<EOF
{"status":"$(json_escape "$STATUS")","metadata":{"executor_type":"cursor","project_path":"$(json_escape "$PROJECT_PATH")","repo":"$(json_escape "$REPO")","branch":"$(json_escape "$BRANCH")","task_summary":"$(json_escape "$TASK")","current_phase":"$(json_escape "${PHASE:-show-and-tell}")","operator_visible":true}}
EOF
)

WORKFLOW_BODY=$(cat <<EOF
{"value":{"status":"$(json_escape "$STATUS")","current_task":"$(json_escape "$TASK")","last_beat":"$LAST_BEAT","current_activity":"$(json_escape "$ACTIVITY")","activity_started_at":"$ACTIVITY_STARTED_AT","activity_ttl_seconds":$TTL,"project_path":"$(json_escape "$PROJECT_PATH")","repo":"$(json_escape "$REPO")"},"set_by":"cursor"}
EOF
)

register_cursor_agent

echo "Archon: $ARCHON_URL"
echo "--- POST /api/agents/cursor/heartbeat"
HB_CODE=$(curl -sS -m 10 -o /tmp/archon-hb-$$.json -w "%{http_code}" \
  -X POST "$ARCHON_URL/api/agents/cursor/heartbeat" \
  -H 'Content-Type: application/json' \
  -d "$HEARTBEAT_BODY") || { echo "Heartbeat request failed" >&2; exit 1; }
if [ "$HB_CODE" -ge 400 ] 2>/dev/null; then
  echo "Heartbeat HTTP $HB_CODE — retrying after register"
  register_cursor_agent
  HB_CODE=$(curl -sS -m 10 -o /tmp/archon-hb-$$.json -w "%{http_code}" \
    -X POST "$ARCHON_URL/api/agents/cursor/heartbeat" \
    -H 'Content-Type: application/json' \
    -d "$HEARTBEAT_BODY") || { echo "Heartbeat retry failed" >&2; exit 1; }
fi
echo "HTTP $HB_CODE"
cat /tmp/archon-hb-$$.json
echo ""

echo "--- PUT /api/context/workflow%3Acursor"
WF_CODE=$(curl -sS -m 10 -o /tmp/archon-wf-$$.json -w "%{http_code}" \
  -X PUT "$ARCHON_URL/api/context/workflow%3Acursor" \
  -H 'Content-Type: application/json' \
  -d "$WORKFLOW_BODY") || { echo "Workflow context request failed" >&2; exit 1; }
echo "HTTP $WF_CODE"
cat /tmp/archon-wf-$$.json
echo ""

rm -f /tmp/archon-hb-$$.json /tmp/archon-wf-$$.json

if [ "$HB_CODE" -ge 400 ] 2>/dev/null || [ "$WF_CODE" -ge 400 ] 2>/dev/null; then
  exit 1
fi

ENC_ARCHON=$(printf '%s' "$ARCHON_URL" | python3 -c "import sys, urllib.parse; print(urllib.parse.quote(sys.stdin.read().strip(), safe=''))")
VIEW_URL="http://127.0.0.1:${PRESENCE_VIEW_PORT}/archon-presence-view.html?archon=${ENC_ARCHON}"

ensure_presence_viewer() {
  if lsof -iTCP:"$PRESENCE_VIEW_PORT" -sTCP:LISTEN >/dev/null 2>&1; then
    return 0
  fi
  python3 -m http.server "$PRESENCE_VIEW_PORT" --bind 127.0.0.1 --directory "$ROOT/scripts" \
    >/tmp/archon-presence-view.log 2>&1 &
  disown 2>/dev/null || true
  sleep 0.4
}

if [ "$OPEN_BROWSER" = "1" ]; then
  ensure_presence_viewer
  echo "--- View presence (Cursor-safe)"
  echo "$VIEW_URL"
  if command -v open >/dev/null 2>&1; then
    open "$VIEW_URL"
  fi
else
  echo "--- View: start viewer with: npm run archon:presence"
  echo "$VIEW_URL"
fi
