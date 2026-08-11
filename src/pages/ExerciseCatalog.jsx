import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Breadcrumb from "../components/UI/Breadcrumb.jsx";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import { fetchBodyParts } from "../services/bodyParts.js";
import { ROUTES } from "../utils/routes.js";

function ExerciseCatalog() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCategories = async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await fetchBodyParts();
        setCategories(data || []);
      } catch (err) {
        console.error("Failed to load body parts", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    void loadCategories();
  }, []);

  return (
    <div className="page-shell">
      <Breadcrumb backUrl="/" backLabel="Back to Dashboard" />
      <SectionTitle title="Exercise Catalog" subtitle="Choose a category" />

      {loading && (
        <GlassCard>
          <p>Loading exercise categories...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8080" }}>Failed to load categories.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && categories.length === 0 && (
        <GlassCard>
          <p>No exercise categories are available right now.</p>
        </GlassCard>
      )}

      {!loading && !error && categories.length > 0 && (
        <div style={{ display: "grid", gap: "18px" }}>
          {categories.map((part) => (
            <Link
              key={part.id}
              to={ROUTES.EXERCISE_CATEGORY(part.id)}
              style={{
                textDecoration: "none",
              }}
            >
              <GlassCard style={{ cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px" }}>
                  <div>
                    <p style={{ margin: 0, color: "#39ffab", fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "0.18em" }}>
                      {part.icon} {part.name}
                    </p>
                    <h3 style={{ margin: "8px 0 0", fontSize: "1.65rem", color: "#f8fafc" }}>{part.name}</h3>
                  </div>
                  <div style={{ color: "#96a0b8", fontWeight: 700, fontSize: "0.95rem" }}>{part.category || part.id}</div>
                </div>
                {part.description && <p style={{ margin: "18px 0 0", color: "#c4c8d4", lineHeight: 1.7 }}>{part.description}</p>}
              </GlassCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default ExerciseCatalog;
