import { sendKeepAlive } from "./claude";
import type { Config } from "./config";

export interface SchedulerState {
  lastPromptSent: Date | null;
  lastPromptSuccess: boolean | null;
  lastError: string | null;
  promptCount: number;
  skippedDueToSilence: number;
  isRunning: boolean;
  isInSilenceHours: boolean;
}

const state: SchedulerState = {
  lastPromptSent: null,
  lastPromptSuccess: null,
  lastError: null,
  promptCount: 0,
  skippedDueToSilence: 0,
  isRunning: false,
  isInSilenceHours: false,
};

export function getState(): SchedulerState {
  return { ...state };
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function getCurrentTimeInTimezone(timezone: string): { hours: number; minutes: number } {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return parseTime(timeStr);
}

function isInSilenceHours(config: Config): boolean {
  const current = getCurrentTimeInTimezone(config.timezone);
  const start = parseTime(config.silenceStart);
  const end = parseTime(config.silenceEnd);

  const currentMinutes = current.hours * 60 + current.minutes;
  const startMinutes = start.hours * 60 + start.minutes;
  const endMinutes = end.hours * 60 + end.minutes;

  // Handle overnight silence (e.g., 01:00 to 07:00)
  if (startMinutes < endMinutes) {
    // Normal case: start and end on same day
    return currentMinutes >= startMinutes && currentMinutes < endMinutes;
  } else {
    // Overnight case: e.g., 22:00 to 06:00
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }
}

export function checkSilenceHours(config: Config): boolean {
  const inSilence = isInSilenceHours(config);
  state.isInSilenceHours = inSilence;
  return inSilence;
}

async function sendPromptIfAllowed(config: Config): Promise<void> {
  if (checkSilenceHours(config)) {
    const current = getCurrentTimeInTimezone(config.timezone);
    console.log(
      `[Scheduler] In silence hours (${config.silenceStart}-${config.silenceEnd}), ` +
        `current time: ${current.hours.toString().padStart(2, "0")}:${current.minutes.toString().padStart(2, "0")} ${config.timezone} - skipping prompt`
    );
    state.skippedDueToSilence++;
    return;
  }

  console.log("[Scheduler] Sending keepalive...");

  const result = await sendKeepAlive(config);
  state.lastPromptSent = new Date();
  state.promptCount++;

  if (result.success) {
    console.log("[Scheduler] Prompt sent successfully");
    state.lastPromptSuccess = true;
    state.lastError = null;
  } else {
    console.error("[Scheduler] Prompt failed:", result.output);
    state.lastPromptSuccess = false;
    state.lastError = result.output;
  }
}

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startScheduler(config: Config): void {
  if (state.isRunning) {
    console.log("[Scheduler] Already running");
    return;
  }

  const intervalHours = (config.promptIntervalMs / 3600000).toFixed(1);
  console.log(`[Scheduler] Starting with ${intervalHours}h interval`);
  console.log(`[Scheduler] Silence hours: ${config.silenceStart}-${config.silenceEnd} (${config.timezone})`);
  state.isRunning = true;

  // Send first prompt immediately (unless in silence hours)
  sendPromptIfAllowed(config).catch((err) =>
    console.error("[Scheduler] Initial prompt failed:", err)
  );

  // Then send on interval
  intervalId = setInterval(() => {
    sendPromptIfAllowed(config).catch((err) =>
      console.error("[Scheduler] Scheduled prompt failed:", err)
    );
  }, config.promptIntervalMs);
}

export function stopScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  state.isRunning = false;
  console.log("[Scheduler] Stopped");
}
