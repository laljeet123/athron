function FormFeedback({ score, feedback }) {
  return (
    <div style={{ display: "grid", gap: "18px", width: "100%" }}>
      <div style={{ padding: "22px", borderRadius: "28px", background: "rgba(15, 18, 32, 0.92)", border: "1px solid rgba(81, 239, 183, 0.18)" }}>
        <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.18em" }}>
          FORM SCORE
        </p>
        <h2 style={{ margin: "10px 0 0", color: "#f8fafc", fontSize: "3rem" }}>{score}%</h2>
      </div>

      <div style={{ display: "grid", gap: "12px" }}>
        <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.78rem", letterSpacing: "0.16em" }}>
          Feedback
        </p>
        {feedback.length === 0 ? (
          <div style={{ padding: "18px", borderRadius: "22px", background: "rgba(255,255,255,0.04)" }}>
            <p style={{ margin: 0, color: "#c4c8d4" }}>Waiting for pose analysis...</p>
          </div>
        ) : (
          feedback.map((message, index) => {
            const safeMessage = typeof message === "string" && message.trim() ? message : "No feedback available.";
            return (
              <div
                key={index}
                style={{
                  padding: "16px 18px",
                  borderRadius: "20px",
                  background: "rgba(255,255,255,0.04)",
                  color: safeMessage.startsWith("✅") ? "#9ee7ff" : "#fbbf24",
                }}
              >
                <p style={{ margin: 0 }}>{safeMessage}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default FormFeedback;
