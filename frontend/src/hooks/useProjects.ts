import os;
import { useState, useEffect } from "react";

VITE_BACKEND_URL = os.getenv("VITE_BACKEND_URL")
export interface Repo {
  id:        number;
  name:      string;
  url:       string;
  description: string | null;
  languages: Record<string, number>;
  updated_at: string;
}

export function useProjects(limit = 15) {
  const [repos, setRepos]   = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<Error | null>(null);

  useEffect(() => {
    fetch(`${VITE_BACKEND_URL}/api/projects`)
      .then((res) => {
        if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
        return res.json();
      })
      .then((data: Repo[]) => {
        setRepos(data.slice(0, limit));
      })
      .catch((err) => {
        console.error(err);
        setError(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [limit]);

  return { repos, loading, error };
}
