#!/usr/bin/env sh
# Run mock-ps + backend + frontend; mirror each service log to logs/*.log AND the console.
# Course: CODE_PATH_GRAPHQL_TO_PS.md (filter [trace] in this output)
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p logs
: > logs/mock-ib.log
: > logs/backend.log
: > logs/frontend.log

if [ ! -f backend/.env ] || ! grep -q 'integration-broker' backend/.env 2>/dev/null; then
  echo "Using backend/.env.mock-ib.example → backend/.env (integration-broker + :4100)"
  cp backend/.env.mock-ib.example backend/.env
fi

echo "Dev logs → console + logs/{mock-ib,backend,frontend}.log"
echo "Filter traces: grep '\\[trace\\]' or run in another terminal: npm run logs:follow"
echo ""

export FORCE_COLOR=1
exec npx concurrently \
  -k \
  -n mock-ps,backend,frontend \
  -c magenta,blue,green \
  --timestamp-format "HH:mm:ss" \
  "npm run mock-ib --prefix backend 2>&1 | tee -a logs/mock-ib.log" \
  "npm run dev --prefix backend 2>&1 | tee -a logs/backend.log" \
  "npm run dev --prefix frontend 2>&1 | tee -a logs/frontend.log"
