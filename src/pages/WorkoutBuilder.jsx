import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import ExerciseTracker from "../components/Workout/ExerciseTracker.jsx";
import BodyPartSelector from "../components/BodyPartSelector.jsx";
import { fetchExercises } from "../services/exercises.js";
import { useWorkout } from "../context/WorkoutContext.jsx";
import { ROUTES } from "../utils/routes.js";

function WorkoutBuilder() {
  const navigate = useNavigate();
  const [library, setLibrary] = useState([]);
  const [selectedExercises, setSelectedExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [startError, setStartError] = useState(null);
  const workoutContext = useWorkout();

  useEffect(() => {
    const loadLibrary = async () => {
      setError(null);
      setLoading(true);

      try {
        const data = await fetchExercises();
        setLibrary(data || []);
      } catch (err) {
        console.error("Workout library load failed", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void loadLibrary();
  }, []);

  const availableExercises = useMemo(
    () => library.filter((exercise) => !selectedExercises.some((item) => item.id === exercise.id)),
    [library, selectedExercises]
  );

  const handleAddExercise = (exercise) => {
    setSelectedExercises((current) => [
      ...current,
      {
        ...exercise,
        sets: 3,
        reps: 10,
        restSeconds: 60,
      },
    ]);
  };

  const handleSelectFromBodyPart = (exercise) => {
    // when selecting an exercise from the BodyPartSelector, add it to the session
    handleAddExercise(exercise);
    // scroll to selected exercises area
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }), 150);
  };

  const handleUpdateExercise = (updatedExercise) => {
    setSelectedExercises((current) => current.map((exercise) => (exercise.id === updatedExercise.id ? updatedExercise : exercise)));
  };

  const handleRemoveExercise = (exerciseId) => {
    setSelectedExercises((current) => current.filter((item) => item.id !== exerciseId));
  };

  const workoutSession = useMemo(() => {
    const durationMinutes = selectedExercises.reduce((sum, exercise) => sum + Math.round((exercise.sets * exercise.reps) / 6), 0) || 30;
    const caloriesBurned = selectedExercises.reduce((sum, exercise) => sum + (Number(exercise.calories) || 25) * exercise.sets * exercise.reps * 0.01, 0);
    const totalRestSeconds = selectedExercises.reduce((sum, exercise) => sum + Number(exercise.restSeconds || 60) * (exercise.sets || 1), 0);
    return {
      userId: null,
      workoutName: selectedExercises.length ? `${selectedExercises[0].target_muscles || selectedExercises[0].name} Focus` : "Custom session",
      name: selectedExercises.length ? `${selectedExercises[0].target_muscles || selectedExercises[0].name} Focus` : "Custom session",
      bodyPartId: selectedExercises[0]?.body_part_id ?? selectedExercises[0]?.id ?? null,
      bodyPartName: selectedExercises[0]?.target_muscles || "Mixed",
      durationMinutes,
      caloriesBurned: Math.round(caloriesBurned),
      calories: Math.round(caloriesBurned),
      totalExercises: selectedExercises.length,
      exercises: selectedExercises,
      startedAt: new Date().toISOString(),
      completedAt: null,
      notes: "Built using the workout planner.",
      totalRestSeconds,
    };
  }, [selectedExercises]);

  const handleSaveSession = async () => {
    setSaving(true);
    setStartError(null);

    try {
      const session = {
        ...workoutSession,
        completedAt: new Date().toISOString(),
      };
      await workoutContext.startWorkout(session);
      navigate(ROUTES.ACTIVE_WORKOUT);
    } catch (err) {
      console.error("Couldn't start your workout", err);
      setStartError(new Error("Couldn't start your workout. Please try again."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-shell">
      <SectionTitle title="Workout Builder" subtitle="Design your training" />
      <GlassCard style={{ marginBottom: "24px" }}>
        <div style={{ display: "grid", gap: "12px" }}>
          <p style={{ margin: 0, color: "#96a0b8" }}>
            Pick exercises from the library, customize sets, reps, and rest, then save your session to start tracking.
          </p>
          <GradientButton type="button" onClick={() => navigate(ROUTES.WORKOUT_HISTORY)}>
            View history
          </GradientButton>
        </div>
      </GlassCard>

      <section className="exercise-list">
        <SectionTitle title="Exercise library" subtitle="Add to your session" />

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

        {!loading && !error && availableExercises.length === 0 && (
          <GlassCard>
            <p>All available exercises are already part of your session.</p>
          </GlassCard>
        )}

        {!loading && !error && availableExercises.length > 0 && (
          <div style={{ display: "grid", gap: "18px" }}>
            {availableExercises.slice(0, 5).map((exercise) => (
              <GlassCard key={exercise.id} style={{ display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, color: "#f8fafc" }}>{exercise.name}</h3>
                    <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{exercise.difficulty || "Standard"}</p>
                  </div>
                  <GradientButton onClick={() => handleAddExercise(exercise)}>Add</GradientButton>
                </div>
                <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.9rem" }}>{exercise.equipment || "Bodyweight"}</p>
              </GlassCard>
            ))}
          </div>
        )}
      </section>

      <section style={{ marginTop: 24 }}>
        <SectionTitle title="Browse by body part" subtitle="Quick pick" />
        <GlassCard>
          {/* Reuse BodyPartSelector to allow quick selection */}
          <div style={{ padding: 12 }}>
            {/* Lazy load BodyPartSelector to avoid circular imports */}
            {typeof window !== 'undefined' && (
              // eslint-disable-next-line react/jsx-no-undef
              <BodyPartSelector onSelect={() => {}} onExerciseSelect={handleSelectFromBodyPart} />
            )}
          </div>
        </GlassCard>
      </section>

      <section className="exercise-list" style={{ marginTop: "32px" }}>
        <SectionTitle title="Selected exercises" subtitle="Ready for your session" />

        {selectedExercises.length === 0 ? (
          <GlassCard>
            <p>Select exercises above to start building your workout.</p>
          </GlassCard>
        ) : (
          <div style={{ display: "grid", gap: "18px" }}>
            {selectedExercises.map((exercise) => (
              <ExerciseTracker
                key={exercise.id}
                exercise={exercise}
                onUpdate={handleUpdateExercise}
                onRemove={handleRemoveExercise}
              />
            ))}
          </div>
        )}
      </section>

      {startError && (
        <GlassCard style={{ background: "rgba(255, 64, 64, 0.08)", border: "1px solid rgba(255, 64, 64, 0.2)" }}>
          <p style={{ margin: 0, color: "#ff8080" }}>Couldn't start your workout. Please try again.</p>
          <GradientButton type="button" onClick={handleSaveSession} disabled={saving}>
            {saving ? "Retrying..." : "Retry"}
          </GradientButton>
        </GlassCard>
      )}

      <GlassCard style={{ marginTop: "24px", display: "grid", gap: "18px" }}>
        <div style={{ color: "#96a0b8" }}>
          <p style={{ margin: 0 }}>Estimated duration: {workoutSession.durationMinutes} min</p>
          <p style={{ margin: "8px 0 0" }}>Estimated calories burned: {Math.round(workoutSession.caloriesBurned)} kcal</p>
          <p style={{ margin: "8px 0 0" }}>Total rest time: {Math.round(workoutSession.totalRestSeconds / 60)} min</p>
        </div>
        <GradientButton type="button" onClick={handleSaveSession} disabled={selectedExercises.length === 0 || saving}>
          {saving ? "Starting workout..." : "Start Workout Session"}
        </GradientButton>
      </GlassCard>
    </div>
  );
}

export default WorkoutBuilder;
