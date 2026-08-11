function AICoachCard({ title, description, actionLabel, onAction }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "18px",
        padding: "24px",
        borderRadius: "28px",
        background: "rgba(8, 10, 18, 0.82)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.28)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <div style={{ padding: "14px", borderRadius: "16px", background: "rgba(12, 255, 193, 0.12)" }}>
          <span role="img" aria-label="robot" style={{ fontSize: "1.4rem" }}>🤖</span>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.85rem" }}>Athron AI</p>
          <h3 style={{ margin: "8px 0 0", color: "#fff" }}>{title}</h3>
        </div>
      </div>
      <p style={{ margin: 0, color: "#d3d4e3", lineHeight: 1.8 }}>{description}</p>
      <button
        type="button"
        onClick={onAction}
        style={{
          border: "none",
          borderRadius: "999px",
          padding: "14px 20px",
          background: "linear-gradient(135deg, #0fffc1, #3d8dff)",
          color: "#050a17",
          fontWeight: 700,
          cursor: "pointer",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "translateY(0)";
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export default AICoachCard;
