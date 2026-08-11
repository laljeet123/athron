function GradientButton({ children, onClick, className = "", ...rest }) {
  return (
    <button
      onClick={onClick}
      className={`gradient-button ${className}`}
      {...rest}
      style={{
        border: "none",
        borderRadius: "999px",
        padding: "16px 28px",
        color: "#fff",
        background: "linear-gradient(135deg, #0fffc1, #3d8dff)",
        boxShadow: "0 20px 40px rgba(12, 242, 208, 0.18)",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 24px 48px rgba(12, 242, 208, 0.28)";
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 20px 40px rgba(12, 242, 208, 0.18)";
      }}
    >
      {children}
    </button>
  );
}

export default GradientButton;
