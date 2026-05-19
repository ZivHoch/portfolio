/* eslint-disable react/prop-types */
import { motion } from "framer-motion";
import { Star, GitFork } from "lucide-react";
import { formatRelativeDate } from "../../../utils/formatRelativeDate";
import CompactLanguageBar from "./CompactLanguageBar";

export default function ProjectCard({ repo, index, onSelect }) {
  const updatedLabel = formatRelativeDate(repo.pushed_at || repo.updated_at);

  return (
    <motion.button
      type="button"
      onClick={() => onSelect(repo)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="group relative min-h-[220px] flex w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 rounded-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-transparent rounded-lg transform group-hover:scale-[1.02] transition-transform" />
      <div className="relative p-4 md:p-6 rounded-lg bg-white/5 border border-white/10 backdrop-blur-sm w-full flex flex-col group-hover:border-purple-500/30 transition-colors">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-xl font-bold truncate text-white group-hover:text-purple-200 transition-colors">
            {repo.name}
          </h3>
          {updatedLabel && (
            <span className="text-xs text-gray-500 shrink-0">{updatedLabel}</span>
          )}
        </div>

        <p className="text-gray-400 mb-3 flex-grow line-clamp-3 text-sm">
          {repo.description || "No description available"}
        </p>

        <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5" />
            {repo.stargazers_count}
          </span>
          <span className="inline-flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            {repo.forks_count}
          </span>
          {repo.primaryLanguage && (
            <span className="text-purple-300/80">{repo.primaryLanguage}</span>
          )}
        </div>

        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {repo.topics.slice(0, 3).map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 rounded text-xs bg-white/5 text-gray-400 border border-white/5"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        <CompactLanguageBar languages={repo.languages} />
      </div>
    </motion.button>
  );
}
