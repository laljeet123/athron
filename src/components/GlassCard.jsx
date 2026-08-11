function GlassCard({ children, className = "", ...rest }) {
  return (
    <div
      className={`glass-card ${className}`}
      {...rest}
      style={{
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        background: "rgba(8, 10, 18, 0.72)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 20px 80px rgba(0, 0, 0, 0.35)",
        borderRadius: "28px",
        padding: "24px",
      }}
    >
      {children}
    </div>
  );
}

export default GlassCard;
