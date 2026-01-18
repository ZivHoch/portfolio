import { useState, useEffect } from "react";

export function useProjects(limit) {
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      setError(null);

      try {
        // Prefer explicit backend (Render / serverless endpoint) if provided
        const backend = (import.meta.env.VITE_BACKEND_URL || "").replace(
          /\/$/,
          ""
        );

        // If no backend env var, fall back to same-origin (useful if you later add Netlify functions / reverse proxy)
        const base = import.meta.env.BASE_URL || "/";
        const originBase = base.replace(/\/$/, "");

        // IMPORTANT: adjust the path below to match your backend route.
        // If your backend route is different, keep the same pattern and only change the pathname.
        const path = `/api/projects?limit=${encodeURIComponent(limit)}`;
        const url = backend ? `${backend}${path}` : `${originBase}${path}`;

        const response = await fetch(url, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} when fetching ${url}`);
        }

        const contentType = response.headers.get("content-type") || "";
        const text = await response.text();

        // Netlify SPA fallback often returns index.html (text/html) for missing endpoints/assets
        const looksLikeHtml =
          contentType.includes("text/html") ||
          text.trimStart().startsWith("<!DOCTYPE html") ||
          text.trimStart().startsWith("<html");

        if (looksLikeHtml) {
          console.error(
            "Fetched HTML instead of JSON. This usually means the API URL is wrong, the backend is down, or a SPA redirect is catching the request.",
            { url, contentType }
          );
          throw new Error(
            "Received HTML instead of JSON from projects endpoint."
          );
        }

        const data = JSON.parse(text);

        setRepos(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [limit]);

  return { repos, loading, error };
}
