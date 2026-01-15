import { Hono } from "hono";
import { getState } from "./scheduler";
import type { Config } from "./config";

export function createServer(config: Config) {
  const app = new Hono();

  app.get("/health", (c) => {
    const state = getState();
    // Healthy if running and last prompt was successful (or no prompt sent yet)
    const healthy = state.isRunning && (state.lastPromptSuccess !== false);

    c.status(healthy ? 200 : 503);
    return c.json({
      status: healthy ? "healthy" : "unhealthy",
      isRunning: state.isRunning,
      hasError: !!state.lastError,
    });
  });

  app.get("/status", (c) => {
    const state = getState();
    const intervalHours = (config.promptIntervalMs / 3600000).toFixed(1);

    return c.json({
      isRunning: state.isRunning,
      promptCount: state.promptCount,
      lastPromptSent: state.lastPromptSent?.toISOString() ?? null,
      lastPromptSuccess: state.lastPromptSuccess,
      lastError: state.lastError,
      config: {
        promptIntervalMs: config.promptIntervalMs,
        promptIntervalHours: intervalHours,
      },
    });
  });

  return app;
}
