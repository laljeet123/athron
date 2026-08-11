import { useMemo, useState } from "react";
import GlassCard from "../UI/GlassCard.jsx";
import GradientButton from "../UI/GradientButton.jsx";
import FoodSearch from "./FoodSearch.jsx";
import { calculateFoodNutrition } from "../../nutrition/mealCalculator.js";
import { createMealLog } from "../../services/mealLogs.js";

const MEAL_TYPES = ["Breakfast", "Lunch", "Dinner", "Snack", "Post Workout"];

function MealLogger({ onMealLogged }) {
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(100);
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [unit, setUnit] = useState("g");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const nutrition = useMemo(() => {
    if (!selectedFood || !quantity) {
      return null;
    }
    return calculateFoodNutrition(selectedFood, quantity, unit);
  }, [selectedFood, quantity, unit]);

  const onSubmit = async () => {
    if (!selectedFood) {
      setMessage({ type: "error", text: "Select a food before logging." });
      return;
    }

    if (!quantity || quantity <= 0) {
      setMessage({ type: "error", text: "Enter a valid quantity." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const mealEntry = {
        food_id: selectedFood.id,
        meal_type: mealType,
        quantity,
        unit,
        calories: nutrition.calories,
        protein_g: nutrition.protein_g,
        carbs_g: nutrition.carbs_g,
        fat_g: nutrition.fat_g,
      };

      await createMealLog(mealEntry);
      setMessage({ type: "success", text: "Meal logged successfully." });
      setSelectedFood(null);
      setQuantity(100);
      setMealType(MEAL_TYPES[0]);
      setUnit("g");
      onMealLogged?.();
    } catch (error) {
      setMessage({ type: "error", text: error?.message || "Failed to log meal." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <GlassCard style={{ display: "grid", gap: "18px", padding: "24px" }}>
      <div>
        <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Meal logger</p>
        <h3 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Capture what you eat</h3>
      </div>

      <FoodSearch onSelectFood={setSelectedFood} />

      {selectedFood && (
        <GlassCard style={{ background: "rgba(255,255,255,0.04)", padding: "18px" }}>
          <h4 style={{ margin: 0, color: "#f8fafc" }}>Selected food</h4>
          <p style={{ margin: "10px 0 0", color: "#96a0b8" }}>{selectedFood.name}</p>
          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "1fr 1fr 1fr" }}>
            <label style={{ display: "grid", gap: "8px" }}>
              Quantity
              <input
                type="number"
                value={quantity}
                min="1"
                onChange={(event) => setQuantity(Number(event.target.value))}
                style={{ padding: "12px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              />
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Unit
              <select
                value={unit}
                onChange={(event) => setUnit(event.target.value)}
                style={{ padding: "12px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              >
                <option value="g">g</option>
                <option value="oz">oz</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: "8px" }}>
              Meal type
              <select
                value={mealType}
                onChange={(event) => setMealType(event.target.value)}
                style={{ padding: "12px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", color: "#f8fafc" }}
              >
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))" }}>
            <div>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Calories</p>
              <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{nutrition?.calories ?? 0} kcal</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Protein</p>
              <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{nutrition?.protein_g ?? 0} g</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Carbs</p>
              <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{nutrition?.carbs_g ?? 0} g</p>
            </div>
            <div>
              <p style={{ margin: 0, color: "#7b82a1", fontSize: "0.75rem" }}>Fat</p>
              <p style={{ margin: "8px 0 0", color: "#f8fafc", fontWeight: 700 }}>{nutrition?.fat_g ?? 0} g</p>
            </div>
          </div>

          <GradientButton type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? "Logging meal..." : "Log meal"}
          </GradientButton>
        </GlassCard>
      )}

      {message && (
        <div style={{ color: message.type === "error" ? "#ff8a80" : "#39ffab", fontSize: "0.95rem" }}>{message.text}</div>
      )}
    </GlassCard>
  );
}

export default MealLogger;
