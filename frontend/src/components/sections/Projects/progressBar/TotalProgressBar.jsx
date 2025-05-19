/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import SegmentedProgressBar from "./SegmentedProgressBar";
const GITHUB_API = import.meta.env.GitHub_TOKEN;

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
export default function TotalProgressBar({ url }) {
  const [langData, setLangData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Network response was not ok (${res.status})`);
        }
        return res.json();
      })
      .then((raw) => {
        // raw is like: { JavaScript: 153460, Python: 14861, … }
        const entries = Object.entries(raw);
        const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

        const processed = entries.map(([lang, bytes]) => ({
          label: lang,
          bytes,
          percent: (bytes / total) * 100,
          color: languageColors[lang],
        }));

        setLangData(processed);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load language data.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  if (loading) return <p>Loading…</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Language Usage</h2>
      <SegmentedProgressBar data={langData} />
    </div>
  );
}
