// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export type ChatMode = "general" | "context";

export interface ChatContext {
  mode: ChatMode;
  service: string;
  attribute: string;
  contextText?: string;  // raw key:value from DB
  promptText?: string;   // prompt instruction from DB
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

import api from "./axios";

// ─── sendMessage ─────────────────────────────────────────────────────────────
// Calls the backend ChatController

export async function sendMessage(
  message: string,
  history: ChatMessage[],
  context: ChatContext
): Promise<string> {
  if (context.mode === "context" && !context.service) {
    return "Please select a category and service from the right panel so I can assist you better. 😊";
  }

  try {
    const res = await api.post("/admin/chat", {
      message,
      chat: history,
      context
    });

    // Check if backend returned the raw Groq/OpenAI response format
    if (res.data && res.data.choices && res.data.choices.length > 0) {
      let content = res.data.choices[0].message.content;
      
      // If the backend forced 'json_object', try to extract the main text gracefully
      try {
        const parsed = JSON.parse(content);
        if (parsed.reply) content = parsed.reply;
        else if (parsed.response) content = parsed.response;
        else if (parsed.message) content = parsed.message;
        else if (Object.keys(parsed).length === 1) content = Object.values(parsed)[0];
      } catch (e) {
        // Not JSON, just use raw text
      }
      
      return content;
    }

    // Fallback for wrapped response format
    if (res.data.status === true && res.data.data && res.data.data.reply) {
      return res.data.data.reply;
    }

    if (res.data.error) {
      return "API Error: " + (res.data.error.message || "Unknown error");
    }

    return "Error: " + (res.data.message || "Failed to process chat");
  } catch (err: any) {
    console.error("Chat error:", err);
    return "Network error communicating with the chat server.";
  }
}
