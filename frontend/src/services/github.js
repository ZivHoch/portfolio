const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_AUTH = import.meta.env.VITE_GITHUB_TOKEN;
export const fetchUserRepos = async (username) => {
  try {
    const response = await fetch(`${username}:${GITHUB_AUTH} ${GITHUB_API_BASE}/users/${username}/repos`);
    if (!response.ok) throw new Error("Failed to fetch repos");
    return await response.json();
  } catch (error) {
    console.error("Error fetching repos:", error);
    throw error;
  }
};
