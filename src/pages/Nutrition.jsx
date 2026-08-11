import { useEffect, useState } from "react";
import GlassCard from "../components/UI/GlassCard.jsx";
import SectionTitle from "../components/UI/SectionTitle.jsx";
import NutritionProgress from "../components/nutrition/NutritionProgress.jsx";
import MealLogger from "../components/nutrition/MealLogger.jsx";
import WaterLogger from "../components/nutrition/WaterLogger.jsx";
import MealCard from "../components/nutrition/MealCard.jsx";
import { loadNutritionSummary } from "../services/nutrition.js";

function Nutrition() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refreshSummary = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await loadNutritionSummary();
      setSummary(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSummary();
  }, []);

  const targets = summary?.targets;
  const dailyNutrition = summary?.dailyNutrition ?? { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0, water_ml: 0 };
  const meals = summary?.meals || [];

  const remainingCalories = targets ? Math.max(targets.dailyCalories - dailyNutrition.calories, 0) : 0;
  const remainingProtein = targets ? Math.max(targets.proteinTarget - dailyNutrition.protein_g, 0) : 0;
  const remainingCarbs = targets ? Math.max(targets.carbsTarget - dailyNutrition.carbs_g, 0) : 0;
  const remainingFat = targets ? Math.max(targets.fatTarget - dailyNutrition.fat_g, 0) : 0;

  return (
    <div className="page-shell">
      <SectionTitle title="Nutrition" subtitle="Personalized eating plan" />

      {loading && (
        <GlassCard>
          <p>Loading your nutrition summary...</p>
        </GlassCard>
      )}

      {error && (
        <GlassCard>
          <p style={{ color: "#ff8a80" }}>Unable to load nutrition data.</p>
          <p>{error.message || JSON.stringify(error)}</p>
        </GlassCard>
      )}

      {!loading && !error && (
        <div style={{ display: "grid", gap: "24px" }}>
          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1.2fr 0.8fr" }}>
            <GlassCard style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "14px" }}>
                <div>
                  <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Daily nutrition</p>
                  <h2 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Today&apos;s food and macros</h2>
                </div>

                {targets ? (
                  <div style={{ display: "grid", gap: "16px" }}>
                    <NutritionProgress label="Calories" consumed={Math.round(dailyNutrition.calories)} target={targets.dailyCalories} unit="kcal" />
                    <NutritionProgress label="Protein" consumed={Math.round(dailyNutrition.protein_g)} target={targets.proteinTarget} unit="g" color="#ffa726" />
                    <NutritionProgress label="Carbs" consumed={Math.round(dailyNutrition.carbs_g)} target={targets.carbsTarget} unit="g" color="#66bb6a" />
                    <NutritionProgress label="Fat" consumed={Math.round(dailyNutrition.fat_g)} target={targets.fatTarget} unit="g" color="#29b6f6" />
                    <NutritionProgress label="Fiber" consumed={Math.round(dailyNutrition.fiber_g)} target={Math.max(Math.round(targets.proteinTarget * 0.25), 25)} unit="g" color="#ab47bc" />
                  </div>
                ) : (
                  <div>
                    <p style={{ margin: 0, color: "#96a0b8" }}>
                      Complete your profile so Athron can calculate your BMR, TDEE, calorie, and macro targets.
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>

            <GlassCard style={{ padding: "24px" }}>
              <div style={{ display: "grid", gap: "16px" }}>
                <div>
                  <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Daily summary</p>
                  <h3 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Nutrition snapshot</h3>
                </div>
                <div style={{ display: "grid", gap: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#96a0b8" }}>Calories remaining</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{Math.round(remainingCalories)} kcal</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#96a0b8" }}>Protein remaining</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{Math.round(remainingProtein)} g</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#96a0b8" }}>Carbs remaining</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{Math.round(remainingCarbs)} g</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#96a0b8" }}>Fat remaining</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{Math.round(remainingFat)} g</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#96a0b8" }}>Water logged</span>
                    <span style={{ color: "#f8fafc", fontWeight: 700 }}>{Math.round(dailyNutrition.water_ml)} ml</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          <div style={{ display: "grid", gap: "18px", gridTemplateColumns: "1.2fr 0.8fr" }}>
            <div style={{ display: "grid", gap: "18px" }}>
              <MealLogger onMealLogged={refreshSummary} />
              <WaterLogger onWaterLogged={refreshSummary} />
            </div>

            <GlassCard style={{ padding: "24px", display: "grid", gap: "18px" }}>
              <div>
                <p style={{ margin: 0, color: "#9fa8c9", textTransform: "uppercase", fontSize: "0.75rem" }}>Meal log</p>
                <h3 style={{ margin: "12px 0 0", color: "#f8fafc" }}>Today&apos;s meals</h3>
              </div>
              {meals.length === 0 ? (
                <p style={{ color: "#96a0b8" }}>No meals logged today yet.</p>
              ) : (
                <div style={{ display: "grid", gap: "12px" }}>
                  {meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                </div>
              )}
            </GlassCard>
          </div>
        </div>
      )}
    </div>
  );
}

export default Nutrition;
