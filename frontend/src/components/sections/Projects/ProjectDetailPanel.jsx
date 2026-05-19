/* eslint-disable react/prop-types */
import { motion, AnimatePresence } from "framer-motion";
import { X, Github, ExternalLink, Star, GitFork } from "lucide-react";
import { formatRelativeDate } from "../../../utils/formatRelativeDate";
import TotalProgressBar from "./progressBar/TotalProgressBar";

export default function ProjectDetailPanel({ repo, onClose }) {
  if (!repo) return null;

  const updatedLabel = formatRelativeDate(repo.pushed_at || repo.updated_at);
  const hasDemo =
    repo.homepage &&
    repo.homepage.length > 0 &&
    !repo.homepage.includes("github.com");

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex justify-end"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-label="Close panel"
        />
        <motion.aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-detail-title"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg h-full bg-gray-950 border-l border-white/10 shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-white/10 bg-gray-950/95 backdrop-blur">
            <h2 id="project-detail-title" className="text-xl font-bold truncate pr-4">
              {repo.name}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <p className="text-gray-300 leading-relaxed">
              {repo.description || "No description available."}
            </p>

            <div className="flex flex-wrap gap-4 text-sm text-gray-400">
              <span className="inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 text-yellow-500/80" />
                {repo.stargazers_count} stars
              </span>
              <span className="inline-flex items-center gap-1.5">
                <GitFork className="w-4 h-4" />
                {repo.forks_count} forks
              </span>
              {updatedLabel && <span>Updated {updatedLabel}</span>}
            </div>

            {repo.topics.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-500 mb-2">Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {repo.topics.map((topic) => (
                    <span
                      key={topic}
                      className="px-2.5 py-1 rounded-full text-xs bg-purple-500/20 text-purple-200 border border-purple-500/30"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(repo.languages).length > 0 && (
              <TotalProgressBar languages={repo.languages} />
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-3 rounded-lg bg-purple-500 hover:bg-purple-600 transition-colors inline-flex items-center justify-center gap-2 font-medium"
              >
                <Github className="w-4 h-4" />
                View on GitHub
              </a>
              {hasDemo && (
                <a
                  href={repo.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 transition-colors inline-flex items-center justify-center gap-2 font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  Live demo
                </a>
              )}
            </div>
          </div>
        </motion.aside>
      </motion.div>
    </AnimatePresence>
  );
}
