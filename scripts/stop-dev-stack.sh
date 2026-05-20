#!/usr/bin/env sh
# Stop Docker stack and free ports 3000, 3001, 4000, 4100 (macOS/Linux).
#
# Course: Courses/COURSE.md#module-2--the-three-runtimes-ports
# To pick: Courses/COURSE.md#troubleshooting-guide
#          Courses/DOCKER_AND_IB_CONFIGURE.md#part-a--docker-mock-stack-your-machine
# Index:  Courses/SCRIPT_COURSE_LINKS.md
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "Stopping Docker Compose..."
docker compose down 2>/dev/null || true

for port in 3000 3001 4000 4100 8000; do
  pids=$(lsof -t -iTCP:"$port" -sTCP:LISTEN 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo "Freeing port $port (PID $pids)..."
    kill $pids 2>/dev/null || true
  fi
done

echo "Done. Ports 3000, 3001, 4000, 4100, 8000 should be free."
echo ""
echo "Then choose ONE:"
echo "  Docker:  docker compose up --build   →  http://localhost:3001"
echo "  Local:   npm run dev:mock-ps         →  http://localhost:3000"
echo ""
echo "Course: Courses/SCRIPT_COURSE_LINKS.md (stack:stop | dev:mock-ps | stack:docker — To pick)"
