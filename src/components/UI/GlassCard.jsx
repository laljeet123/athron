function GlassCard({ children, style, ...props }) {
  return (
    <div
      {...props}
      style={{
        background: "rgba(14, 18, 32, 0.72)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(18px)",
        borderRadius: "28px",
        boxShadow: "0 28px 80px rgba(0, 0, 0, 0.35)",
        padding: "24px",
        color: "#f8fafc",
        scrollMarginTop: "260px",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
