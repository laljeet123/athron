import { useEffect, useState } from "react";
import { fetchWorkoutHistory } from "../services/workouts.js";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { formatWorkoutDate } from "../utils/workoutUtils.js";

function WorkoutHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await fetchWorkoutHistory();
        setHistory(data);
      } catch (err) {
        console.error("Failed to fetch workout history", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void loadHistory();
  }, []);

  return (
    <div className="page-shell">
      <SectionTitle title="Workout history" subtitle="Saved training sessions" />

      {history.length === 0 ? (
        <GlassCard>
          <p style={{ margin: 0, color: "#96a0b8" }}>
            Your workout history is empty. Save a session after building a workout to populate this list.
          </p>
        </GlassCard>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {history.map((session) => (
            <GlassCard key={session.startedAt} style={{ display: "grid", gap: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, color: "#f8fafc" }}>{session.name}</h3>
                  <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{formatWorkoutDate(session.startedAt)}</p>
                </div>
                <p style={{ margin: 0, color: "#0fffc1", fontWeight: 700 }}>{Math.round(session.calories)} kcal</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "12px" }}>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Duration</p>
                  <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{session.durationMinutes} min</p>
                </div>
                <div style={{ padding: "16px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Exercises</p>
                  <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{session.exercises?.length ?? 0}</p>
                </div>
              </div>
              <p style={{ margin: 0, color: "#96a0b8" }}>{session.notes}</p>
            </GlassCard>
          ))}
        </div>
      )}

      <div style={{ marginTop: "24px" }}>
        <GradientButton type="button" onClick={() => window.location.reload()}>
          Refresh history
        </GradientButton>
      </div>
    </div>
  );
}

export default WorkoutHistory;
