export function generateRecommendation(context) {
  if (!context || !context.profile) return "I need your profile to create personalized recommendations.";

  const profile = context.profile;
  const nutrition = context.nutrition;
  const workout = context.workout;

  if (!nutrition) return "I don't have today's nutrition data. Log meals to get recommendations.";

  const remainingCalories = nutrition.targets ? Math.max(0, Math.round(nutrition.targets.dailyCalories - (nutrition.dailyNutrition?.calories || 0))) : null;
  const remainingProtein = nutrition.targets ? Math.max(0, Math.round(nutrition.targets.proteinTarget - (nutrition.dailyNutrition?.protein_g || 0))) : null;

  if (workout && workout.length > 0) {
    return `You trained today. You have approximately ${remainingCalories ?? "--"} kcal and ${remainingProtein ?? "--"} g protein remaining. Prioritize a protein-rich meal for recovery.`;
  }

  return `You have about ${remainingCalories ?? "--"} kcal and ${remainingProtein ?? "--"} g protein remaining today.`;
}
