function GradientButton({ children, onClick, style, type = "button" }) {
  return (
    <button
      type={type}
      onClick={onClick}
      style={{
        border: "none",
        borderRadius: "999px",
        padding: "14px 28px",
        color: "#050d16",
        background: "linear-gradient(135deg, #39ffab, #3d99ff)",
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: "pointer",
        transition: "transform 0.22s ease, box-shadow 0.22s ease",
        boxShadow: "0 18px 48px rgba(34, 255, 178, 0.16)",
        ...style,
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {children}
    </button>
  );
}

export default GradientButton;
