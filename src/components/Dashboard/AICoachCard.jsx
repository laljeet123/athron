import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";

function AICoachCard({ onAnalyze }) {
  return (
    <GlassCard>
      <div style={{ display: "grid", gap: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "44px", height: "44px", borderRadius: "16px", background: "rgba(57, 255, 171, 0.12)", display: "grid", placeItems: "center", color: "#39ffab", fontSize: "1.25rem" }}>
            🤖
          </div>
          <div>
            <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
              Athron AI
            </p>
            <h3 style={{ margin: "10px 0 0", color: "#f8fafc", fontSize: "1.9rem" }}>Online</h3>
          </div>
        </div>
        <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.75 }}>
          Your AI trainer is ready to guide you through form checks, posture feedback, and next-level programming.
        </p>
        <GradientButton onClick={onAnalyze}>ANALYZE FORM</GradientButton>
      </div>
    </GlassCard>
  );
}

export default AICoachCard;
