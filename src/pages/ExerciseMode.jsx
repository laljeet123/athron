import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/UI/Breadcrumb.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { fetchExerciseCategoryById, fetchMuscleById } from "../services/exercises.js";
import { ROUTES } from "../utils/routes.js";

const WORKOUT_TYPES = ["HOME", "GYM"];

function ExerciseMode() {
  const navigate = useNavigate();
  const { categoryId, muscleId } = useParams();
  const [category, setCategory] = useState(null);
  const [muscle, setMuscle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      setLoading(true);
      try {
        const [categoryData, muscleData] = await Promise.all([
          fetchExerciseCategoryById(categoryId),
          fetchMuscleById(muscleId),
        ]);
        setCategory(categoryData);
        setMuscle(muscleData);
      } catch (err) {
        console.error("Failed to load mode selection data", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId && muscleId) {
      void loadData();
    }
  }, [categoryId, muscleId]);

  return (
    <div className="page-shell">
      <Breadcrumb
        backUrl={ROUTES.EXERCISE_CATEGORY(categoryId)}
        backLabel="Back to muscles"
        segments={[
          { label: "Exercises", to: ROUTES.EXERCISES_CATALOG },
          { label: category?.name || "Category", to: ROUTES.EXERCISE_CATEGORY(categoryId) },
          { label: muscle?.name || "Muscle" },
        ]}
      />
      <SectionTitle title="Choose a location" subtitle="Home or gym" />

      {loading && (
        <GlassCard>
          <p>Loading selection...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Unable to load selection details.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "24px" }}>
          <GlassCard>
            <p style={{ margin: 0, color: "#96a0b8" }}>
              Category: <strong>{category?.name || categoryId}</strong>
            </p>
            <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>
              Muscle: <strong>{muscle?.name || muscleId}</strong>
            </p>
          </GlassCard>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            {WORKOUT_TYPES.map((type) => (
              <GlassCard key={type} style={{ cursor: "pointer" }} onClick={() => navigate(ROUTES.EXERCISE_LIST(categoryId, muscleId, type))}>
                <div style={{ display: "grid", gap: "16px" }}>
                  <div>
                    <p style={{ margin: 0, color: "#39ffab", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                      {type}
                    </p>
                    <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: "#f8fafc" }}>{type === "HOME" ? "Home workout" : "Gym workout"}</h3>
                  </div>
                  <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.7 }}>
                    {type === "HOME" ? "Bodyweight and minimal equipment exercises." : "Equipment-based training for full strength."}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExerciseMode;
