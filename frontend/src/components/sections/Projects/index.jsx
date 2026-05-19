import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useProjects } from "../../../hooks/useProjects";
import {
  filterAndSortRepos,
  getAllLanguages,
} from "../../../utils/projectFilters";
import ProjectToolbar from "./ProjectToolbar";
import ProjectCard from "./ProjectCard";
import ProjectDetailPanel from "./ProjectDetailPanel";
import ProjectSkeleton from "./ProjectSkeleton";

export const ProjectsSection = () => {
  const { repos, loading, error } = useProjects(15);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("updated");
  const [language, setLanguage] = useState(null);
  const [selectedRepo, setSelectedRepo] = useState(null);

  const allLanguages = useMemo(() => getAllLanguages(repos), [repos]);

  const filteredRepos = useMemo(
    () => filterAndSortRepos(repos, search, language, sort),
    [repos, search, language, sort]
  );

  if (loading) {
    return (
      <motion.div key="projects-loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <ProjectToolbar
          search=""
          onSearchChange={() => {}}
          sort="updated"
          onSortChange={() => {}}
          language={null}
          onLanguageChange={() => {}}
          languages={[]}
          resultCount={0}
          totalCount={0}
        />
        <ProjectSkeleton count={6} />
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        key="projects-error"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[40vh] px-4 text-center"
      >
        <p className="text-red-300 font-semibold mb-2">Could not load projects</p>
        <p className="text-gray-400 text-sm max-w-md">{error.message}</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      key="projects"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <ProjectToolbar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        language={language}
        onLanguageChange={setLanguage}
        languages={allLanguages}
        resultCount={filteredRepos.length}
        totalCount={repos.length}
      />

      {filteredRepos.length === 0 ? (
        <p className="text-center text-gray-400 px-4 pb-12">
          No projects match your filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8 px-4 md:px-6">
          {filteredRepos.map((repo, index) => (
            <ProjectCard
              key={repo.id}
              repo={repo}
              index={index}
              onSelect={setSelectedRepo}
            />
          ))}
        </div>
      )}

      {selectedRepo && (
        <ProjectDetailPanel
          repo={selectedRepo}
          onClose={() => setSelectedRepo(null)}
        />
      )}
    </motion.div>
  );
};
