import { loadConfig } from "./config";
import { createServer } from "./server";
import { startScheduler, stopScheduler } from "./scheduler";

console.log("[Main] Starting CC Session Keepalive...");

const config = loadConfig();
const app = createServer(config);

// Start the usage check scheduler
startScheduler(config);

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("[Main] Received SIGTERM, shutting down...");
  stopScheduler();
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("[Main] Received SIGINT, shutting down...");
  stopScheduler();
  process.exit(0);
});

console.log(`[Main] HTTP server listening on port ${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
