import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";
import { readContext } from "../libr/readContext.js";
import {
  buildSystemPrompt,
  buildGeminiContents,
  type ChatMessage,
} from "../libr/prompt.js";

const allowedOrigins = new Set([
  "http://localhost:5173",
  "http://localhost:3000",
  "https://zivdev.netlify.app",
  "https://my-portfolio-seven-mauve-33.vercel.app",
]);

function setCors(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || "";
  if (allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(req, res);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).end("Method Not Allowed");
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
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.5-flash-lite",
      contents,
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      if (!chunkText) continue;
      res.write(`0:${JSON.stringify(chunkText)}\n`);
    }

    res.end();
  } catch (e) {
    console.error("Gemini error:", e);
    res.write(
      `0:${JSON.stringify("Sorry — I couldn't generate a response.")}\n`
    );
    res.end();
  }
}
