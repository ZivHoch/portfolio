import React from "react";
import "./SegmentedProgressBar.css";

export default function SegmentedProgressBar({ data }) {
  return (
    <div className="spb-wrapper">
      <div className="spb-bar">
        {data.map((item, i) => (
          <div
            key={i}
            className="spb-segment"
            style={{
              width: `${item.percent}%`,
              background: item.color,
            }}
          />
        ))}
      </div>
      <div className="spb-legend">
        {data.map((item, i) => (
          <div key={i} className="spb-legend-item">
            <span className="spb-legend-color" style={{ background: item.color }} />
            {item.label} {item.percent.toFixed(1)}%
          </div>
        ))}
      </div>
    </div>
  );
}
