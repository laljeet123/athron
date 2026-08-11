function WorkoutCard({ title, exercises, duration, calories, onStart }) {
  return (
    <div
      style={{
        display: "grid",
        gap: "14px",
        background: "rgba(10, 14, 26, 0.82)",
        borderRadius: "24px",
        border: "1px solid rgba(255,255,255,0.08)",
        padding: "24px",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.14em", fontSize: "0.75rem" }}>
            Today’s Workout
          </p>
          <h3 style={{ margin: "8px 0 0", color: "#fff", fontSize: "1.6rem" }}>{title}</h3>
        </div>
        <div style={{ padding: "12px 16px", borderRadius: "18px", background: "rgba(255,255,255,0.06)" }}>
          <span style={{ color: "#0fffc1", fontWeight: 700 }}>{exercises}</span> exercises
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "16px" }}>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.8rem" }}>Duration</p>
          <p style={{ margin: "8px 0 0", color: "#fff", fontWeight: 700 }}>{duration}</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.8rem" }}>Calories</p>
          <p style={{ margin: "8px 0 0", color: "#fff", fontWeight: 700 }}>{calories}</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.8rem" }}>Intensity</p>
          <p style={{ margin: "8px 0 0", color: "#fff", fontWeight: 700 }}>Premium</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onStart}
        style={{
          marginTop: "12px",
          border: "none",
          borderRadius: "999px",
          padding: "16px 24px",
          background: "linear-gradient(135deg, #0fffc1, #3d8dff)",
          color: "#050a17",
          fontWeight: 700,
          cursor: "pointer",
          transition: "transform 0.2s ease",
        }}
        onMouseEnter={(event) => {
          event.currentTarget.style.transform = "translateY(-2px)";
        }}
        onMouseLeave={(event) => {
          event.currentTarget.style.transform = "translateY(0)";
        }}
      >
        Start Workout
      </button>
    </div>
  );
}

export default WorkoutCard;
