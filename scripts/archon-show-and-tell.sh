#!/usr/bin/env bash
# Publish Cursor presence to Archon (agent heartbeat + workflow:cursor context).
#
# Usage:
#   ./scripts/archon-show-and-tell.sh --activity "Short live activity" [--task "current task"] [--status busy]
#   ARCHON_URL=http://127.0.0.1:8181 ./scripts/archon-show-and-tell.sh --activity "..." --task "..."
#
# Options:
#   --activity   Operator-visible activity (workflow balloon + metadata context)
#   --task       current_task / task_summary (default: same as --activity)
#   --status     Agent status: busy|active|waiting|validating|blocked|inactive (default: busy)
#   --phase      current_phase metadata (optional)
#   --archon-url Archon base URL (default: ARCHON_URL or http://127.0.0.1:8181)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARCHON_URL="${ARCHON_URL:-http://127.0.0.1:8181}"
ARCHON_URL="${ARCHON_URL%/}"

ACTIVITY=""
TASK=""
STATUS="busy"
PHASE=""

usage() {
  sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'
  exit "${1:-0}"
}

while [ $# -gt 0 ]; do
  case "$1" in
    --activity) ACTIVITY="${2:-}"; shift 2 ;;
    --task) TASK="${2:-}"; shift 2 ;;
    --status) STATUS="${2:-}"; shift 2 ;;
    --phase) PHASE="${2:-}"; shift 2 ;;
    --archon-url) ARCHON_URL="${2:-}"; ARCHON_URL="${ARCHON_URL%/}"; shift 2 ;;
    -h|--help) usage 0 ;;
    *) echo "Unknown option: $1" >&2; usage 1 ;;
  esac
done

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
TTL=60

PHASE_JSON=""
if [ -n "$PHASE" ]; then
  PHASE_JSON=",\"current_phase\":\"$(json_escape "$PHASE")\""
fi

HEARTBEAT_BODY=$(cat <<EOF
{"status":"$(json_escape "$STATUS")","metadata":{"executor_type":"cursor","project_path":"$(json_escape "$PROJECT_PATH")","repo":"$(json_escape "$REPO")","branch":"$(json_escape "$BRANCH")","task_summary":"$(json_escape "$TASK")","current_phase":"$(json_escape "${PHASE:-show-and-tell}")","operator_visible":true}}
EOF
)

WORKFLOW_BODY=$(cat <<EOF
{"value":{"status":"$(json_escape "$STATUS")","current_task":"$(json_escape "$TASK")","last_beat":"$LAST_BEAT","current_activity":"$(json_escape "$ACTIVITY")","activity_started_at":"$ACTIVITY_STARTED_AT","activity_ttl_seconds":$TTL,"project_path":"$(json_escape "$PROJECT_PATH")","repo":"$(json_escape "$REPO")"},"set_by":"cursor"}
EOF
)

echo "Archon: $ARCHON_URL"
echo "--- POST /api/agents/cursor/heartbeat"
echo "$HEARTBEAT_BODY"
HB_CODE=$(curl -sS -m 10 -o /tmp/archon-hb-$$.json -w "%{http_code}" \
  -X POST "$ARCHON_URL/api/agents/cursor/heartbeat" \
  -H 'Content-Type: application/json' \
  -d "$HEARTBEAT_BODY") || { echo "Heartbeat request failed" >&2; exit 1; }
echo "HTTP $HB_CODE"
cat /tmp/archon-hb-$$.json
echo ""

echo "--- PUT /api/context/workflow%3Acursor"
echo "$WORKFLOW_BODY"
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
