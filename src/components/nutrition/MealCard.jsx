import GlassCard from "../UI/GlassCard.jsx";

function MealCard({ meal }) {
  if (!meal) {
    return null;
  }

  return (
    <GlassCard style={{ display: "grid", gap: "12px", padding: "18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ margin: 0, color: "#f8fafc" }}>{meal.food?.name || "Logged food"}</h3>
          <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{meal.meal_type} · {meal.quantity}{meal.unit}</p>
        </div>
        <p style={{ margin: 0, color: "#39ffab", fontWeight: 700 }}>{Math.round(meal.calories)} kcal</p>
      </div>
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Protein</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{meal.protein_g} g</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Carbs</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{meal.carbs_g} g</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Fat</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{meal.fat_g} g</p>
        </div>
      </div>
    </GlassCard>
  );
}

export default MealCard;
