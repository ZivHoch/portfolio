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

      addMessage({ role: "user", content: message });

      const response = await ChatService.sendMessage({
        sessionId,
        message,
        messages: filteredMessages,
        timestamp: Date.now() / 1000,
      });

      if (response.isRateLimit) {
        addMessage({
          role: "assistant",
          content: response.message,
          isError: true,
          retryAfter: response.retryAfter,
        });
        setIsLoading(false);
        return;
      }

      let hasStartedStreaming = false;

      await ChatService.handleStreamingResponse(response, {
        onChunk: (content) => {
          if (!hasStartedStreaming) {
            addMessage({ role: "assistant", content, isTyping: true });
            hasStartedStreaming = true;
          } else {
            updateLastMessage(content, true);
          }
        },
        onComplete: (content) => {
          if (!hasStartedStreaming && content) {
            addMessage({ role: "assistant", content, isTyping: false });
          } else if (hasStartedStreaming) {
            updateLastMessage(content, false);
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
