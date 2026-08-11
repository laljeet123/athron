import { useNavigate } from "react-router-dom";
import GlassCard from "../components/UI/GlassCard.jsx";
import GradientButton from "../components/UI/GradientButton.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import RestTimer from "../components/Workout/RestTimer.jsx";
import WorkoutSummary from "../components/Workout/WorkoutSummary.jsx";
import { ExerciseLiveTracker } from "../components/Workout/ExerciseTracker.jsx";
import { ROUTES } from "../utils/routes.js";
import { useWorkout } from "../context/WorkoutContext.jsx";

function ActiveWorkout() {
  const navigate = useNavigate();
  const workout = useWorkout();
  const session = workout.session;
  const currentExercise = workout.currentExercise;
  const nextExercise = workout.nextExercise;

  if (!session) {
    return (
      <div className="page-shell">
        <SectionTitle title="Active workout" subtitle="No session found" />
        <GlassCard>
          <p style={{ margin: 0, color: "#96a0b8" }}>
            Build and save a workout session first to start active tracking.
          </p>
          <GradientButton onClick={() => navigate(ROUTES.WORKOUT_BUILDER)}>Build workout</GradientButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <SectionTitle title="Active workout" subtitle="Track your sets" />

      <WorkoutSummary session={session} onSave={() => {}} />

      <GlassCard style={{ display: "grid", gap: "18px" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: "0.16em" }}>
            Current exercise
          </p>
          <h3 style={{ margin: "10px 0 0", color: "#f8fafc" }}>{currentExercise?.name || "Rest focus"}</h3>
          <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{currentExercise?.description || "Recover and prepare for the next set."}</p>
        </div>

        {currentExercise && (
            <div style={{ display: "grid", gap: "14px", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
            <div style={{ padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Sets</p>
              <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{currentExercise.sets}</p>
            </div>
            <div style={{ padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Reps</p>
              <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{currentExercise.reps}</p>
            </div>
            <div style={{ padding: "18px", borderRadius: "18px", background: "rgba(255,255,255,0.04)" }}>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.78rem" }}>Rest</p>
              <p style={{ margin: "10px 0 0", color: "#f8fafc", fontWeight: 700 }}>{currentExercise.restSeconds}s</p>
            </div>
          </div>
        )}
      
      {currentExercise && (
        <GlassCard style={{ marginTop: 18 }}>
          <ExerciseLiveTracker exercise={currentExercise} />
        </GlassCard>
      )}
      </GlassCard>

      {workout.timerActive && (
        <RestTimer initialSeconds={workout.timerSeconds} onComplete={() => workout.goToNextExercise()} />
      )}

      <GlassCard style={{ display: "grid", gap: "16px" }}>
        <div style={{ display: "grid", gap: "8px" }}>
          <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Workout status</p>
          <p style={{ margin: 0, color: "#c4c8d4" }}>
            {workout.paused ? "Paused" : "In progress"} · Set {workout.currentSet} · {currentExercise?.sets ?? 0} total sets
          </p>
          {nextExercise && (
            <p style={{ margin: 0, color: "#c4c8d4" }}>Next: {nextExercise.name}</p>
          )}
        </div>

        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
          <GradientButton onClick={workout.goToPreviousExercise} disabled={!workout.hasSession || !workout.currentExercise}>
            Previous exercise
          </GradientButton>
          <GradientButton onClick={workout.completeSet} disabled={!workout.hasSession || !workout.currentExercise}>
            Complete set
          </GradientButton>
          <GradientButton onClick={workout.goToNextExercise} disabled={!workout.hasSession || !workout.currentExercise}>
            Next exercise
          </GradientButton>
          <GradientButton onClick={workout.paused ? workout.resumeWorkout : workout.pauseWorkout}>
            {workout.paused ? "Resume workout" : "Pause workout"}
          </GradientButton>
        </div>
      </GlassCard>
    </div>
  );
}

export default ActiveWorkout;
