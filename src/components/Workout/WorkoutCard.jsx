import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";
import { useMemo } from "react";
import { calculateWorkoutCalories } from "../../utils/workoutUtils.js";

function WorkoutCard({ workout, onEdit }) {
  const calories = useMemo(() => calculateWorkoutCalories(workout.exercises || []), [workout.exercises]);

  return (
    <GlassCard style={{ display: "grid", gap: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "18px", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
            Live workout
          </p>
          <h3 style={{ margin: "10px 0 0", color: "#f8fafc" }}>{workout.name || "Premium session"}</h3>
          <p style={{ margin: "10px 0 0", color: "#96a0b8" }}>{workout.workoutType || "AI guided routine"}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          style={{
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "16px",
            padding: "12px 18px",
            background: "rgba(255,255,255,0.04)",
            color: "#f8fafc",
            cursor: "pointer",
          }}
        >
          Edit
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Exercises</p>
          <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{workout.exercises?.length ?? 0}</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Est. calories</p>
          <p style={{ margin: "10px 0 0", color: "#0fffc1", fontWeight: 700 }}>{calories.toFixed(0)} kcal</p>
        </div>
        <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Duration</p>
          <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{workout.duration || "45 min"}</p>
        </div>
      </div>

      <GradientButton onClick={() => alert("Active workout flow coming soon")}>Continue</GradientButton>
    </GlassCard>
  );
}

export default WorkoutCard;
