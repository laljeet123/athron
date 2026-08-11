import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../components/UI/Breadcrumb.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import ExerciseCard from "../components/ExerciseCard.jsx";
import { ROUTES } from "../utils/routes.js";
import { fetchExercisesBySelection, fetchExerciseCategoryById, fetchMuscleById } from "../services/exercises.js";

function ExerciseList() {
  const { categoryId, muscleId, workoutType } = useParams();
  const [category, setCategory] = useState(null);
  const [muscle, setMuscle] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      setLoading(true);
      try {
        const [categoryData, muscleData, exerciseData] = await Promise.all([
          fetchExerciseCategoryById(categoryId),
          fetchMuscleById(muscleId),
          fetchExercisesBySelection(categoryId, muscleId, workoutType),
        ]);
        setCategory(categoryData);
        setMuscle(muscleData);
        setExercises(exerciseData || []);
      } catch (err) {
        console.error("Exercise list load failed", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && muscleId && workoutType) {
      void loadData();
    }
  }, [categoryId, muscleId, workoutType]);

  return (
    <div className="page-shell">
      <Breadcrumb
        backUrl={ROUTES.EXERCISE_MUSCLE(categoryId, muscleId)}
        backLabel="Back to location"
        segments={[
          { label: "Exercises", to: ROUTES.EXERCISES_CATALOG },
          { label: category?.name || "Category", to: ROUTES.EXERCISE_CATEGORY(categoryId) },
          { label: muscle?.name || "Muscle", to: ROUTES.EXERCISE_MUSCLE(categoryId, muscleId) },
          { label: workoutType || "Mode" },
        ]}
      />
      <SectionTitle
        title={`${category?.name || "Exercises"}${muscle?.name ? ` / ${muscle.name}` : ""}`}
        subtitle={workoutType ? `${workoutType} workouts` : "Pick your training mode"}
      />

      {loading && (
        <GlassCard>
          <p>Loading exercises...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Failed to load exercises.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && exercises.length === 0 && (
        <GlassCard>
          <p>No exercises match this selection. Try another muscle or location.</p>
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

export default ExerciseList;
