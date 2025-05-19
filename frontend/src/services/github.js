const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API = import.meta.env.GitHub_TOKEN;

export const fetchUserRepos = async (username) => {
  try {
    const response = await fetch(`${GITHUB_API_BASE}/users/${username}/repos`, {
      headers: {
        Authorization: `Bearer ${GITHUB_API}`,
        Accept: "application/vnd.github.v3+json",
      },
    });
    if (!response.ok) throw new Error("Failed to fetch repos");
    return await response.json();
  } catch (error) {
    console.error("Error fetching repos:", error);
    throw error;
  }
};
