# Kiro workspace setup

This repo includes Kiro workspace files:

- Steering: `.kiro/steering/` (start with `product.md`, `tech.md`, `structure.md`)
- MCP config: `.kiro/settings/mcp.json`

The example MCP server (`brave_search`) is checked in but disabled. To use it:

1. Set `BRAVE_API_KEY` in your shell/OS environment (or add it to the server’s `env` block in `mcp.json`)
2. Flip `"disabled": false`

