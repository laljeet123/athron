function ProgressCard({ label, value, delta }) {
  return (
    <div
      style={{
        padding: "20px",
        borderRadius: "22px",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 40px rgba(0,0,0,0.28)",
        minWidth: "140px",
      }}
    >
      <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>{label}</p>
      <h3 style={{ margin: "10px 0 0", color: "#fff", fontSize: "1.75rem" }}>{value}</h3>
      {delta && (
        <p style={{ margin: "10px 0 0", color: "#0fffc1", fontWeight: 600 }}>{delta}</p>
      )}
    </div>
  );
}

export default ProgressCard;
