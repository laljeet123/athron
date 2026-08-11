import { Link } from "react-router-dom";
import { ROUTES } from "../utils/routes.js";

function ExerciseCard({ exercise }) {
  if (!exercise) return null;

  const {
    id,
    name,
    description,
    instructions,
    difficulty,
    equipment,
    target_muscles,
  } = exercise;

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "18px",
        padding: "22px",
        background: "rgba(15, 18, 32, 0.95)",
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.22)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start" }}>
        <div style={{ display: "flex", gap: "14px", alignItems: "center" }}>
          <div style={{ width: 84, height: 84, borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.02)", display: "grid", placeItems: "center" }}>
            {exercise.icon ? (
              // try to load local asset path first
              <img src={`/assets/exercises/${exercise.icon}`} alt={name} style={{ width: "72px", height: "72px", objectFit: "cover" }} onError={(e) => { e.target.style.display = 'none'; }} />
            ) : (
              <div style={{ fontSize: "2rem" }}>{exercise.target_muscles ? exercise.target_muscles[0] : "🏋️"}</div>
            )}
          </div>

          <div>
            <h3 style={{ margin: "0 0 8px", fontSize: "1.35rem", color: "#f8fafc" }}>{name}</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", color: "#96a0b8", fontSize: "0.92rem" }}>
              {difficulty && <span>Difficulty: {difficulty}</span>}
              {equipment && <span>Equipment: {equipment}</span>}
              {target_muscles && <span>Target: {target_muscles}</span>}
            </div>
          </div>
        </div>

        <Link
          to={`/exercise/${id}`}
          style={{
            alignSelf: "center",
            color: "#39ffab",
            textDecoration: "none",
            fontWeight: 700,
            padding: "10px 16px",
            borderRadius: "16px",
            background: "rgba(57,255,171,0.12)",
          }}
        >
          View exercise
        </Link>
      </div>

      {description && (
        <div style={{ margin: "20px 0 0", color: "#c4c8d4", lineHeight: 1.75 }}>
          <strong>Description</strong>
          <p style={{ margin: "8px 0 0" }}>{description}</p>
        </div>
      )}

      {instructions && (
        <div style={{ margin: "20px 0 0", color: "#c4c8d4", lineHeight: 1.75 }}>
          <strong>Instructions</strong>
          <p style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>{instructions}</p>
        </div>
      )}
    </div>
  );
}

export default ExerciseCard;
