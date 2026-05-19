/**
 * Fetches GitHub repos and writes frontend/public/data/repos.json.
 * Run manually or on a schedule (e.g. daily CI): npm run sync:repos
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FRONTEND_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(__dirname, "../..");
const OUT = path.resolve(FRONTEND_ROOT, "public/data/repos.json");

/** Load KEY=VALUE pairs from .env into process.env (does not override existing). */
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, "utf8");
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile(path.join(FRONTEND_ROOT, ".env"));
loadEnvFile(path.join(REPO_ROOT, ".env"));

const username = process.env.VITE_GITHUB_USERNAME || process.env.GITHUB_USERNAME;
const token = process.env.VITE_GITHUB_TOKEN || process.env.GITHUB_TOKEN;

if (!username) {
  console.error(
    "Missing GitHub username. Add to frontend/.env:\n  VITE_GITHUB_USERNAME=your_github_handle"
  );
  process.exit(1);
}

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "portfolio-sync",
};
if (token) headers.Authorization = `Bearer ${token}`;

async function fetchJson(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`${url} → ${res.status} ${res.statusText}`);
  return res.json();
}

function derivePrimaryLanguage(languages) {
  const entries = Object.entries(languages || {});
  if (!entries.length) return null;
  return entries.sort(([, a], [, b]) => b - a)[0][0];
}

async function main() {
  const listUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
  const ghRepos = await fetchJson(listUrl);

  const filtered = ghRepos.filter((r) => !r.fork && !r.archived);

  const repos = [];
  for (const r of filtered) {
    let languages = {};
    try {
      languages = await fetchJson(r.languages_url);
    } catch {
      /* rate limit or missing — keep empty */
    }
    repos.push({
      id: r.id,
      name: r.name,
      url: r.html_url,
      description: r.description,
      languages,
      primaryLanguage: derivePrimaryLanguage(languages),
      updated_at: r.updated_at,
      pushed_at: r.pushed_at,
      stargazers_count: r.stargazers_count ?? 0,
      forks_count: r.forks_count ?? 0,
      topics: r.topics ?? [],
      homepage: r.homepage || null,
    });
  }

  repos.sort(
    (a, b) =>
      new Date(b.pushed_at || b.updated_at) - new Date(a.pushed_at || a.updated_at)
  );

  const payload = {
    syncedAt: new Date().toISOString(),
    username,
    repos,
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  console.log(`Wrote ${repos.length} repos to ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
