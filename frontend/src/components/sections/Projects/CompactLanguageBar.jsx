/* eslint-disable react/prop-types */
const languageColors = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  TypeScript: "#2b7489",
  Java: "#b07219",
  "C++": "#f34b7d",
  Go: "#00ADD8",
  Rust: "#dea584",
  CSS: "#563d7c",
  HTML: "#e34c26",
};

export default function CompactLanguageBar({ languages, maxItems = 3 }) {
  const totalBytes = Object.values(languages).reduce((sum, v) => sum + v, 0);
  if (totalBytes === 0) return null;

  const segments = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxItems)
    .map(([lang, bytes]) => ({
      lang,
      pct: Math.round((bytes / totalBytes) * 100),
      color: languageColors[lang] || "#a78bfa",
    }));

  return (
    <div className="mt-auto pt-3">
      <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        {segments.map((s) => (
          <div
            key={s.lang}
            className="h-full"
            style={{ width: `${s.pct}%`, background: s.color }}
            title={`${s.lang} ${s.pct}%`}
          />
        ))}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-gray-500">
        {segments.map((s) => (
          <span key={s.lang}>{s.lang}</span>
        ))}
      </div>
    </div>
  );
}
