// 📁 src/components/Chatbot.jsx
import React, { useState } from "react";

const Chatbot = () => {
  const [messages, setMessages] = useState([{ role: "system", content: "Ask me anything about Ziv Hochman!" }]);
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input) return;
    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const res = await fetch("/.netlify/functions/chatbot", {
      method: "POST",
      body: JSON.stringify({ messages: newMessages }),
    });
    const data = await res.json();
    setMessages([...newMessages, { role: "assistant", content: data.reply }]);
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
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask something..." />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
};

export default Chatbot;
