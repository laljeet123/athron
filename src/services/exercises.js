import {
  fetchExercises as loadExercises,
  fetchExerciseById as loadExerciseById,
  fetchExerciseCategories as loadExerciseCategories,
  fetchExerciseCategoryById as loadExerciseCategoryById,
  fetchMusclesByCategory as loadMusclesByCategory,
  fetchMuscleById as loadMuscleById,
  fetchExercisesBySelection as loadExercisesBySelection,
} from "./exerciseService.js";

export async function fetchExercises(bodyPartId, workoutType) {
  return loadExercises(bodyPartId, workoutType);
}

export async function fetchExerciseById(exerciseId) {
  return loadExerciseById(exerciseId);
}

export async function fetchExerciseCategories() {
  return loadExerciseCategories();
}

export async function fetchExerciseCategoryById(categoryId) {
  return loadExerciseCategoryById(categoryId);
}

export async function fetchMusclesByCategory(categoryId) {
  return loadMusclesByCategory(categoryId);
}

export async function fetchMuscleById(muscleId) {
  return loadMuscleById(muscleId);
}

export async function fetchExercisesBySelection(categoryId, muscleId, workoutType) {
  return loadExercisesBySelection(categoryId, muscleId, workoutType);
}
