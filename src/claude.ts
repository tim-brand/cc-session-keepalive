import { spawn } from "bun";

export async function sendHelloPrompt(): Promise<{ success: boolean; output: string }> {
  console.log("[Claude] Sending 'Hello' prompt to start new session...");

  try {
    const proc = spawn({
      cmd: ["claude", "-p", "Hello", "--verbose"],
      stdin: "ignore",
      stdout: "pipe",
      stderr: "pipe",
      env: {
        ...process.env,
        // Ensure Claude uses the OAuth token from environment
        CLAUDE_CODE_OAUTH_TOKEN: process.env.CLAUDE_CODE_OAUTH_TOKEN,
        // Disable interactive prompts
        CI: "true",
      },
    });

    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();
    const exitCode = await proc.exited;

    if (exitCode !== 0) {
      console.error("[Claude] Command failed with exit code:", exitCode);
      console.error("[Claude] stderr:", stderr);
      return { success: false, output: stderr || stdout };
    }

    console.log("[Claude] Session started successfully");
    return { success: true, output: stdout };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Claude] Failed to execute command:", message);
    return { success: false, output: message };
  }
}
