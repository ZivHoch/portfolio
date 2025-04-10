import { useState, useCallback, useRef } from "react";
import { useSession } from "./chat/useSession";
import { useMessages } from "./chat/useMessages";
import { ChatService } from "../services/chatService";

export const useStreamingChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const { sessionId, startNewSession } = useSession();
  const { messages, addMessage, updateLastMessage, resetMessages } = useMessages();

  const shouldStopRef = useRef(false);

  const stopAnswering = useCallback(() => {
    shouldStopRef.current = true;
  }, []);

  const sendMessage = async ({ message }) => {
    if (!message?.trim()) return;

    setIsLoading(true);
    setError(null);
    shouldStopRef.current = false;

    try {
      const filteredMessages = messages.filter((m) => m.role !== "system");

      // Add user message to local chat state
      addMessage({ role: "user", content: message });

      // Send message to backend
      const response = await ChatService.sendMessage({
        sessionId,
        message,
        messages: filteredMessages,
        timestamp: Date.now() / 1000,
      });

      // Handle rate limiting
      if (response.isRateLimit) {
        addMessage({
          role: "assistant",
          content: response.message,
          isError: true,
          retryAfter: response.retryAfter,
        });
        return;
      }

      let hasStartedStreaming = false;

      // Stream the response
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
            addMessage({ role: "assistant", content: finalContent, isTyping: false });
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
      setError(err.message || "An unexpected error occurred.");
      addMessage({
        role: "assistant",
        content: "Oops! Something went wrong. Please try again later.",
        isError: true,
      });
    } finally {
      setIsLoading(false);
      shouldStopRef.current = false;
    }
  };

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
