import type { Repo } from "../hooks/useProjects";

export type SortOption = "updated" | "name" | "stars";

export function getAllLanguages(repos: Repo[]): string[] {
  const langs = new Set<string>();
  for (const repo of repos) {
    if (repo.primaryLanguage) langs.add(repo.primaryLanguage);
    Object.keys(repo.languages).forEach((l) => langs.add(l));
  }
  return Array.from(langs).sort();
}

export function filterAndSortRepos(
  repos: Repo[],
  search: string,
  language: string | null,
  sort: SortOption
): Repo[] {
  const q = search.trim().toLowerCase();

  let result = repos.filter((repo) => {
    if (language) {
      const hasLang =
        repo.primaryLanguage === language ||
        Object.prototype.hasOwnProperty.call(repo.languages, language);
      if (!hasLang) return false;
    }

    if (!q) return true;
    const inName = repo.name.toLowerCase().includes(q);
    const inDesc = (repo.description ?? "").toLowerCase().includes(q);
    const inTopics = repo.topics.some((t) => t.toLowerCase().includes(q));
    return inName || inDesc || inTopics;
  });

  result = [...result].sort((a, b) => {
    switch (sort) {
      case "name":
        return a.name.localeCompare(b.name);
      case "stars":
        return b.stargazers_count - a.stargazers_count;
      case "updated":
      default:
        return (
          new Date(b.pushed_at || b.updated_at).getTime() -
          new Date(a.pushed_at || a.updated_at).getTime()
        );
    }
  });

  return result;
}
