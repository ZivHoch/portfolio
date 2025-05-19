import { Octokit } from "octokit";

// Vite only exposes env vars prefixed with VITE_
const GITHUB_TOKEN = import.meta.env.GitHub_TOKEN;
if (!GITHUB_TOKEN) {
  throw new Error("Missing VITE_GITHUB_TOKEN in your .env");
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Fetch public repos for a given GitHub username.
 * @param {string} username
 * @returns {Promise<Array>} Array of repo objects
 */
export const fetchUserRepos = async (username) => {
  try {
    const { data } = await octokit.rest.repos.listForUser({
      username,
      per_page: 100, // adjust as needed
      // you can add page: <n> here or use octokit.paginate for >100 repos
    });
    return data;
  } catch (error) {
    console.error("Error fetching repos:", error);
    // Normalize to a friendly message
    throw new Error(error.status === 404 ? `User "${username}" not found.` : "Failed to fetch GitHub repos.");
  }
};
