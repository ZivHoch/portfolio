/* eslint-disable react/prop-types */
import React from "react";
import SegmentedProgressBar from "./SegmentedProgressBar";

const languageColors = {
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  TypeScript: "#2b7489",
  "C++": "#f34b7d",
  "C#": "#178600",
  PHP: "#4F5D95",
  Ruby: "#701516",
  Go: "#00ADD8",
  Shell: "#89e051",
  CSS: "#563d7c",
  HTML: "#e34c26",
  Swift: "#ffac45",
  Kotlin: "#F18E33",
  Rust: "#dea584",
  Scala: "#c22d40",
  Dart: "#00B4AB",
  "Objective-C": "#438eff",
  CoffeeScript: "#244776",
  SQL: "#e38c00",
  PowerShell: "#012456",
};

export default function TotalProgressBar({ languages }) {
  // Compute total bytes
  const totalBytes = Object.values(languages).reduce((sum, v) => sum + v, 0);

  // Build the data array for SegmentedProgressBar
  const langData = Object.entries(languages)
    .sort(([, a], [, b]) => b - a)
    .map(([lang, bytes]) => ({
      label: lang,
      value: totalBytes > 0 ? Math.round((bytes / totalBytes) * 100) : 0,
      color: languageColors[lang] || "#ccc",
    }));

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Language Usage</h2>
      <SegmentedProgressBar data={langData} />
    </div>
  );
}
