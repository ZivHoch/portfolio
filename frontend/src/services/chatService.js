function resolveBackendUrl() {
  let url = (import.meta.env.VITE_BACKEND_URL || "http://localhost:8000").trim();
  // Normalize: no trailing slash, no accidental /chat suffix
  url = url.replace(/\/+$/, "");
  if (url.endsWith("/chat")) {
    url = url.slice(0, -5);
  }
  return url;
}

const BACKEND_URL = resolveBackendUrl();

export class ChatService {
  static async handleStreamingResponse(response, callbacks) {
    if (!response.body) {
      console.error("❌ No response body for stream.");
      throw new Error("Streaming not supported.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = "";

    try {
      while (true) {
        if (callbacks.shouldStop?.()) {
          await reader.cancel();
          callbacks.onComplete(fullMessage);
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          callbacks.onComplete(fullMessage);
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim() === "") continue;

          const match = line.match(/^0:(.+)$/);
          if (match) {
            try {
              const content = JSON.parse(match[1]);
              fullMessage += content;
              callbacks.onChunk(fullMessage);
            } catch (e) {
              console.error("❌ Failed to parse JSON chunk:", e, line);
            }
          } else {
            console.warn("⚠️ Unrecognized stream format:", line);
          }
        }
      }
    } catch (e) {
      console.error("❌ Error while reading response stream:", e);
      throw new Error("Failed to process chat stream.");
    }
  }

  static async handleError(response) {
    let errorData;
    try {
      const text = await response.text();
      errorData = JSON.parse(text);
    } catch {
      errorData = { detail: "Unexpected error (non-JSON response)" };
    }

    if (response.status === 429) {
      return {
        isRateLimit: true,
        message:
          errorData.friendly_message ||
          "You're sending messages too quickly. Please wait.",
        retryAfter: errorData.retry_after,
      };
    }

    throw new Error(errorData.detail || "Unknown error occurred.");
  }

  static async sendMessage(chatRequest) {
    const message = (chatRequest?.message || "").trim();
    if (!message) {
      throw new Error("Missing chat message");
    }

    const sessionId = chatRequest.session_id || chatRequest.sessionId;

    const payload = {
      message,
      session_id: sessionId,
      messages: (chatRequest.messages || []).map(({ role, content }) => ({
        role,
        content,
      })),
    };

    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return this.handleError(response);
    }

    return response;
  }
}
