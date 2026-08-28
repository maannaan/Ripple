import { createRippleMcpApp } from "./mcp-app.js";
import { closePool } from "./db.js";

const PORT = Number(process.env.MCP_SERVER_PORT ?? 3100);
const app = createRippleMcpApp();

const server = app.listen(PORT, () => {
  console.log(`Ripple MCP server listening on http://localhost:${PORT}`);
  console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

async function shutdown(): Promise<void> {
  server.close();
  await closePool();
  process.exit(0);
}

process.on("SIGINT", () => shutdown());
process.on("SIGTERM", () => shutdown());
