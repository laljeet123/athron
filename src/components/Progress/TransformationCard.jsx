import GlassCard from "../UI/GlassCard.jsx";

function TransformationCard({ transformation }) {
  return (
    <GlassCard style={{ padding: "18px", display: "grid", gap: "12px" }}>
      <div style={{ display: "grid", gap: "10px" }}>
        <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem", textTransform: "uppercase" }}>
          {transformation.view_type || "Photo"}
        </p>
        <p style={{ margin: 0, color: "#f8fafc", fontWeight: 700 }}>{transformation.note || "Transformation snapshot"}</p>
      </div>
      {transformation.photo_url ? (
        <img
          src={transformation.photo_url}
          alt={transformation.view_type || "transformation"}
          style={{ width: "100%", borderRadius: "20px", objectFit: "cover", aspectRatio: "4 / 3" }}
        />
      ) : (
        <div style={{ minHeight: "170px", borderRadius: "20px", background: "rgba(255,255,255,0.04)", display: "grid", placeItems: "center", color: "#96a0b8" }}>
          No photo available
        </div>
      )}
      <p style={{ margin: 0, color: "#96a0b8", fontSize: "0.85rem" }}>
        {transformation.logged_at ? new Date(transformation.logged_at).toLocaleDateString() : "Unknown date"}
      </p>
    </GlassCard>
  );
}

export default TransformationCard;
