function ProgressChart({ title, data = [], xKey = "date", yKey = "value", color = "#39ffab" }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div style={{ padding: "22px", borderRadius: "28px", background: "rgba(255,255,255,0.04)", minHeight: "220px", display: "grid", placeItems: "center", color: "#96a0b8" }}>
        No chart data available yet.
      </div>
    );
  }

  const values = data.map((item) => Number(item[yKey] ?? 0));
  const maxValue = Math.max(...values, 1);
  const minValue = Math.min(...values, 0);
  const width = 400;
  const height = 220;
  const padding = 40;
  const step = (width - padding * 2) / Math.max(values.length - 1, 1);

  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - minValue) / (maxValue - minValue || 1)) * (height - padding * 2);
    return { x, y, label: String(data[index][xKey] ?? ""), value };
  });

  const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");

  return (
    <div style={{ borderRadius: "28px", background: "rgba(255,255,255,0.04)", padding: "22px", minHeight: "260px", display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "1.1rem" }}>{title}</h3>
        <span style={{ color: "#96a0b8", fontSize: "0.88rem" }}>{data.length} entries</span>
      </div>
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "220px" }}>
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
        <path d={`${path} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} fill="url(#lineGradient)" opacity="0.35" />
        {points.map((point, index) => (
          <g key={index}>
            <circle cx={point.x} cy={point.y} r="5" fill={color} />
            <text x={point.x} y={height - padding + 18} textAnchor="middle" fill="#96a0b8" fontSize="10">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export default ProgressChart;
