#!/usr/bin/env sh
# Stop Docker stack and free ports 3000, 3001, 4000, 4100 (macOS/Linux).
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Stopping Docker Compose..."
docker compose down 2>/dev/null || true

for port in 3000 3001 4000 4100; do
  pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (PID $pids)..."
    kill $pids 2>/dev/null || true
  fi
done

echo "Done. Ports 3000, 3001, 4000, 4100 should be free."
echo ""
echo "Then choose ONE:"
echo "  Docker:  docker compose up --build   →  http://localhost:3001"
echo "  Local:   npm run dev:mock-ps         →  http://localhost:3000"
