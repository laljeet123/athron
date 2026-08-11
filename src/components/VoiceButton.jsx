function VoiceButton({ onClick, active, label, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: "999px",
        padding: "14px 24px",
        color: "#f8fafc",
        background: active ? "rgba(57,255,171,0.14)" : "rgba(255,255,255,0.06)",
        cursor: "pointer",
        fontWeight: 700,
        letterSpacing: "0.02em",
        transition: "transform 0.2s ease, background 0.2s ease",
        ...style,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {label}
    </button>
  );
}

export default VoiceButton;
