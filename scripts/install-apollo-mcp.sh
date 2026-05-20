#!/usr/bin/env sh
# Install Apollo MCP Server binary into .apollo-mcp/bin/ (macOS/Linux).
# Course: Courses/MODULE_13_APOLLO_MCP_AGENTS.md
# Index:  Courses/SCRIPT_COURSE_LINKS.md
set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN_DIR="$ROOT/.apollo-mcp/bin"
VERSION="${APOLLO_MCP_VERSION:-latest}"

mkdir -p "$BIN_DIR"

echo "Installing Apollo MCP Server (${VERSION}) to ${BIN_DIR}..."
curl -sSL "https://mcp.apollo.dev/download/nix/${VERSION}" | sh

if [ -f "$ROOT/apollo-mcp-server" ]; then
  mv "$ROOT/apollo-mcp-server" "$BIN_DIR/apollo-mcp-server"
  chmod +x "$BIN_DIR/apollo-mcp-server"
  echo "Installed: $BIN_DIR/apollo-mcp-server"
  "$BIN_DIR/apollo-mcp-server" --version || true
else
  echo "Install script did not place apollo-mcp-server in repo root. Check https://www.apollographql.com/docs/apollo-mcp-server/run"
  exit 1
fi
