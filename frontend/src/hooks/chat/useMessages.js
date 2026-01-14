import { useCallback, useRef, useState } from "react";

const DEFAULT_INITIAL_MESSAGES = [
  {
    role: "assistant",
    content:
      "Hey there! 👋 I'm Ziv's AI assistant, I have access to his writings, and life insights. Feel free to ask and explore about his professional path or personal growth!",
  },
];

export const useMessages = (initialMessages = DEFAULT_INITIAL_MESSAGES) => {
  // Capture the initial messages once, so `resetMessages` always resets to the same baseline
  const initialRef = useRef(
    Array.isArray(initialMessages) && initialMessages.length > 0
      ? initialMessages
      : DEFAULT_INITIAL_MESSAGES
  );

  const [messages, setMessages] = useState(() => initialRef.current);

  const addMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const updateLastMessage = useCallback((content, isTyping = true) => {
    setMessages((prev) => {
      if (!prev.length) return prev;
      const next = [...prev];
      const last = next[next.length - 1];
      next[next.length - 1] = {
        ...last,
        content,
        isTyping,
      };
      return next;
    });
  }, []);

  const resetMessages = useCallback(() => {
    setMessages(initialRef.current);
  }, []);

  return {
    messages,
    setMessages,
    addMessage,
    updateLastMessage,
    resetMessages,
  };
};
