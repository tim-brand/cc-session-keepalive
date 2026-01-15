export interface Config {
  sessionKey: string;
  promptIntervalMs: number;
  port: number;
  timezone: string;
  silenceStart: string;
  silenceEnd: string;
}

export function loadConfig(): Config {
  const sessionKey = process.env.SESSION_KEY;
  if (!sessionKey) {
    throw new Error("SESSION_KEY environment variable is required (extract from claude.ai cookies)");
  }

  // Default: 1 hour (3600000ms), minimum: 30 seconds (30000ms)
  const promptIntervalMs = parseInt(process.env.PROMPT_INTERVAL_MS || "3600000", 10);
  if (isNaN(promptIntervalMs) || promptIntervalMs < 30_000) {
    throw new Error("PROMPT_INTERVAL_MS must be a number >= 30000 (30 seconds)");
  }

  const port = parseInt(process.env.PORT || "3000", 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be a valid port number (1-65535)");
  }

  const timezone = process.env.TIMEZONE || "Europe/Amsterdam";
  const silenceStart = process.env.SILENCE_START || "01:00";
  const silenceEnd = process.env.SILENCE_END || "07:00";

  // Validate time format (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(silenceStart)) {
    throw new Error("SILENCE_START must be in HH:MM format (e.g., 01:00)");
  }
  if (!timeRegex.test(silenceEnd)) {
    throw new Error("SILENCE_END must be in HH:MM format (e.g., 07:00)");
  }

  return {
    sessionKey,
    promptIntervalMs,
    port,
    timezone,
    silenceStart,
    silenceEnd,
  };
}
