import type { Config } from "./config";

const CLAUDE_API_BASE = "https://claude.ai/api";

interface Organization {
  uuid: string;
  name: string;
}

async function getOrganizations(sessionKey: string): Promise<Organization[]> {
  const response = await fetch(`${CLAUDE_API_BASE}/organizations`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: `sessionKey=${sessionKey}`,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to get organizations: ${response.status} ${text}`);
  }

  return response.json() as Promise<Organization[]>;
}

async function createConversation(sessionKey: string, orgId: string): Promise<string> {
  const response = await fetch(`${CLAUDE_API_BASE}/organizations/${orgId}/chat_conversations`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Cookie: `sessionKey=${sessionKey}`,
    },
    body: JSON.stringify({
      uuid: crypto.randomUUID(),
      name: "",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create conversation: ${response.status} ${text}`);
  }

  const data = await response.json() as { uuid: string };
  return data.uuid;
}

async function sendMessage(
  sessionKey: string,
  orgId: string,
  conversationId: string,
  message: string
): Promise<void> {
  const response = await fetch(
    `${CLAUDE_API_BASE}/organizations/${orgId}/chat_conversations/${conversationId}/completion`,
    {
      method: "POST",
      headers: {
        Accept: "text/event-stream",
        "Content-Type": "application/json",
        Cookie: `sessionKey=${sessionKey}`,
      },
      body: JSON.stringify({
        prompt: message,
        timezone: "Europe/Amsterdam",
        attachments: [],
        files: [],
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to send message: ${response.status} ${text}`);
  }

  // Consume the stream to complete the request
  if (response.body) {
    const reader = response.body.getReader();
    while (true) {
      const { done } = await reader.read();
      if (done) break;
    }
  }
}

async function deleteConversation(
  sessionKey: string,
  orgId: string,
  conversationId: string
): Promise<void> {
  const response = await fetch(
    `${CLAUDE_API_BASE}/organizations/${orgId}/chat_conversations/${conversationId}`,
    {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Cookie: `sessionKey=${sessionKey}`,
      },
    }
  );

  if (!response.ok) {
    console.warn(`[Claude] Failed to delete conversation: ${response.status}`);
  }
}

export async function sendKeepAlive(config: Config): Promise<{ success: boolean; output: string }> {
  console.log("[Claude] Sending keepalive via claude.ai API...");

  try {
    // Get organization
    const orgs = await getOrganizations(config.sessionKey);
    if (orgs.length === 0) {
      throw new Error("No organizations found");
    }
    const orgId = orgs[0].uuid;
    console.log(`[Claude] Using organization: ${orgs[0].name}`);

    // Create a temporary conversation
    const conversationId = await createConversation(config.sessionKey, orgId);
    console.log("[Claude] Created temporary conversation");

    try {
      // Send a simple message
      await sendMessage(config.sessionKey, orgId, conversationId, "Hi");
      console.log("[Claude] Message sent successfully");
    } finally {
      // Clean up - delete the conversation
      await deleteConversation(config.sessionKey, orgId, conversationId);
      console.log("[Claude] Cleaned up temporary conversation");
    }

    return { success: true, output: "Keepalive successful" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[Claude] Keepalive failed:", message);
    return { success: false, output: message };
  }
}
