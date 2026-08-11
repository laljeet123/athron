const STORAGE_KEY = "athron_workout_history";

function loadWorkoutHistory() {
  if (typeof window === "undefined") return [];
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn("Failed to load workout history from localStorage", error);
    return [];
  }
}

function saveWorkoutHistory(history) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch (error) {
    console.warn("Failed to save workout history to localStorage", error);
  }
}

export async function fetchWorkoutHistory({ supabaseClient } = {}) {
  if (supabaseClient && typeof supabaseClient.from === "function") {
    try {
      const { data, error } = await supabaseClient
        .from("workout_sessions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []).map((record) => ({
        ...record,
        id: record.id || record.user_id || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: record.workout_name ?? record.name,
        workoutName: record.workout_name ?? record.workoutName,
        calories: record.calories_burned ?? record.calories,
        caloriesBurned: record.calories_burned ?? record.caloriesBurned,
        durationMinutes: record.duration_minutes ?? record.durationMinutes,
        totalExercises: record.total_exercises ?? record.totalExercises,
        createdAt: record.created_at ?? record.createdAt,
        completedAt: record.completed_at ?? record.completedAt,
      }));
    } catch (err) {
      console.warn("Supabase workout history fetch failed", err);
      return loadWorkoutHistory();
    }
  }

  return loadWorkoutHistory();
}

export async function fetchTodayWorkoutSessions(options = {}) {
  const sessions = await fetchWorkoutHistory(options);
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  return sessions.filter((session) => {
    const completedAt = session.completedAt || session.createdAt || session.completed_at || session.created_at;
    if (!completedAt) return false;
    const sessionDate = new Date(completedAt);
    return sessionDate >= todayStart;
  });
}

export async function persistWorkoutSession(session, { supabaseClient } = {}) {
  if (!session || !session.workoutName) throw new Error("Invalid session: 'workoutName' is required");

  const normalizedSession = {
    id: session.id || `workout-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    workoutName: session.workoutName,
    bodyPartId: session.bodyPartId || null,
    bodyPartName: session.bodyPartName || session.name || "Workout",
    durationMinutes: session.durationMinutes || 0,
    caloriesBurned: session.caloriesBurned || 0,
    totalExercises: session.totalExercises || 0,
    completedAt: session.completedAt || new Date().toISOString(),
    createdAt: session.createdAt || new Date().toISOString(),
    exercises: session.exercises || [],
  };

  const nextHistory = [normalizedSession, ...loadWorkoutHistory()].slice(0, 50);
  saveWorkoutHistory(nextHistory);

  return { persisted: false, source: "local", history: nextHistory, session: normalizedSession };
}
