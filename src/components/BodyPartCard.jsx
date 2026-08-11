function BodyPartCard({ bodyPart, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(bodyPart)}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "18px",
        borderRadius: "12px",
        border: "1px solid #ddd",
        background: "#fff",
        cursor: "pointer",
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
        boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
      }}
      onMouseOver={(event) => {
        event.currentTarget.style.transform = "translateY(-2px)";
        event.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
      }}
      onMouseOut={(event) => {
        event.currentTarget.style.transform = "translateY(0)";
        event.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)";
      }}
    >
      <div style={{ fontSize: "1rem", fontWeight: 600 }}>{bodyPart.name}</div>
    </button>
  );
}

export default BodyPartCard;
