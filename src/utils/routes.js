export const ROUTES = {
  DASHBOARD: "/",
  WORKOUT: "/workout",
  WORKOUT_SELECT: "/workout/select",
  WORKOUT_DETAILS: (bodyPartId, bodyPartName) =>
    `/workout/${bodyPartId}/${encodeURIComponent(bodyPartName)}`,
  WORKOUT_BUILDER: "/workout/builder",
  WORKOUT_ACTIVE: "/workout/active",
  WORKOUT_HISTORY: "/workout/history",
  EXERCISES: (bodyPartId, bodyPartName, workoutType) =>
    `/exercises/${bodyPartId}/${encodeURIComponent(bodyPartName)}/${encodeURIComponent(
      workoutType
    )}`,
  EXERCISES_CATALOG: "/exercises/catalog",
  EXERCISE_CATEGORY: (categoryId) => `/exercises/catalog/${categoryId}`,
  EXERCISE_MUSCLE: (categoryId, muscleId) => `/exercises/catalog/${categoryId}/${muscleId}`,
  EXERCISE_LIST: (categoryId, muscleId, workoutType) =>
    `/exercises/catalog/${categoryId}/${muscleId}/${encodeURIComponent(workoutType)}`,
  FORM_CHECKER: (exerciseId) => (exerciseId ? `/form-checker/${exerciseId}` : "/form-checker"),
  AI: "/ai",
  NUTRITION: "/nutrition",
  PROGRESS: "/progress",
  PROFILE: "/profile",
};
