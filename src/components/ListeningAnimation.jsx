function ListeningAnimation({ active }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
      <div
        style={{
          width: "16px",
          height: "16px",
          borderRadius: "999px",
          background: active ? "#39ffab" : "rgba(57,255,171,0.24)",
          boxShadow: active ? "0 0 16px rgba(57,255,171,0.42)" : "none",
          animation: active ? "pulse 1s infinite" : "none",
        }}
      />
      <style>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.35); opacity: 0.65; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      <span style={{ color: "#c4c8d4", fontSize: "0.95rem" }}>{active ? "Listening..." : "Idle"}</span>
    </div>
  );
}

export default ListeningAnimation;
