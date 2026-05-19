/* eslint-disable react/prop-types */
import { Search } from "lucide-react";

const sortOptions = [
  { value: "updated", label: "Recently updated" },
  { value: "stars", label: "Most stars" },
  { value: "name", label: "Name A–Z" },
];

export default function ProjectToolbar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  language,
  onLanguageChange,
  languages,
  resultCount,
  totalCount,
}) {
  return (
    <div className="px-4 md:px-6 pb-6 space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">
            {resultCount === totalCount
              ? `${totalCount} repositories`
              : `${resultCount} of ${totalCount} repositories`}
          </p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search projects…"
            className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onLanguageChange(null)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              language === null
                ? "bg-purple-500/30 border-purple-400/50 text-white"
                : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
            }`}
          >
            All
          </button>
          {languages.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => onLanguageChange(lang)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                language === lang
                  ? "bg-purple-500/30 border-purple-400/50 text-white"
                  : "bg-white/5 border-white/10 text-gray-400 hover:text-white"
              }`}
            >
              {lang}
            </button>
          ))}
        </div>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
