import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchExercises } from "../services/exercises.js";
import ExerciseCard from "../components/ExerciseCard.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";

function Exercises() {
  const { bodyPartId, bodyPartName, workoutType } = useParams();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bodyPartId || !workoutType) {
      setExercises([]);
      setLoading(false);
      return;
    }

    const loadExercises = async () => {
      setError(null);
      setLoading(true);

      try {
        const data = await fetchExercises(bodyPartId, workoutType);
        setExercises(data);
      } catch (err) {
        console.error("Exercises load failed:", err);
        setError(err);
        setExercises([]);
      } finally {
        setLoading(false);
      }
    };

    void loadExercises();
  }, [bodyPartId, workoutType]);

  return (
    <div className="page-shell">
      <SectionTitle title={`${decodeURIComponent(bodyPartName || "")} ${workoutType || ""} Exercises`} subtitle="Choose your next move" />

      {loading && (
        <GlassCard>
          <p>Loading exercises...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Error loading exercises</p>
          <p>{error.message || error.details || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && exercises.length === 0 && (
        <GlassCard>
          <p>No exercises found for this body part and training mode.</p>
        </GlassCard>
      )}

      {!loading && !error && exercises.length > 0 && (
        <div style={{ display: "grid", gap: "18px" }}>
          {exercises.map((exercise) => (
            <ExerciseCard key={exercise.id} exercise={exercise} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Exercises;
