import { useEffect, useState } from "react";

export interface Repo {
  id: number;
  name: string;
  url: string;
  description: string | null;
  languages: Record<string, number>;
  updated_at: string;
}

type GithubRepo = {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  updated_at: string;
  fork: boolean;
  archived: boolean;
  languages_url: string;
};

const githubUsername = import.meta.env.VITE_GITHUB_USERNAME as string;
const githubToken = (import.meta.env.VITE_GITHUB_TOKEN as string) || undefined;

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };

  if (githubToken) {
    headers.Authorization = `Bearer ${githubToken}`;
  }

  const res = await fetch(url, {
    method: "GET",
    headers,
    signal,
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

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

export function useProjects(limit = 15) {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!githubUsername) {
          throw new Error(
            "Missing VITE_GITHUB_USERNAME. Add it to frontend/.env, e.g. VITE_GITHUB_USERNAME=your_github_handle"
          );
        }

        const perPage = Math.min(Math.max(1, limit), 100);
        const listUrl = `https://api.github.com/users/${githubUsername}/repos?sort=updated&per_page=${perPage}`;

        const ghRepos = await fetchJson<GithubRepo[]>(listUrl, signal);

        // Filter out forks/archived repos (usually noise on a portfolio)
        const top = ghRepos
          .filter((r) => !r.fork && !r.archived)
          .slice(0, limit);

        const mapped: Repo[] = top.map((r) => ({
          id: r.id,
          name: r.name,
          url: r.html_url,
          description: r.description,
          languages: {}, // filled in below
          updated_at: r.updated_at,
        }));

        setRepos(mapped);

        // Fetch languages in the background (keeps initial page load fast)
        const tasks = top.map((r) => async () => {
          try {
            const langs = await fetchJson<Record<string, number>>(
              r.languages_url,
              signal
            );
            return { id: r.id, languages: langs };
          } catch {
            // If languages fail (rate limit, etc.), keep an empty object.
            return { id: r.id, languages: {} as Record<string, number> };
          }
        });

        const updates = await runWithConcurrency(tasks, 3);

        if (signal.aborted) return;

        setRepos((prev) =>
          prev.map((repo) => {
            const upd = updates.find((u) => u.id === repo.id);
            return upd ? { ...repo, languages: upd.languages } : repo;
          })
        );
      } catch (err) {
        if (signal.aborted) return;
        console.error(err);
        setError(err as Error);
      } finally {
        if (signal.aborted) return;
        setLoading(false);
      }
    };

    load();

    return () => {
      controller.abort();
    };
  }, [limit]);

  return { repos, loading, error };
}
