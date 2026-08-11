function RepCounter({ count, goal }) {
  return (
    <div style={{ padding: "18px", borderRadius: "26px", background: "rgba(15, 18, 32, 0.9)", border: "1px solid rgba(81, 239, 183, 0.18)" }}>
      <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.18em" }}>
        Reps
      </p>
      <h3 style={{ margin: "10px 0 0", color: "#f8fafc", fontSize: "2rem"">{count} / {goal}</h3>
    </div>
  );
}

export default RepCounter;
