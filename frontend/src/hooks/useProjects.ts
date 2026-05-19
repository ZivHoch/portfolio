import { useEffect, useState } from "react";
import { derivePrimaryLanguage } from "../utils/formatRelativeDate";

export interface Repo {
  id: number;
  name: string;
  url: string;
  description: string | null;
  languages: Record<string, number>;
  primaryLanguage: string | null;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  homepage: string | null;
}

type ReposFile = {
  syncedAt: string | null;
  username?: string;
  repos: Repo[];
};

type GithubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  updated_at: string;
  pushed_at: string;
  stargazers_count: number;
  forks_count: number;
  topics?: string[];
  homepage: string | null;
  fork: boolean;
  archived: boolean;
  languages_url: string;
};

const CACHE_KEY = "portfolio-repos-cache";
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const githubUsername = import.meta.env.VITE_GITHUB_USERNAME as string;
const githubToken = (import.meta.env.VITE_GITHUB_TOKEN as string) || undefined;

function reposFileUrl(): string {
  const base = import.meta.env.BASE_URL || "/";
  return `${base.replace(/\/$/, "")}/data/repos.json`;
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (githubToken) headers.Authorization = `Bearer ${githubToken}`;

  const res = await fetch(url, { method: "GET", headers, signal, cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  let index = 0;
  const workers = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < tasks.length) {
      const current = index++;
      results[current] = await tasks[current]();
    }
  });
  await Promise.all(workers);
  return results;
}

function mapGithubRepo(
  r: GithubRepo,
  languages: Record<string, number> = {}
): Repo {
  return {
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
  };
}

function readLocalCache(): ReposFile | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ReposFile;
  } catch {
    return null;
  }
}

function writeLocalCache(data: ReposFile) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    /* quota or private mode */
  }
}

function isStale(syncedAt: string | null | undefined): boolean {
  if (!syncedAt) return true;
  return Date.now() - new Date(syncedAt).getTime() > ONE_DAY_MS;
}

async function loadStaticRepos(signal: AbortSignal): Promise<ReposFile> {
  const res = await fetch(reposFileUrl(), { signal, cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load repos.json (${res.status})`);
  return (await res.json()) as ReposFile;
}

async function refreshFromGitHub(
  signal: AbortSignal,
  limit: number
): Promise<ReposFile> {
  if (!githubUsername) {
    throw new Error(
      "Missing VITE_GITHUB_USERNAME for GitHub sync. Using cached repos only."
    );
  }

  const perPage = Math.min(Math.max(1, limit), 100);
  const listUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=${perPage}`;
  const ghRepos = await fetchJson<GithubRepo[]>(listUrl, signal);
  const top = ghRepos.filter((r) => !r.fork && !r.archived).slice(0, limit);

  const tasks = top.map((r) => async () => {
    try {
      const langs = await fetchJson<Record<string, number>>(r.languages_url, signal);
      return mapGithubRepo(r, langs);
    } catch {
      return mapGithubRepo(r, {});
    }
  });

  const repos = await runWithConcurrency(tasks, 3);
  return {
    syncedAt: new Date().toISOString(),
    username: githubUsername,
    repos,
  };
}

export function useProjects(limit = 15) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const cached = readLocalCache();
        let data: ReposFile | null =
          cached && !isStale(cached.syncedAt) ? cached : null;

        if (!data) {
          try {
            data = await loadStaticRepos(signal);
          } catch {
            data = cached;
          }
        }

        if (data?.repos?.length) {
          setRepos(data.repos.slice(0, limit));
          setLastSynced(data.syncedAt);
          setLoading(false);
        }

        const needsRefresh =
          !data?.repos?.length ||
          isStale(data?.syncedAt) ||
          isStale(cached?.syncedAt);

        if (needsRefresh && githubUsername) {
          try {
            const fresh = await refreshFromGitHub(signal, limit);
            if (signal.aborted) return;
            writeLocalCache(fresh);
            setRepos(fresh.repos.slice(0, limit));
            setLastSynced(fresh.syncedAt);
          } catch (err) {
            if (!data?.repos?.length) throw err;
            console.warn("GitHub refresh failed, using cached repos:", err);
          }
        } else if (!data?.repos?.length) {
          throw new Error(
            "No projects loaded. Run: npm run sync:repos — or set VITE_GITHUB_USERNAME."
          );
        }
      } catch (err) {
        if (signal.aborted) return;
        console.error(err);
        setError(err as Error);
      } finally {
        if (!signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [limit]);

  return { repos, loading, error, lastSynced };
}
