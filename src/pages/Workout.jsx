import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import ExerciseCard from "../components/ExerciseCard.jsx";
import { fetchExercises } from "../services/exercises.js";
import { ROUTES } from "../utils/routes.js";

function WorkoutPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExercises = async () => {
      setError(null);
      setLoading(true);

      try {
        const data = await fetchExercises();
        setExercises(data);
      } catch (err) {
        console.error("Workout load failed:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void loadExercises();
  }, []);

  return (
    <div className="page-shell">
      <SectionTitle title="Workout" subtitle="Start your session" />
      <GlassCard style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gap: "18px" }}>
          <div>
            <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "2rem" }}>Select a workout path</h3>
            <p style={{ margin: "10px 0 0", color: "#96a0b8" }}>
              Choose your workout environment and keep your training flow focused.
            </p>
          </div>
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
            <GradientButton onClick={() => navigate(ROUTES.WORKOUT_SELECT)}>CHOOSE BODY PART</GradientButton>
            <GradientButton onClick={() => navigate(ROUTES.WORKOUT_HISTORY)}>WORKOUT HISTORY</GradientButton>
          </div>
        </div>
      </GlassCard>

      <section className="exercise-list">
        <SectionTitle title="Exercise library" subtitle="Browse all moves" />

        {loading && (
          <GlassCard>
            <p>Loading exercise library...</p>
          </GlassCard>
        )}

        {error && (
          <GlassCard>
            <p style={{ color: "#ff8080" }}>Unable to load exercises.</p>
            <p>{error.message || error.details || JSON.stringify(error)}</p>
          </GlassCard>
        )}

        {!loading && !error && exercises.length === 0 && (
          <GlassCard>
            <p>No exercises are available yet. Select a body part to continue.</p>
          </GlassCard>
        )}

        {!loading && !error && exercises.length > 0 && (
          <div style={{ display: "grid", gap: "18px" }}>
            {exercises.map((exercise) => (
              <ExerciseCard key={exercise.id} exercise={exercise} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default WorkoutPage;
