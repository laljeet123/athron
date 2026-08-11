function SectionTitle({ title, subtitle }) {
  return (
    <div style={{ marginBottom: "20px" }}>
      <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.85rem", letterSpacing: "0.22em", textTransform: "uppercase" }}>
        {subtitle}
      </p>
      <h2 style={{ margin: "10px 0 0", color: "#f8fafc", fontSize: "2rem", lineHeight: 1.1 }}>
        {title}
      </h2>
    </div>
  );
}

export default SectionTitle;
