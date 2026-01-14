import { useState, useEffect } from "react";

function generateSessionId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export const useSession = () => {
  const [sessionId, setSessionId] = useState("");

  useEffect(() => {
    initializeSession();
  }, []);

  const initializeSession = () => {
    const existingSessionId = localStorage.getItem("chatSessionId");
    if (existingSessionId) {
      setSessionId(existingSessionId);
    } else {
      const newSessionId = generateSessionId();
      localStorage.setItem("chatSessionId", newSessionId);
      setSessionId(newSessionId);
    }
  };

  const startNewSession = () => {
    const newSessionId = generateSessionId();
    localStorage.setItem("chatSessionId", newSessionId);
    setSessionId(newSessionId);
    return newSessionId;
  };

  return { sessionId, startNewSession };
};
