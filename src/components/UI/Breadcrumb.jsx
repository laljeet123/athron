import { Link } from "react-router-dom";

function Breadcrumb({ segments = [], backUrl, backLabel }) {
  return (
    <div style={{ display: "grid", gap: "10px", marginBottom: "16px" }}>
      {backUrl && (
        <Link
          to={backUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            color: "#39ffab",
            textDecoration: "none",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>&larr;</span>
          {backLabel || "Back"}
        </Link>
      )}
      {segments.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", color: "#96a0b8", fontSize: "0.95rem" }}>
          {segments.map((segment, index) => (
            <span key={segment.label} style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              {segment.to ? (
                <Link to={segment.to} style={{ color: "#7b82a1", textDecoration: "none" }}>
                  {segment.label}
                </Link>
              ) : (
                <span>{segment.label}</span>
              )}
              {index < segments.length - 1 && <span style={{ color: "#475569" }}>/</span>}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default Breadcrumb;
