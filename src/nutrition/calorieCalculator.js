const ACTIVITY_MULTIPLIERS = {
  Sedentary: 1.2,
  Light: 1.375,
  Moderate: 1.55,
  "Very Active": 1.725,
  Athlete: 1.9,
};

const GOAL_ADJUSTMENTS = {
  "Muscle Gain": 1.12,
  "Fat Loss": 0.85,
  Maintenance: 1.0,
  Recomposition: 1.0,
};

const MACRO_RANGES = {
  "Muscle Gain": { protein: 1.8, carbs: 4.0, fat: 0.9 },
  "Fat Loss": { protein: 2.0, carbs: 2.5, fat: 0.8 },
  Maintenance: { protein: 1.6, carbs: 3.0, fat: 1.0 },
  Recomposition: { protein: 2.2, carbs: 2.8, fat: 0.9 },
};

const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
};

export function calculateBMR(profile) {
  if (!profile || profile.age == null || profile.height_cm == null || profile.weight_kg == null || !profile.gender) {
    return null;
  }

  const age = Number(profile.age);
  const height = Number(profile.height_cm);
  const weight = Number(profile.weight_kg);
  const gender = String(profile.gender).toLowerCase();

  if (gender === "male") {
    return 88.36 + 13.4 * weight + 4.8 * height - 5.7 * age;
  }

  if (gender === "female") {
    return 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
  }

  return 447.6 + 9.2 * weight + 3.1 * height - 4.3 * age;
}

export function calculateTDEE(profile) {
  const bmr = calculateBMR(profile);
  if (bmr == null) {
    return null;
  }

  const activityLevel = profile.activity_level || "Sedentary";
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.2;
  return bmr * multiplier;
}

export function calculateDailyCalories(profile) {
  const tdee = calculateTDEE(profile);
  if (tdee == null) {
    return null;
  }

  const goal = profile.goal || "Maintenance";
  const adjustment = GOAL_ADJUSTMENTS[goal] ?? 1.0;
  return tdee * adjustment;
}

export function calculateMacroTargets(profile) {
  if (!profile || profile.weight_kg == null || !profile.goal) {
    return null;
  }

  const weight = Number(profile.weight_kg);
  const goal = profile.goal || "Maintenance";
  const macro = MACRO_RANGES[goal] || MACRO_RANGES.Maintenance;

  const protein = Math.round(weight * macro.protein);
  const carbs = Math.round(weight * macro.carbs);
  const fat = Math.round(weight * macro.fat);

  const caloriesFromProtein = protein * CALORIES_PER_GRAM.protein;
  const caloriesFromCarbs = carbs * CALORIES_PER_GRAM.carbs;
  const caloriesFromFat = fat * CALORIES_PER_GRAM.fat;
  const totalCalories = caloriesFromProtein + caloriesFromCarbs + caloriesFromFat;

  return {
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    calories: totalCalories,
  };
}

export function calculateNutritionTargets(profile) {
  const dailyCalories = calculateDailyCalories(profile);
  const macroTargets = calculateMacroTargets(profile);

  if (dailyCalories == null || !macroTargets) {
    return null;
  }

  return {
    dailyCalories: Math.round(dailyCalories),
    proteinTarget: macroTargets.protein_g,
    carbsTarget: macroTargets.carbs_g,
    fatTarget: macroTargets.fat_g,
    calculatedMacroCalories: macroTargets.calories,
  };
}
