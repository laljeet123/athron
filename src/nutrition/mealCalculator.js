export function calculateFoodNutrition(food, quantity, unit = "g") {
  if (!food || quantity == null) {
    return null;
  }

  const amount = Number(quantity);
  if (Number.isNaN(amount) || amount <= 0) {
    return null;
  }

  const servingSize = Number(food.serving_size ?? 100);
  const grams = unit === "oz" ? amount * 28.3495 : amount;
  const multiplier = grams / servingSize;

  return {
    calories: Number((Number(food.calories) * multiplier).toFixed(1)),
    protein_g: Number((Number(food.protein_g) * multiplier).toFixed(1)),
    carbs_g: Number((Number(food.carbs_g) * multiplier).toFixed(1)),
    fat_g: Number((Number(food.fat_g) * multiplier).toFixed(1)),
    fiber_g: Number((Number(food.fiber_g ?? 0) * multiplier).toFixed(1)),
    quantity: amount,
    unit,
  };
}

export function calculateMealNutrition(foodEntries) {
  if (!Array.isArray(foodEntries)) {
    return null;
  }

  return foodEntries.reduce(
    (totals, entry) => {
      if (!entry) return totals;
      const calories = Number(entry.calories) || 0;
      const protein = Number(entry.protein_g) || 0;
      const carbs = Number(entry.carbs_g) || 0;
      const fat = Number(entry.fat_g) || 0;
      const fiber = Number(entry.fiber_g) || 0;

      return {
        calories: totals.calories + calories,
        protein_g: totals.protein_g + protein,
        carbs_g: totals.carbs_g + carbs,
        fat_g: totals.fat_g + fat,
        fiber_g: totals.fiber_g + fiber,
      };
    },
    { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, fiber_g: 0 }
  );
}

export function calculateDailyNutrition(mealLogs = [], waterLogs = []) {
  const mealTotals = calculateMealNutrition(mealLogs);
  return {
    ...mealTotals,
    water_ml: waterLogs.reduce((sum, log) => sum + Number(log.amount_ml || 0), 0),
    calorieRemaining: null,
    proteinRemaining: null,
    carbsRemaining: null,
    fatRemaining: null,
  };
}
