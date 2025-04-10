// 📁 src/components/Chatbot.jsx
import React, { useState } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const Chatbot = () => {
  const [messages, setMessages] = useState([{ role: "system", content: "Ask me anything about Ziv Hochman!" }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    setError("");
    setLoading(true);

    const userMessage = { role: "user", content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch(`${BACKEND_URL}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          messages: newMessages.filter((m) => m.role !== "system"),
          timestamp: Date.now() / 1000,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Something went wrong.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullReply = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (line.startsWith("0:")) {
            try {
              const content = JSON.parse(line.slice(2));
              fullReply += content;
              setMessages([...newMessages, { role: "assistant", content: fullReply }]);
            } catch (err) {
              console.error("Failed to parse chunk:", err);
            }
          }
        }
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullReply }]);
    } catch (err) {
      console.error("❌ Chat error:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">
      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={m.role}>
            <strong>{m.role === "user" ? "You" : m.role === "assistant" ? "Bot" : ""}</strong>: {m.content}
          </div>
        ))}
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." disabled={loading} />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? "Sending..." : "Send"}
      </button>
    </div>
  );
};

export default Chatbot;
