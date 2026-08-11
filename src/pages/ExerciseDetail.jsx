import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Breadcrumb from "../components/UI/Breadcrumb.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { fetchExerciseById } from "../services/exercises.js";
import { ROUTES } from "../utils/routes.js";

const MUSCLE_ICONS = {
  chest: "🏋️",
  back: "🦾",
  shoulders: "🛡️",
  biceps: "💪",
  triceps: "🦾",
  quadriceps: "🦵",
  hamstrings: "🏃",
  calves: "🦶",
  abs: "🧠",
  obliques: "🌀",
  "lower-back": "🛡️",
  default: "🔥",
};

function ExerciseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadExercise = async () => {
      setError(null);
      setLoading(true);

      try {
        const data = await fetchExerciseById(id);
        setExercise(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      void loadExercise();
    }
  }, [id]);

  const breadcrumbSegments = useMemo(() => {
    if (!exercise) return [];
    return [
      { label: "Exercises", to: ROUTES.EXERCISES_CATALOG },
      { label: exercise.categoryId || "Category", to: ROUTES.EXERCISE_CATEGORY(exercise.categoryId) },
      { label: exercise.target_muscles || "Muscle", to: ROUTES.EXERCISE_MUSCLE(exercise.categoryId, exercise.muscleId) },
      { label: exercise.workoutType || "Mode" },
    ];
  }, [exercise]);

  const muscleIcon = exercise ? MUSCLE_ICONS[String(exercise.muscleId)] || MUSCLE_ICONS.default : MUSCLE_ICONS.default;
  const supportsFormAnalyzer = exercise && ["push-up", "squat"].includes(String(exercise.id || "").trim().toLowerCase());

  return (
    <div className="page-shell">
      {exercise && (
        <Breadcrumb
          backUrl={ROUTES.EXERCISE_LIST(exercise.categoryId, exercise.muscleId, exercise.workoutType)}
          backLabel="Back to exercise list"
          segments={breadcrumbSegments}
        />
      )}
      <SectionTitle title="Exercise details" subtitle={exercise?.name || "Library"} />
      {loading && (
        <GlassCard>
          <p>Loading exercise details...</p>
        </GlassCard>
      )}
      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Failed to load exercise.</p>
          <p>{error.message || error.details || JSON.stringify(error)}</p>
        </GlassCard>
      )}
      {!loading && !error && exercise && (
        <GlassCard>
          <div style={{ display: "grid", gap: "24px" }}>
            <div style={{ display: "grid", gap: "18px" }}>
              <div style={{ display: "flex", gap: "18px", alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "22px",
                    background: "rgba(57, 255, 171, 0.14)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "2.4rem",
                  }}
                >
                  {muscleIcon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ margin: 0, color: "#f8fafc", fontSize: "2rem" }}>{exercise.name}</h3>
                  <p style={{ margin: "8px 0 0", color: "#96a0b8", fontSize: "0.95rem", lineHeight: 1.6 }}>
                    {exercise.target_muscles} • {exercise.workoutType} • {exercise.equipment}
                  </p>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
                <div style={{ padding: "18px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.82rem" }}>Difficulty</p>
                  <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{exercise.difficulty || "Unknown"}</p>
                </div>
                <div style={{ padding: "18px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.82rem" }}>Sets</p>
                  <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{exercise.sets || "—"}</p>
                </div>
                <div style={{ padding: "18px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.82rem" }}>Reps</p>
                  <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{exercise.reps || "—"}</p>
                </div>
                <div style={{ padding: "18px", borderRadius: "20px", background: "rgba(255,255,255,0.04)" }}>
                  <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.82rem" }}>Rest</p>
                  <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{exercise.rest || "—"}</p>
                </div>
              </div>
            </div>

            {exercise.description && (
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#7b82a1" }}>Description</h4>
                <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.8 }}>{exercise.description}</p>
              </div>
            )}

            {exercise.instructions && (
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#7b82a1" }}>Instructions</h4>
                <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{exercise.instructions}</p>
              </div>
            )}

            <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
              {exercise.formTips && exercise.formTips.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 8px", color: "#7b82a1" }}>Form Tips</h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#c4c8d4", lineHeight: 1.8 }}>
                    {exercise.formTips.map((tip, index) => (
                      <li key={index}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}
              {exercise.commonMistakes && exercise.commonMistakes.length > 0 && (
                <div>
                  <h4 style={{ margin: "0 0 8px", color: "#7b82a1" }}>Common Mistakes</h4>
                  <ul style={{ margin: 0, paddingLeft: "20px", color: "#c4c8d4", lineHeight: 1.8 }}>
                    {exercise.commonMistakes.map((mistake, index) => (
                      <li key={index}>{mistake}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {exercise.safetyTip && (
              <div>
                <h4 style={{ margin: "0 0 8px", color: "#7b82a1" }}>Safety Tip</h4>
                <p style={{ margin: 0, color: "#c4c8d4", lineHeight: 1.8 }}>{exercise.safetyTip}</p>
              </div>
            )}

            {supportsFormAnalyzer ? (
              <GradientButton onClick={() => navigate(ROUTES.FORM_CHECKER(id))}>Start Form Analyzer</GradientButton>
            ) : (
              <GlassCard>
                <p style={{ margin: 0, color: "#fbbf24" }}>AI Form Analyzer currently supports Push-Ups and Squats only.</p>
              </GlassCard>
            )}
          </div>
        </GlassCard>
      )}
    </div>
  );
}

export default ExerciseDetailPage;
