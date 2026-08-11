import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";

function WorkoutCard({ workout, onStartTraining }) {
  return (
    <GlassCard>
      <div style={{ display: "grid", gap: "18px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", letterSpacing: "0.18em", fontSize: "0.78rem" }}>
              Today's Workout
            </p>
            <h3 style={{ margin: "12px 0 0", fontSize: "2rem", color: "#f8fafc" }}>{workout.title}</h3>
          </div>
          <div style={{ padding: "14px 18px", borderRadius: "18px", background: "rgba(255, 255, 255, 0.04)", color: "#d0d6df" }}>
            <div style={{ fontSize: "0.85rem", marginBottom: "6px" }}>Status</div>
            <div style={{ fontWeight: 700, color: "#39ffab" }}>Optimal</div>
          </div>
        </div>

        <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
          {workout.stats.map((item) => (
            <div key={item.label} style={{ padding: "16px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>{item.label}</p>
              <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700, fontSize: "1.15rem" }}>{item.value}</p>
            </div>
          ))}
        </div>

        <GradientButton onClick={onStartTraining}>START TRAINING</GradientButton>
      </div>
    </GlassCard>
  );
}

export default WorkoutCard;
