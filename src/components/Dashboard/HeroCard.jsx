import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";

function HeroCard({ onStartWorkout, onCheckForm }) {
  return (
    <GlassCard>
      <div style={{ display: "grid", gap: "24px" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", letterSpacing: "0.22em", textTransform: "uppercase", fontSize: "0.8rem" }}>
            ATHRON AI
          </p>
          <h1 style={{ margin: "12px 0 0", fontSize: "2.8rem", color: "#f8fafc", lineHeight: 1.05 }}>
            Your intelligent fitness companion
          </h1>
        </div>
        <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.8 }}>
          Premium coaching, posture feedback, and workout flow built for your next level training.
        </p>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <GradientButton onClick={onStartWorkout}>START WORKOUT</GradientButton>
          <button
            type="button"
            onClick={onCheckForm}
            style={{
              border: "1px solid rgba(81, 239, 183, 0.3)",
              borderRadius: "999px",
              padding: "14px 28px",
              background: "rgba(15, 18, 32, 0.9)",
              color: "#fff",
              cursor: "pointer",
              transition: "transform 0.22s ease, box-shadow 0.22s ease",
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.transform = "translateY(0)";
            }}
          >
            CHECK FORM
          </button>
        </div>
      </div>
    </GlassCard>
  );
}

export default HeroCard;
