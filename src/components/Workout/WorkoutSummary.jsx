import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";
import { secondsToDuration, calculateWorkoutCalories } from "../../utils/workoutUtils.js";

function WorkoutSummary({ session, onSave }) {
  if (!session) return null;

  const totalDuration = secondsToDuration(session.totalRestSeconds || 0);
  const totalCalories = calculateWorkoutCalories(session.exercises || []);

  return (
    <GlassCard style={{ display: "grid", gap: "18px" }}>
      <div>
        <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.16em" }}>
          Workout summary
        </p>
        <h3 style={{ margin: "10px 0 0", color: "#f8fafc" }}>Finish strong</h3>
      </div>

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Exercises</p>
          <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{session.exercises?.length ?? 0}</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Estimated calories</p>
          <p style={{ margin: "10px 0 0", color: "#0fffc1", fontWeight: 700 }}>{totalCalories.toFixed(0)} kcal</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Planned rest</p>
          <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{totalDuration}</p>
        </div>
      </div>
      <GradientButton onClick={onSave}>Save session</GradientButton>
    </GlassCard>
  );
}

export default WorkoutSummary;
