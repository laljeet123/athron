import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Breadcrumb from "../components/UI/Breadcrumb.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { fetchExerciseCategoryById, fetchMusclesByCategory } from "../services/exercises.js";
import { ROUTES } from "../utils/routes.js";

function ExerciseMuscles() {
  const { categoryId } = useParams();
  const [category, setCategory] = useState(null);
  const [muscles, setMuscles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setError(null);
      setLoading(true);

      try {
        const [categoryData, musclesData] = await Promise.all([
          fetchExerciseCategoryById(categoryId),
          fetchMusclesByCategory(categoryId),
        ]);

        setCategory(categoryData);
        setMuscles(musclesData || []);
      } catch (err) {
        console.error("Failed to load muscles for category", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    if (categoryId) {
      void loadData();
    }
  }, [categoryId]);

  return (
    <div className="page-shell">
      <Breadcrumb
        backUrl={ROUTES.EXERCISES_CATALOG}
        backLabel="Back to Exercises"
        segments={[
          { label: "Exercises", to: ROUTES.EXERCISES_CATALOG },
          { label: category?.name || "Category" },
        ]}
      />
      <SectionTitle title={category ? category.name : "Choose a muscle"} subtitle="Select the best fit" />

      {loading && (
        <GlassCard>
          <p>Loading muscles...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Failed to load muscle groups.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && muscles.length === 0 && (
        <GlassCard>
          <p>No muscle groups available for this category.</p>
        </GlassCard>
      )}

      {!loading && !error && muscles.length > 0 && (
        <div style={{ display: "grid", gap: "18px" }}>
          {muscles.map((muscle) => (
            <Link
              key={muscle.id}
              to={ROUTES.EXERCISE_MUSCLE(categoryId, muscle.id)}
              style={{ textDecoration: "none" }}
            >
              <GlassCard style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <div>
                    <p style={{ margin: 0, color: "#39ffab", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>{muscle.name}</p>
                    <h3 style={{ margin: "8px 0 0", fontSize: "1.5rem", color: "#f8fafc" }}>{muscle.name}</h3>
                  </div>
                </div>
                {muscle.description && <p style={{ margin: "18px 0 0", color: "#c4c8d4", lineHeight: 1.7 }}>{muscle.description}</p>}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseMuscles;
