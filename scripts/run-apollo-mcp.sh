#!/usr/bin/env sh
# Start Apollo MCP Server for this repo's GraphQL BFF (:4000 → MCP :8000).
#
# Course: Courses/MODULE_13_APOLLO_MCP_AGENTS.md
# To pick: (optional advanced — after Module 5)
# Index:  Courses/SCRIPT_COURSE_LINKS.md
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MCP_DIR="$ROOT/apollo-mcp"
CONFIG="$MCP_DIR/mcp.local.yaml"
BIN="$ROOT/.apollo-mcp/bin/apollo-mcp-server"

if [ ! -f "$CONFIG" ]; then
  echo "Missing $CONFIG"
  exit 1
fi

run_binary() {
  echo "GraphQL endpoint: http://127.0.0.1:4000/"
  echo "MCP endpoint:     http://127.0.0.1:8000/mcp"
  echo "Start backend first: npm run dev:backend  (or npm run dev)"
  cd "$MCP_DIR"
  exec "$BIN" "$CONFIG"
}

run_docker() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker not found. Run: npm run mcp:install  OR install Docker."
    exit 1
  fi
  echo "GraphQL endpoint (from container): http://host.docker.internal:4000/"
  echo "MCP endpoint (host):               http://127.0.0.1:8000/mcp"
  echo "Start backend on host first: npm run dev:backend"
  docker run -it --rm \
    --name peoplesoft-apollo-mcp \
    -p 8000:8000 \
    -e APOLLO_MCP_ENDPOINT=http://host.docker.internal:4000/ \
    -v "$MCP_DIR/mcp.local.yaml:/config.yaml:ro" \
    -v "$MCP_DIR:/data:ro" \
    -w /data \
    ghcr.io/apollographql/apollo-mcp-server:latest \
    /config.yaml
}

if [ "${APOLLO_MCP_USE_DOCKER:-}" = "1" ]; then
  run_docker
elif [ -x "$BIN" ]; then
  run_binary
elif command -v docker >/dev/null 2>&1; then
  echo "No local binary ($BIN). Using Docker (set APOLLO_MCP_USE_DOCKER=0 after npm run mcp:install)."
  run_docker
else
  echo "Install Apollo MCP Server: npm run mcp:install"
  echo "Or install Docker and re-run: npm run dev:mcp"
  exit 1
fi
