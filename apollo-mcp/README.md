# Apollo MCP Server (this repo)

**Apollo MCP Server** (layer 2 of **Agents → Apollo MCP Server → MCP Apps Client**). Exposes the employee GraphQL API as **MCP tools**; does not include MCP Apps Client (layer 3 — see course doc).

**Course:** [Section 13](../Courses/MODULE_13_APOLLO_MCP_AGENTS.md)

## Ports

| Service | URL |
|---------|-----|
| GraphQL BFF | http://localhost:4000 |
| Apollo MCP Server | http://127.0.0.1:8000/mcp |

## Commands

```bash
npm run dev:backend    # required first
npm run dev:mcp        # start MCP
npm run dev:with-mcp   # backend + MCP
npm run mcp:inspect    # list tools in browser
npm run mcp:install    # optional: install binary to .apollo-mcp/bin/
```

## Files

- `mcp.local.yaml` — server config
- `schema.graphql` — SDL (keep aligned with `backend/src/graphql/schema.ts`)
- `operations/*.graphql` — one named tool per file
- `cursor-mcp.example.json` — sample Cursor MCP config

## Cursor

Add MCP server: `npx -y mcp-remote http://127.0.0.1:8000/mcp` (see example JSON).
