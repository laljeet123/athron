import { useEffect, useState } from "react";
import { fetchBodyParts } from "../services/bodyParts.js";
import { fetchExercises } from "../services/exercises.js";
import BodyPartCard from "./BodyPartCard.jsx";
import ExerciseCard from "./ExerciseCard.jsx";

function BodyPartSelector({ onSelect, onExerciseSelect }) {
  const [bodyParts, setBodyParts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [exercisesLoading, setExercisesLoading] = useState(false);

  useEffect(() => {
    const loadBodyParts = async () => {
      setError(null);
      setLoading(true);

      try {
        const data = await fetchBodyParts();
        setBodyParts(data || []);
      } catch (err) {
        console.error("Body parts load failed:", err);
        setError(err);
        setBodyParts([]);
      } finally {
        setLoading(false);
      }
    };

    void loadBodyParts();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h2>Loading body parts...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial" }}>
        <h2>Error loading body parts</h2>
        <p>{error.message || error.details || JSON.stringify(error)}</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: "16px", marginTop: "24px" }}>
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {bodyParts.map((part) => (
          <BodyPartCard
            key={part.id}
            bodyPart={part}
            onSelect={async (p) => {
              setSelectedPart(p);
              onSelect?.(p);
              // load exercises for the selected part
              setExercisesLoading(true);
              try {
                const data = await fetchExercises(p.id);
                setExercises(data || []);
              } catch (err) {
                console.warn("Failed to load exercises for part", err);
                setExercises([]);
              } finally {
                setExercisesLoading(false);
              }
            }}
          />
        ))}
      </div>

      {selectedPart && (
        <div style={{ marginTop: 12 }}>
          <h3 style={{ margin: 0 }}>{selectedPart.name}</h3>
          {exercisesLoading && <p>Loading exercises...</p>}
          {!exercisesLoading && exercises.length === 0 && <p>No exercises found for this body part.</p>}
          {!exercisesLoading && exercises.length > 0 && (
            <div style={{ display: "grid", gap: 12 }}>
              {exercises.map((ex) => (
                <div key={ex.id} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: 8, borderRadius: 8, background: "#fff" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{ex.name}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{ex.description}</div>
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => onExerciseSelect ? onExerciseSelect(ex) : onSelect?.(selectedPart)}
                      style={{ padding: "8px 12px", borderRadius: 8, background: "#06b6d4", color: "#021" }}
                    >
                      Select
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BodyPartSelector;
