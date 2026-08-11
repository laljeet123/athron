import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";

function FoodCard({ food, onSelect }) {
  if (!food) {
    return null;
  }

  return (
    <GlassCard style={{ display: "grid", gap: "12px", padding: "18px" }}>
      <div>
        <h3 style={{ margin: 0, color: "#f8fafc" }}>{food.name}</h3>
        <p style={{ margin: "8px 0 0", color: "#96a0b8" }}>{food.category}</p>
      </div>
      <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Calories</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{food.calories} kcal</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Protein</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{food.protein_g} g</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Carbs</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{food.carbs_g} g</p>
        </div>
        <div>
          <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Fat</p>
          <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{food.fat_g} g</p>
        </div>
      </div>
      <GradientButton onClick={() => onSelect(food)}>Select food</GradientButton>
    </GlassCard>
  );
}

export default FoodCard;
