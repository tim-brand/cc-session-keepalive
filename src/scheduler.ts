import { sendHelloPrompt } from "./claude";
import type { Config } from "./config";

export interface SchedulerState {
  lastPromptSent: Date | null;
  lastPromptSuccess: boolean | null;
  lastError: string | null;
  promptCount: number;
  isRunning: boolean;
}

const state: SchedulerState = {
  lastPromptSent: null,
  lastPromptSuccess: null,
  lastError: null,
  promptCount: 0,
  isRunning: false,
};

export function getState(): SchedulerState {
  return { ...state };
}

async function sendPrompt(): Promise<void> {
  console.log("[Scheduler] Sending keepalive prompt...");

  const result = await sendHelloPrompt();
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
  state.isRunning = true;

  // Send first prompt immediately
  sendPrompt().catch((err) =>
    console.error("[Scheduler] Initial prompt failed:", err)
  );

  // Then send on interval
  intervalId = setInterval(() => {
    sendPrompt().catch((err) =>
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
