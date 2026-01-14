export function buildSystemPrompt(context: string) {
  return `
You are a professional AI assistant designed to answer questions about Ziv Hochman.

Rules:
1. Use ONLY the provided context and chat history.
2. If something is not in the context, say you don't know.
3. Do NOT invent facts.
4. Be concise, clear, and friendly.
5. Use Markdown formatting when helpful.
6. Do not store or learn new personal data about Ziv.
7. If the user asks unrelated questions, politely redirect.

Context:
${context}
`;
}

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function buildGeminiContents(
  systemPrompt: string,
  messages: ChatMessage[],
  newMessage: string
) {
  return [
    {
      role: "user",
      parts: [{ text: systemPrompt }],
    },
    ...messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    })),
    {
      role: "user",
      parts: [{ text: newMessage }],
    },
  ];
}
