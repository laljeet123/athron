function StatCard({ label, value, note }) {
  return (
    <div style={{ padding: "18px", borderRadius: "22px", background: "rgba(255,255,255,0.04)", minWidth: 0 }}>
      <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.12em" }}>
        {label}
      </p>
      <p style={{ margin: "12px 0 0", color: "#f8fafc", fontSize: "1.5rem", fontWeight: 700 }}>
        {value}
      </p>
      {note && <p style={{ margin: "10px 0 0", color: "#96a0b8", fontSize: "0.9rem" }}>{note}</p>}
    </div>
  );
}

export default StatCard;
