import { calculateNutritionTargets } from "../nutrition/calorieCalculator.js";
import { calculateMealNutrition } from "../nutrition/mealCalculator.js";

export function createNutritionRecommendations(profile, mealLogs = [], workoutCalories = 0) {
  const targets = calculateNutritionTargets(profile);
  if (!targets) {
    return {
      message: "I need your profile data to calculate personalized nutrition recommendations.",
      shortfall: null,
    };
  }

  const consumed = calculateMealNutrition(mealLogs);
  const remainingCalories = Math.max(targets.dailyCalories - consumed.calories + workoutCalories, 0);
  const remainingProtein = Math.max(targets.proteinTarget - consumed.protein_g, 0);
  const remainingCarbs = Math.max(targets.carbsTarget - consumed.carbs_g, 0);
  const remainingFat = Math.max(targets.fatTarget - consumed.fat_g, 0);

  const recommendations = [];
  if (remainingProtein > 0) {
    recommendations.push(`You are ${remainingProtein.toFixed(1)} g short of your protein target.`);
  }
  if (remainingCalories > 0) {
    recommendations.push(`You have approximately ${Math.round(remainingCalories)} kcal remaining today.`);
  }

  if (remainingCalories <= 250 && remainingCalories > 0) {
    recommendations.push("Choose a light, high-protein snack to finish the day without overloading calories.");
  }

  if (remainingCalories === 0) {
    recommendations.push("Your nutrition is on track. Focus on balanced protein and fiber for recovery.");
  }

  if (!recommendations.length) {
    recommendations.push("Your intake is aligned with your daily target. Maintain protein and hydration.");
  }

  return {
    message: recommendations.join(" "),
    targets,
    consumed,
    remaining: {
      calories: remainingCalories,
      protein_g: remainingProtein,
      carbs_g: remainingCarbs,
      fat_g: remainingFat,
    },
  };
}
