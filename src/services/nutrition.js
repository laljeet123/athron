import { loadStoredProfile } from "./localProfile.js";
import { fetchTodayMealLogs } from "./mealLogs.js";
import { fetchTodayWaterLogs } from "./waterLogs.js";
import { fetchTodayWorkoutSessions } from "./workouts.js";
import { calculateNutritionTargets } from "../nutrition/calorieCalculator.js";
import { calculateDailyNutrition } from "../nutrition/mealCalculator.js";
import { createNutritionRecommendations } from "../ai/nutritionCoach.js";

function calculateWorkoutSummary(workoutSessions = []) {
  const sessions = Array.isArray(workoutSessions) ? workoutSessions : [];
  const totalCalories = sessions.reduce(
    (sum, session) => sum + Number(session.caloriesBurned || session.calories_burned || session.calories || 0),
    0
  );
  const totalDuration = sessions.reduce(
    (sum, session) => sum + Number(session.durationMinutes || session.duration_minutes || 0),
    0
  );
  const totalExercises = sessions.reduce(
    (sum, session) => sum + Number(session.totalExercises || session.total_exercises || 0),
    0
  );

  return {
    sessions,
    totalCalories,
    totalDuration,
    totalExercises,
  };
}

export async function loadNutritionSummary() {
  const profile = loadStoredProfile();
  const mealLogs = await fetchTodayMealLogs();
  const waterLogs = await fetchTodayWaterLogs();
  const workoutSessions = await fetchTodayWorkoutSessions();

  const targets = calculateNutritionTargets(profile);
  const dailyNutrition = calculateDailyNutrition(mealLogs, waterLogs);
  const workoutSummary = calculateWorkoutSummary(workoutSessions);
  const recommendations = createNutritionRecommendations(profile, mealLogs, workoutSummary.totalCalories);

  return {
    profile,
    targets,
    dailyNutrition,
    meals: mealLogs,
    waterLogs,
    workoutSummary,
    recommendations,
  };
}
