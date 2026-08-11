import { loadStoredProfile } from "../services/localProfile.js";
import { loadNutritionSummary } from "../services/nutrition.js";
import { fetchTodayWorkoutSessions } from "../services/workouts.js";
import { fetchUserMeasurements, fetchProgressLogs, fetchUserGoals, fetchAchievements } from "../services/progress.js";
import { getLatestFormResult } from "./conversationMemory.js";
import { getWorkoutContextSnapshot } from "../context/WorkoutContextHelpers.js";
import { fetchAiMemory } from "../services/aiMemory.js";

export async function buildAthronContext(intent, userId) {
  const context = { userId, profile: null, nutrition: null, workout: null, form: null, memory: [] };

  // profile available for most intents
  context.profile = loadStoredProfile();

  if (intent === "CALORIES" || intent === "NUTRITION" || intent === "PROTEIN") {
    context.nutrition = await loadNutritionSummary();
    context.workout = await fetchTodayWorkoutSessions();
  }

  if (intent === "WORKOUT" || intent === "WORKOUT_CONTROL" || intent === "EXERCISE") {
    // snapshot helper will read from WorkoutContext and session history
    context.workout = await getWorkoutContextSnapshot();
  }

  if (intent === "FORM_CHECK") {
    context.form = await getLatestFormResult(userId);
  }

  if (intent === "PROGRESS") {
    // load lightweight progress data
    context.progress = {
      workouts: await fetchTodayWorkoutSessions(),
      measurements: await fetchUserMeasurements(),
      progressLogs: await fetchProgressLogs(),
      goals: await fetchUserGoals(),
      achievements: await fetchAchievements(),
    };
  }

  try {
    context.memory = await fetchAiMemory(15);
  } catch {
    context.memory = [];
  }

  return context;
}
