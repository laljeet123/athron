import { useMemo, useState } from "react";
import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";
import FoodCard from "./FoodCard.jsx";
import { searchFoods } from "../../services/foods.js";

function FoodSearch({ onSelectFood }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const hasQuery = useMemo(() => query.trim().length > 0, [query]);

  const handleSearch = async () => {
    if (!hasQuery) {
      setError(new Error("Search term cannot be empty."));
      setResults([]);
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const data = await searchFoods(query);
      setResults(data || []);
      if (!data?.length) {
        setError(new Error("No foods found for that search."));
      }
    } catch (err) {
      setError(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard style={{ padding: "24px", display: "grid", gap: "18px" }}>
      <div>
        <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Search foods</p>
        <h3 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Find food from the database</h3>
      </div>
      <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr auto" }}>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search for dal, rice, paneer..."
          style={{ padding: "14px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
        />
        <GradientButton type="button" onClick={handleSearch}>
          {loading ? "Searching..." : "Search"}
        </GradientButton>
      </div>
      {error && (
        <div style={{ color: "#ff8a80", fontSize: "0.95rem" }}>{error.message}</div>
      )}
      <div style={{ display: "grid", gap: "16px" }}>
        {results.map((food) => (
          <FoodCard key={food.id} food={food} onSelect={onSelectFood} />
        ))}
      </div>
    </GlassCard>
  );
}

export default FoodSearch;
