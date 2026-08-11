import { useEffect, useRef, useState } from "react";
import CameraView from "../../camera/CameraView.jsx";
import { createPoseDetector } from "../../ai/poseDetection.js";
import { elbowAngle, kneeAngle, shoulderAngle } from "../../ai/angleCalculator.js";
import { useWorkout } from "../../context/WorkoutContext.jsx";

function chooseAngleFn(exercise) {
  const name = (exercise?.name || "").toLowerCase();
  if (/squat|lunge|deadlift|leg/i.test(name)) return kneeAngle;
  if (/press|shoulder|raise|row|pull/i.test(name)) return shoulderAngle;
  if (/curl|press|push|pull|bench/i.test(name)) return elbowAngle;
  // fallback to elbowAngle for upper-body default
  return elbowAngle;
}

export function ExerciseLiveTracker({ exercise }) {
  const videoRef = useRef(null);
  const poseRef = useRef(null);
  const rafRef = useRef(null);
  const [reps, setReps] = useState(0);
  const [stage, setStage] = useState("down");
  const [angle, setAngle] = useState(null);
  const workout = useWorkout();

  useEffect(() => {
    let mounted = true;
    let detector;

    async function init() {
      try {
        detector = await createPoseDetector((results) => {
          if (!mounted) return;
          const landmarks = results.landmarksArray || results.landmarks || [];
          const fn = chooseAngleFn(exercise);
          const a = fn(landmarks);
          setAngle(a);

          if (a == null) return;

          const flexThreshold = 65;
          const extendThreshold = 150;

          if (stage === "down" && a <= flexThreshold) {
            setStage("up");
            setReps((r) => r + 1);
          } else if (stage === "up" && a >= extendThreshold) {
            setStage("down");
          }
        });

        poseRef.current = detector;
      } catch (err) {
        console.warn("Pose detector init failed", err);
      }
    }

    void init();

    return () => {
      mounted = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (poseRef.current && poseRef.current.close) poseRef.current.close();
    };
  }, [exercise]);

  // feed video frames into the pose detector loop
  useEffect(() => {
    let running = true;

    async function frameLoop() {
      if (!running) return;
      try {
        if (videoRef.current && poseRef.current && typeof poseRef.current.send === "function") {
          await poseRef.current.send({ image: videoRef.current });
        }
      } catch (err) {
        // ignore frame errors
      }
      rafRef.current = requestAnimationFrame(frameLoop);
    }

    rafRef.current = requestAnimationFrame(frameLoop);

    return () => {
      running = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    // when target reps reached for current set, complete set automatically
    const target = exercise?.reps ?? 0;
    if (target > 0 && reps >= target) {
      try {
        workout.completeSet();
      } catch (err) {
        console.warn("Auto-complete set failed", err);
      }
      setReps(0);
    }
  }, [reps, exercise, workout]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <CameraView
        onReady={(videoEl) => {
          videoRef.current = videoEl;
        }}
        onError={(err) => console.warn("Camera error", err)}
      />

      <div style={{ display: "flex", gap: 12, alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ color: "#9fa8c9", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em" }}>Live tracking</div>
          <div style={{ fontWeight: 700, color: "#f8fafc", fontSize: "1.25rem" }}>{exercise?.name || "Exercise"}</div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ color: "#7b82a1", fontSize: "0.75rem" }}>Reps detected</div>
          <div style={{ fontWeight: 800, fontSize: "1.5rem", color: "#0fffc1" }}>{reps}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ color: "#96a0b8" }}>Angle:</div>
        <div style={{ fontWeight: 700, color: "#f8fafc" }}>{angle ?? "—"}°</div>
        <div style={{ marginLeft: "auto", color: "#9fa8c9" }}>Stage: {stage}</div>
      </div>
    </div>
  );
}
import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";

function ExerciseTracker({ exercise, onUpdate, onRemove }) {
  const [sets, setSets] = useState(exercise.sets || 3);
  const [reps, setReps] = useState(exercise.reps || 10);
  const [restSeconds, setRestSeconds] = useState(exercise.restSeconds || 60);

  const handleChange = (field, value) => {
    const parsed = Number(value);
    const next = Number.isNaN(parsed) ? 0 : parsed;
    if (field === "sets") setSets(next);
    if (field === "reps") setReps(next);
    if (field === "restSeconds") setRestSeconds(next);
    onUpdate({
      ...exercise,
      sets: field === "sets" ? next : sets,
      reps: field === "reps" ? next : reps,
      restSeconds: field === "restSeconds" ? next : restSeconds,
    });
  };

  return (
    <GlassCard style={{ display: "grid", gap: "16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
        <div>
          <h3 style={{ margin: 0, color: "#f8fafc" }}>{exercise.name}</h3>
          <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{exercise.description || "No description available."}</p>
        </div>
        <GradientButton onClick={() => onRemove(exercise.id)} style={{ alignSelf: "start" }}>
          Remove
        </GradientButton>
      </div>

      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))" }}>
        <label style={{ display: "grid", gap: "6px", color: "#c7d2fe" }}>
          Sets
          <input
            type="number"
            min="1"
            value={sets}
            onChange={(event) => handleChange("sets", event.target.value)}
            style={{ padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" }}
          />
        </label>

        <label style={{ display: "grid", gap: "6px", color: "#c7d2fe" }}>
          Reps
          <input
            type="number"
            min="1"
            value={reps}
            onChange={(event) => handleChange("reps", event.target.value)}
            style={{ padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" }}
          />
        </label>

        <label style={{ display: "grid", gap: "6px", color: "#c7d2fe" }}>
          Rest (sec)
          <input
            type="number"
            min="10"
            value={restSeconds}
            onChange={(event) => handleChange("restSeconds", event.target.value)}
            style={{ padding: "10px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#fff" }}
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <span style={{ color: "#7b82a1" }}>
          Estimated load: <strong>{exercise.sets ?? 3} sets × {exercise.reps ?? 10} reps</strong>
        </span>
        <span style={{ color: "#7b82a1" }}>
          Rest interval: <strong>{exercise.restSeconds ?? 60}s</strong>
        </span>
      </div>
    </GlassCard>
  );
}

export default ExerciseTracker;
