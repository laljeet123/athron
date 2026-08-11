import { VOICE_COMMANDS } from "./voiceCommandProcessor.js";

const WORKOUT_TEMPLATES = {
  [VOICE_COMMANDS.START_WORKOUT]: (state) => {
    const workoutName = state?.workoutName || "fitness";
    const firstExercise = state?.currentExercise?.name || "your first exercise";
    const reps = state?.currentExercise?.reps || 10;
    return `Starting your ${workoutName} workout. Your first exercise is ${firstExercise}. Complete ${reps} reps.`;
  },
  [VOICE_COMMANDS.PAUSE_WORKOUT]: () => "Pausing your workout. Catch your breath and say resume when you are ready.",
  [VOICE_COMMANDS.RESUME_WORKOUT]: () => "Resuming your workout. Keep your form tight and controlled.",
  [VOICE_COMMANDS.FINISH_WORKOUT]: () => "Great job. Your workout is complete. Take a moment to recover.",
  [VOICE_COMMANDS.NEXT_EXERCISE]: (state) => {
    const nextExercise = state?.nextExercise?.name || "the next exercise";
    const reps = state?.nextExercise?.reps || 10;
    return `Moving to ${nextExercise}. Complete ${reps} controlled repetitions.`;
  },
  [VOICE_COMMANDS.PREVIOUS_EXERCISE]: () => "Going back to the previous exercise. Keep your energy steady.",
  [VOICE_COMMANDS.COMPLETE_SET]: (state) => {
    const nextExercise = state?.nextExercise?.name;
    if (nextExercise) {
      return `Set complete. Your next exercise is ${nextExercise}.`; 
    }
    return "Set complete. Great work — you have finished the workout.";
  },
  [VOICE_COMMANDS.REPEAT_INSTRUCTIONS]: (state) => state?.currentExercise?.description || "Repeat the instructions for the current exercise.",
  [VOICE_COMMANDS.HOW_MANY_REPS]: (state) => {
    const reps = state?.currentExercise?.reps || 10;
    return `This exercise is ${reps} repetitions. Stay steady and keep the pace.`;
  },
  [VOICE_COMMANDS.CHECK_FORM]: () => "Opening the camera. Analyzing your form now.",
  [VOICE_COMMANDS.ANALYZE_POSTURE]: () => "Analyzing your posture. Keep still while I check your alignment.",
  [VOICE_COMMANDS.START_CAMERA]: () => "Camera activated. Ready to capture your form.",
  [VOICE_COMMANDS.START_TIMER]: (state) => {
    const seconds = state?.timerSeconds || 60;
    return `Starting a ${seconds}-second timer.`;
  },
  [VOICE_COMMANDS.STOP_TIMER]: () => "Stopping the timer. Let me know when you want to restart.",
  [VOICE_COMMANDS.SHOW_PROTEIN]: (state) => {
    const protein = state?.nutrition?.dailyNutrition?.protein_g ?? 0;
    const target = state?.nutrition?.targets?.proteinTarget;
    if (target) {
      return `You have consumed ${Math.round(protein)} g of protein today out of a ${Math.round(target)} g target.`;
    }
    return "I need your profile and some logged meals to calculate protein progress.";
  },
  [VOICE_COMMANDS.SHOW_CALORIES]: (state) => {
    const calories = state?.nutrition?.dailyNutrition?.calories ?? 0;
    const target = state?.nutrition?.targets?.dailyCalories;
    if (target) {
      return `You have consumed ${Math.round(calories)} kcal so far. Your daily target is ${Math.round(target)} kcal.`;
    }
    return "I need your profile and logged meals to calculate calorie progress.";
  },
  [VOICE_COMMANDS.SHOW_WATER]: (state) => {
    const water = state?.nutrition?.dailyNutrition?.water_ml ?? 0;
    return `You have logged ${Math.round(water)} ml of water today. Keep hydrating consistently.`;
  },
  [VOICE_COMMANDS.SHOW_NUTRITION]: (state) => {
    const nutrition = state?.nutrition;
    if (!nutrition?.targets) {
      return "I need your profile and meal log to give personalized nutrition guidance.";
    }

    const { dailyNutrition, targets } = nutrition;
    return `Today you've consumed ${Math.round(dailyNutrition.calories)} kcal, ${Math.round(dailyNutrition.protein_g)} g protein, ${Math.round(dailyNutrition.carbs_g)} g carbs, and ${Math.round(dailyNutrition.fat_g)} g fat. Your daily targets are ${Math.round(targets.dailyCalories)} kcal, ${Math.round(targets.proteinTarget)} g protein, ${Math.round(targets.carbsTarget)} g carbs, and ${Math.round(targets.fatTarget)} g fat.`;
  },
  [VOICE_COMMANDS.UNKNOWN]: () => "I didn’t catch that. Try saying start workout, next exercise, or check my form.",
};

export function createAiResponse(command, state = {}) {
  const template = WORKOUT_TEMPLATES[command] || WORKOUT_TEMPLATES[VOICE_COMMANDS.UNKNOWN];
  return template(state);
}
