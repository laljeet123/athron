export function secondsToDuration(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs.toString().padStart(2, "0")}s`;
}

export function formatWorkoutDate(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function calculateWorkoutCalories(exercises = []) {
  if (!Array.isArray(exercises)) return 0;
  return exercises.reduce((sum, exercise) => {
    const base = Number(exercise.calories || 0);
    const sets = Number(exercise.sets || 0);
    const reps = Number(exercise.reps || 0);
    return sum + base * sets * reps * 0.01;
  }, 0);
}
