import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { readContext } from "../lib/readContext";
import {
  buildSystemPrompt,
  buildGeminiContents,
  type ChatMessage,
} from "../lib/prompt";

// Vercel Node.js Function: (req, res)
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  // Ensure streaming headers
  res.writeHead(200, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  // Vercel often provides req.body already. If it's a string, parse it.
  let body: any = req.body;
  if (!body) {
    // Fallback: read raw body
    const chunks: Buffer[] = [];
    for await (const c of req)
      chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c));
    body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } else if (typeof body === "string") {
    body = JSON.parse(body);
  }

  const { message, messages = [] } = (body || {}) as {
    message?: string;
    messages?: ChatMessage[];
  };
  const text = (message || "").trim();
  if (!text) {
    res.write(`0:${JSON.stringify("Please type a message.")}\n`);
    res.end();
    return;
  }

  const ctx = await readContext();
  const systemPrompt = buildSystemPrompt(ctx);
  const contents = buildGeminiContents(systemPrompt, messages, text);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.write(
      `0:${JSON.stringify("Server misconfigured: GEMINI_API_KEY missing.")}\n`
    );
    res.end();
    return;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Streaming response: yields chunks as generated  [oai_citation:3‡Google APIs](https://googleapis.github.io/js-genai/release_docs/index.html)
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash",
      contents,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      if (!chunkText) continue;

      // Your frontend expects lines like: 0:"text"\n
      res.write(`0:${JSON.stringify(chunkText)}\n`);
    }

    res.end();
  } catch (e) {
    res.write(
      `0:${JSON.stringify("Sorry — I couldn't generate a response.")}\n`
    );
    res.end();
  }
}
