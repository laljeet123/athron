function ConversationBox({ history }) {
  return (
    <div style={{ display: "grid", gap: "14px" }}>
      {history.map((entry) => (
        <div
          key={entry.id}
          style={{
            padding: "18px",
            borderRadius: "22px",
            background: entry.type === "user" ? "rgba(57,255,171,0.08)" : "rgba(61,153,255,0.08)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#f8fafc",
          }}
        >
          <p style={{ margin: 0, color: "#9fa8c9", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {entry.type === "user" ? "You" : "Athron"}
          </p>
          <p style={{ margin: "10px 0 0", lineHeight: 1.7 }}>{entry.message}</p>
        </div>
      ))}
    </div>
  );
}

export default ConversationBox;
