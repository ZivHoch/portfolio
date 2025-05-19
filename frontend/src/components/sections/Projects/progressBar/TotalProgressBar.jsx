// App.jsx
import React, { useState, useEffect } from "react";
import SegmentedProgressBar from "./SegmentedProgressBar";

const COLOR_PALETTE = [
  "#ff4d7e", // pink
  "#6c5ce7", // purple
  "#00b894", // green
  "#0984e3", // blue
  "#fdcb6e", // yellow
  "#e17055", // orange
  "#d63031", // red
];

function TotalProgressBar({ url }) {
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

        const processed = entries.map(([lang, bytes], idx) => ({
          label: lang,
          bytes,
          percent: (bytes / total) * 100,
          color: COLOR_PALETTE[idx % COLOR_PALETTE.length],
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
    <div style={{ padding: "2rem" }}>
      <h2>Project Language Breakdown</h2>
      <SegmentedProgressBar data={langData} />
    </div>
  );
}

export default TotalProgressBar;
