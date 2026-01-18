import { readFile } from "node:fs/promises";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cachedContext: string | null = null;

/**
 * Reads the about-me markdown file once and caches it in memory.
 * This is safe for serverless because each warm instance can reuse it.
 */
export async function readContext(): Promise<string> {
  if (cachedContext) return cachedContext;

  try {
    const contextPath = path.join(__dirname, "..", "knowledge", "about-me.md");
    cachedContext = await readFile(contextPath, "utf8");
  } catch {
    cachedContext = ""; // Fail gracefully if file is missing
  }

  return cachedContext;
}
