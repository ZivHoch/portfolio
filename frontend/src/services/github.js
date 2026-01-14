// Deprecated for the Projects page (we now fetch via `useProjects.ts`).
// Kept as a small utility in case other parts of the app still use it.

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_AUTH = import.meta.env.VITE_GITHUB_TOKEN;

export const fetchUserRepos = async (
  username,
  { perPage = 30, sort = "updated" } = {}
) => {
  if (!username) throw new Error("GitHub username is required");

  const headers = {
    Accept: "application/vnd.github+json",
  };

  if (GITHUB_AUTH) {
    headers.Authorization = `Bearer ${GITHUB_AUTH}`;
  }

  const url = `${GITHUB_API_BASE}/users/${username}/repos?sort=${encodeURIComponent(
    sort
  )}&per_page=${encodeURIComponent(perPage)}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("Failed to fetch repos");
  return await response.json();
};
