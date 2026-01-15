export interface Config {
  oauthToken: string;
  promptIntervalMs: number;
  port: number;
}

export function loadConfig(): Config {
  const oauthToken = process.env.CLAUDE_CODE_OAUTH_TOKEN;
  if (!oauthToken) {
    throw new Error("CLAUDE_CODE_OAUTH_TOKEN environment variable is required");
  }

  // Default: 4 hours (14400000ms), minimum: 30 seconds (30000ms)
  const promptIntervalMs = parseInt(process.env.PROMPT_INTERVAL_MS || "14400000", 10);
  if (isNaN(promptIntervalMs) || promptIntervalMs < 30_000) {
    throw new Error("PROMPT_INTERVAL_MS must be a number >= 30000 (30 seconds)");
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number (1-65535)");
  }

  return {
    oauthToken,
    promptIntervalMs,
    port,
  };
}
