import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(__dirname, "../../backend");

function resolvePython() {
  const candidates = [
    path.join(backendDir, "venv", "bin", "python"),
    path.join(backendDir, "venv", "Scripts", "python.exe"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return process.platform === "win32" ? "python" : "python3";
}

const python = resolvePython();
const child = spawn(python, ["run_server.py"], {
  cwd: backendDir,
  stdio: "inherit",
  env: { ...process.env, UVICORN_RELOAD: "true" },
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
