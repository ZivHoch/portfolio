import { useState, useCallback, useRef } from "react";
import { useSession } from "./chat/useSession";
import { useMessages } from "./chat/useMessages";
import { ChatService } from "../services/chatService";

function normalizeMessageInput(input) {
  if (typeof input === "string") return input;
  return input?.message;
}

function sanitizeHistoryForBackend(history) {
  // Only send what the backend needs.
  // Strip UI-only flags like isTyping / isError / retryAfter.
  return (Array.isArray(history) ? history : [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    )
    .map((m) => ({ role: m.role, content: m.content }));
}

export const useStreamingChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { sessionId, startNewSession } = useSession();
  const { messages, addMessage, updateLastMessage, resetMessages } =
    useMessages();

  const shouldStopRef = useRef(false);

  const stopAnswering = useCallback(() => {
    shouldStopRef.current = true;
  }, []);

  const sendMessage = useCallback(
    async (input) => {
      const message = normalizeMessageInput(input);
      if (!message?.trim()) return;

      setIsLoading(true);
      setError(null);
      shouldStopRef.current = false;

      // Build the payload deterministically from current state + the new user message.
      const history = sanitizeHistoryForBackend(messages);
      const nextHistory = [...history, { role: "user", content: message }];

      try {
        // Update local UI immediately
        addMessage({ role: "user", content: message });

        const response = await ChatService.sendMessage({
          sessionId,
          message,
          messages: nextHistory,
        });

        // Handle rate limiting
        if (response?.isRateLimit) {
          addMessage({
            role: "assistant",
            content: response.message,
            isError: true,
            retryAfter: response.retryAfter,
          });
          return;
        }

        let hasStartedStreaming = false;

        await ChatService.handleStreamingResponse(response, {
          onChunk: (chunk) => {
            if (!hasStartedStreaming) {
              addMessage({ role: "assistant", content: chunk, isTyping: true });
              hasStartedStreaming = true;
            } else {
              updateLastMessage(chunk, true);
            }
          },
          onComplete: (finalContent) => {
            if (!hasStartedStreaming && finalContent) {
              addMessage({
                role: "assistant",
                content: finalContent,
                isTyping: false,
              });
            } else if (hasStartedStreaming) {
              updateLastMessage(finalContent, false);
            } else {
              addMessage({
                role: "assistant",
                content: "I couldn't generate a response. Please try again.",
                isTyping: false,
                isError: true,
              });
            }
          },
          shouldStop: () => shouldStopRef.current,
        });
      } catch (err) {
        console.error("❌ Streaming chat error:", err);
        setError(err?.message || "An unexpected error occurred.");
        addMessage({
          role: "assistant",
          content: "Oops! Something went wrong. Please try again later.",
          isError: true,
        });
      } finally {
        setIsLoading(false);
        shouldStopRef.current = false;
      }
    },
    [addMessage, messages, sessionId, updateLastMessage]
  );

  const startNewChat = useCallback(() => {
    const newSessionId = startNewSession();
    resetMessages();
    return newSessionId;
  }, [startNewSession, resetMessages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sessionId,
    startNewChat,
    stopAnswering,
  };
};
